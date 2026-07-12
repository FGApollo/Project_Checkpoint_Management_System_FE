import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import signalRService from '../../services/signalr';
import { Gavel, Play, Square, Send, Camera, UploadCloud, Users, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Lock, Unlock, Award, Eye, Clock } from 'lucide-react';

const DefenseRoomPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mySessions, setMySessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(searchParams.get('session') || '');

  // Session State from SignalR / REST
  const [sessionState, setSessionState] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [isChairman, setIsChairman] = useState(false);
  const [connectedMembers, setConnectedMembers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected'); // Disconnected | Connecting | Connected

  // Judge Scores Form: { studentId: { chamBaoVe: 8.0, chamNguoi: 8.5 } }
  const [scores, setScores] = useState({});

  // Evidence Gallery
  const [evidences, setEvidences] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);

  // UI Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all my board sessions initially
  useEffect(() => {
    const fetchBoardSessions = async () => {
      try {
        const response = await api.get('/defense-management/my-board-sessions');
        const list = Array.isArray(response.data) ? response.data : [];
        setMySessions(list);
        if (!selectedSessionId && list.length > 0) {
          setSelectedSessionId(list[0].id || list[0].code);
        }
      } catch (err) {
        console.error('Failed to load my board sessions:', err);
      }
    };
    fetchBoardSessions();
  }, []);

  // Connect & Join Room when `selectedSessionId` changes
  useEffect(() => {
    if (!selectedSessionId) return;

    let isMounted = true;
    const initRoom = async () => {
      setLoading(true);
      setError('');
      setConnectionStatus('Connecting');
      try {
        // 1. Resolve Session details from REST to ensure full state & students list
        const res = await api.get(`/defense-sessions/resolve/${selectedSessionId}`);
        if (!isMounted) return;
        const data = res.data;
        setSessionState(data);
        setIsChairman(Boolean(data.isChairman || (user && user.id === data.chairmanId)));
        
        const stList = Array.isArray(data.students) ? data.students : [
          { id: 101, code: 'SE190001', fullName: 'Nguyen Van A' },
          { id: 102, code: 'SE190002', fullName: 'Tran Thi B' },
          { id: 103, code: 'SE190003', fullName: 'Le Van C' }
        ];
        setStudentsList(stList);

        // Initialize default score matrix
        const initScores = {};
        stList.forEach((st) => {
          initScores[st.id] = {
            chamBaoVe: st.chamBaoVe || 8.0,
            chamNguoi: st.chamNguoi || 8.5
          };
        });
        setScores(initScores);

        // Fetch evidences
        const evRes = await api.get(`/defense-sessions/${data.id || selectedSessionId}/evidences`).catch(() => ({ data: [] }));
        if (isMounted) setEvidences(Array.isArray(evRes.data) ? evRes.data : []);

        // 2. Connect via SignalR
        try {
          await signalRService.startConnection();
          await signalRService.joinSession(data.id || selectedSessionId);
          if (isMounted) {
            setConnectionStatus('Connected');
            setConnectedMembers([{ lecturerId: user?.id || 1, fullName: user?.fullName || 'Me (Connected)' }]);
          }
        } catch (hubErr) {
          console.warn('SignalR Hub join warning (running in REST mode):', hubErr);
          if (isMounted) setConnectionStatus('REST Only');
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.error || 'Failed to resolve defense session.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initRoom();

    // SignalR Event Handlers
    const handleMemberJoined = (data) => {
      if (!isMounted) return;
      setConnectedMembers((prev) => {
        if (prev.some((m) => m.lecturerId === data.lecturerId)) return prev;
        return [...prev, data];
      });
    };

    const handleSessionStarted = (data) => {
      if (!isMounted) return;
      setSessionState((prev) => prev ? { ...prev, startedAt: data.startedAt || new Date().toISOString() } : prev);
      setSuccess('Defense session scoring officially started by Chairman!');
    };

    const handleSessionClosed = (data) => {
      if (!isMounted) return;
      setSessionState((prev) => prev ? { ...prev, isLocked: true, endedAt: data.closedAt || new Date().toISOString() } : prev);
      setSuccess('Defense session officially closed & locked by Chairman.');
    };

    const handleScoreSubmitted = (data) => {
      if (!isMounted) return;
      setSuccess(`Judge ${data.scorerName || 'Member'} submitted scores successfully.`);
    };

    signalRService.on('memberJoined', handleMemberJoined);
    signalRService.on('defenseSessionStarted', handleSessionStarted);
    signalRService.on('defenseSessionClosed', handleSessionClosed);
    signalRService.on('scoreSubmitted', handleScoreSubmitted);

    return () => {
      isMounted = false;
      signalRService.off('memberJoined', handleMemberJoined);
      signalRService.off('defenseSessionStarted', handleSessionStarted);
      signalRService.off('defenseSessionClosed', handleSessionClosed);
      signalRService.off('scoreSubmitted', handleScoreSubmitted);
    };
  }, [selectedSessionId]);

  const handleScoreChange = (studentId, field, val) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val
      }
    }));
  };

  const handleStartScoring = async () => {
    if (!sessionState || !isChairman) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post(`/defense-sessions/${sessionState.id}/start`);
      setSessionState({ ...sessionState, startedAt: new Date().toISOString() });
      setSuccess('Scoring session started (`POST /start`). Council judges can now submit.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start defense scoring.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseScoring = async () => {
    if (!sessionState || !isChairman) return;
    if (!window.confirm('Are you certain you want to officially close and lock this defense session? Once closed, score edits are rejected by immutable database rules.')) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post(`/defense-sessions/${sessionState.id}/close`);
      setSessionState({ ...sessionState, isLocked: true, endedAt: new Date().toISOString() });
      setSuccess('Defense session closed and locked (`POST /close`).');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close session.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScoreForStudent = async (studentId) => {
    if (!sessionState) return;
    const stScore = scores[studentId];
    if (stScore.chamBaoVe < 0 || stScore.chamBaoVe > 10 || stScore.chamNguoi < 0 || stScore.chamNguoi > 10) {
      setError('Scores must strictly be between 0.0 and 10.0.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.post(`/defense-sessions/${sessionState.id}/scores`, {
        studentId: Number(studentId),
        chamBaoVe: Number(stScore.chamBaoVe),
        chamNguoi: Number(stScore.chamNguoi)
      });
      setSuccess(`Scores submitted for Student #${studentId}! Immutable audit log & score history appended.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Score submission rejected. Verify that the Chairman has started the session and that the session is not closed.');
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!sessionState || !uploadFile) return;
    setError('');
    setSuccess('');
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      await api.post(`/defense-sessions/${sessionState.id}/evidences`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Defense evidence photo uploaded successfully!');
      setUploadFile(null);
      const evRes = await api.get(`/defense-sessions/${sessionState.id}/evidences`);
      setEvidences(Array.isArray(evRes.data) ? evRes.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload evidence.');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Phòng Chấm điểm Bảo vệ Trực tuyến (SignalR Live Room)</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Hệ thống chấm điểm hội đồng thời gian thực với điều khiển của Chủ tịch, ma trận điểm thành viên (`0-10`) và hồ sơ minh chứng.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', borderRadius: '9999px', background: connectionStatus === 'Connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', border: '1px solid #CBD5E1' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connectionStatus === 'Connected' ? '#10B981' : '#F59E0B' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: connectionStatus === 'Connected' ? '#10B981' : '#F59E0B' }}>
              Phòng trực tuyến: {connectionStatus === 'Connected' ? 'Đã kết nối' : connectionStatus === 'Connecting' ? 'Đang kết nối...' : 'Chưa kết nối'}
            </span>
          </div>

          <select
            className="form-select"
            value={selectedSessionId}
            onChange={(e) => { setSelectedSessionId(e.target.value); setSearchParams({ session: e.target.value }); }}
            style={{ minWidth: '220px', fontWeight: 600, background: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1' }}
          >
            <option value="">-- Chọn Phiên Bảo vệ Checkpoint --</option>
            {mySessions.map((s) => (
              <option key={s.id} value={s.id || s.code}>
                {s.code || `Phiên #${s.id}`} — {s.sessionDate} (Ca {s.slot})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {!sessionState ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Gavel size={48} color="#F26522" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Chọn một Phiên Bảo vệ để Tham gia</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', maxWidth: '420px', margin: '0.5rem auto 0', lineHeight: 1.5 }}>
            Vui lòng chọn một ca bảo vệ được phân công cho hội đồng của bạn từ danh sách bên trên.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          {/* Main Scoring Matrix & Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Session Header Bar */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid #F26522', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontSize: '0.8rem', fontWeight: 700 }}>{sessionState.sessionCode || sessionState.code || `#${sessionState.id}`}</span>
                  {isChairman && (
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>
                      <Award size={14} /> Chủ tịch Hội đồng
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                  Phiên Bảo vệ Checkpoint: Nhóm {sessionState.groupCode || `#${sessionState.groupId}`}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Ngày: {sessionState.sessionDate} — Ca {sessionState.slot} — Phòng: {sessionState.room || 'N/A'}
                </p>
              </div>

              {/* CHAIRMAN ONLY CONTROLS BAR */}
              {isChairman ? (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {!sessionState.startedAt && !sessionState.isLocked && (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={handleStartScoring}
                      disabled={loading}
                      style={{ padding: '0.75rem 1.25rem', background: '#10B981', color: 'white', fontWeight: 700, boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
                    >
                      <Play size={16} />
                      <span>Bắt đầu Phiên Chấm điểm</span>
                    </button>
                  )}

                  {sessionState.startedAt && !sessionState.isLocked && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleCloseScoring}
                      disabled={loading}
                      style={{ padding: '0.75rem 1.25rem', background: '#EF4444', color: 'white', fontWeight: 700 }}
                    >
                      <Square size={16} />
                      <span>Chốt & Khóa Phiên Chấm</span>
                    </button>
                  )}

                  {sessionState.isLocked && (
                    <span className="badge" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontWeight: 700 }}>
                      <Lock size={16} /> Phiên Đã Chốt & Khóa điểm
                    </span>
                  )}
                </div>
              ) : (
                <div>
                  {sessionState.isLocked ? (
                    <span className="badge" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontWeight: 700 }}>
                      <Lock size={16} /> Phiên Đã Chốt & Khóa điểm
                    </span>
                  ) : sessionState.startedAt ? (
                    <span className="badge" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }}>
                      <Unlock size={16} /> Đang Chấm điểm (Chủ tịch đã mở phiên)
                    </span>
                  ) : (
                    <span className="badge" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 700 }}>
                      <Clock size={16} /> Đang chờ Chủ tịch mở phiên...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Students Matrix Table */}
            <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Phiếu Chấm điểm của Thành viên Hội đồng (`0.0 đến 10.0`)</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Đánh giá riêng biệt theo 2 tiêu chí: Điểm Bảo vệ Checkpoint chung (`ChamBaoVe`) và Điểm Hỏi đáp/Vấn đáp Cá nhân (`ChamNguoi`).
                  </p>
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã SV</th>
                      <th>Họ và tên Sinh viên</th>
                      <th style={{ minWidth: '180px' }}>Điểm Bảo vệ Checkpoint (ChamBaoVe)</th>
                      <th style={{ minWidth: '180px' }}>Điểm Vấn đáp Cá nhân (ChamNguoi)</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((st) => {
                      const stScores = scores[st.id] || { chamBaoVe: 8.0, chamNguoi: 8.5 };
                      const canScore = sessionState.startedAt && !sessionState.isLocked;
                      return (
                        <tr key={st.id}>
                          <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontSize: '0.8rem', fontWeight: 700 }}>{st.code || `#${st.id}`}</span></td>
                          <td style={{ fontWeight: 700, color: '#0F172A' }}>{st.fullName || st.name}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={stScores.chamBaoVe}
                                disabled={!canScore}
                                onChange={(e) => handleScoreChange(st.id, 'chamBaoVe', e.target.value)}
                                style={{ width: '90px' }}
                              />
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className="form-input"
                                value={stScores.chamBaoVe}
                                disabled={!canScore}
                                onChange={(e) => handleScoreChange(st.id, 'chamBaoVe', e.target.value)}
                                style={{ width: '64px', padding: '0.25rem 0.4rem', fontWeight: 700, color: '#F26522', background: '#F8FAFC', border: '1px solid #CBD5E1' }}
                              />
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={stScores.chamNguoi}
                                disabled={!canScore}
                                onChange={(e) => handleScoreChange(st.id, 'chamNguoi', e.target.value)}
                                style={{ width: '90px' }}
                              />
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                className="form-input"
                                value={stScores.chamNguoi}
                                disabled={!canScore}
                                onChange={(e) => handleScoreChange(st.id, 'chamNguoi', e.target.value)}
                                style={{ width: '64px', padding: '0.25rem 0.4rem', fontWeight: 700, color: '#10B981', background: '#F8FAFC', border: '1px solid #CBD5E1' }}
                              />
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={!canScore}
                              onClick={() => handleSubmitScoreForStudent(st.id)}
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                            >
                              <Send size={14} />
                              <span>Gửi Điểm (`POST`)</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Live Council Members & Evidence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Live Council Participants Panel */}
            <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                <Users size={18} color="#F26522" />
                <span>Thành viên đang Online ({connectedMembers.length})</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.4 }}>
                Chỉ thành viên thuộc hội đồng được phân công mới có thể truy cập phòng Live này.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {connectedMembers.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #CBD5E1' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{m.fullName || `Thành viên #${m.lecturerId}`}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Photo Upload / Gallery Panel */}
            <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                <Camera size={18} color="#10B981" />
                <span>Hình ảnh Minh chứng Bảo vệ</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.4 }}>
                Chụp ảnh hiện trường/lưu hồ sơ minh chứng phiên bảo vệ (`POST /evidences`).
              </p>

              <form onSubmit={handleUploadEvidence} style={{ marginBottom: '1.25rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  style={{ fontSize: '0.75rem', marginBottom: '0.5rem', width: '100%', color: '#0F172A' }}
                />
                <button type="submit" className="btn btn-secondary" disabled={!uploadFile} style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}>
                  <UploadCloud size={16} color="#F26522" />
                  <span>Tải lên Minh chứng</span>
                </button>
              </form>

              {evidences.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>Danh sách ảnh ({evidences.length})</span>
                  {evidences.map((ev, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F172A' }}>Minh chứng #{idx + 1}</span>
                      <a href={`http://localhost:5122${ev.url || ev.filePath || ''}`} target="_blank" rel="noopener noreferrer" className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 700, textDecoration: 'none' }}>
                        <Eye size={12} /> Xem ảnh
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default DefenseRoomPage;
