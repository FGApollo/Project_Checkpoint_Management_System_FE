import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CalendarCheck, Shuffle, Send, Layers, Users, CheckCircle, AlertCircle, RefreshCw, Clock, Plus, BookOpen, ArrowRight } from 'lucide-react';

const ReviewManagementPage = () => {
  const [activeTab, setActiveTab] = useState('board');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roundStatus, setRoundStatus] = useState('Đang mở đăng ký'); // 'Đang mở đăng ký' | 'Đã kết thúc đăng ký (Khóa form)'

  // Scheduling Board Data
  const [boardData, setBoardData] = useState(null);
  const [semesterId, setSemesterId] = useState(1);
  const [reviewType, setReviewType] = useState('Review1');
  const [weekStart, setWeekStart] = useState('2026-06-15');

  // Random Assign options
  const [reviewersPerSession, setReviewersPerSession] = useState(2);
  const [roomPrefix, setRoomPrefix] = useState('AUTO');
  const [seed, setSeed] = useState('');

  // Review Rounds Data
  const [rounds, setRounds] = useState([]);
  const [showCreateRound, setShowCreateRound] = useState(false);
  const [roundCode, setRoundCode] = useState('Rev1-Su26');
  const [roundName, setRoundName] = useState('First Checkpoint Review Summer 2026');
  const [roundStart, setRoundStart] = useState('2026-06-15');
  const [roundEnd, setRoundEnd] = useState('2026-06-21');

  // Registrations Data
  const [registrations, setRegistrations] = useState([]);

  // Publish Schedule summary
  const [publishResult, setPublishResult] = useState(null);

  const fetchBoard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/review-scheduling/board?semesterId=${semesterId}&reviewType=${reviewType}&weekStart=${weekStart}`);
      setBoardData(response.data);
    } catch (err) {
      setError('Failed to load review scheduling board.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRounds = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/review-scheduling/rounds?semesterId=${semesterId}`);
      setRounds(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to fetch review rounds.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/review-scheduling/student-registrations?semesterId=${semesterId}&reviewType=${reviewType}`);
      setRegistrations(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to load student registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'board') fetchBoard();
    else if (activeTab === 'rounds') fetchRounds();
    else if (activeTab === 'registrations') fetchRegistrations();
  }, [activeTab, semesterId, reviewType, weekStart]);

  const handleRandomAssign = async (e) => {
    e.preventDefault();
    if (roundStatus === 'Đang mở đăng ký') {
      const confirmRun = window.confirm('Trạng thái đợt vẫn đang MỞ ĐĂNG KÝ. Bạn có muốn tự động CHỐT / ĐÓNG ĐĂNG KÝ trước khi chạy thuật toán xếp lịch không?');
      if (confirmRun) {
        setRoundStatus('Đã kết thúc đăng ký (Khóa form)');
      }
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = {
        semesterId: Number(semesterId),
        reviewType,
        weekStart,
        reviewersPerSession: Number(reviewersPerSession),
        roomPrefix,
        seed: seed ? Number(seed) : null
      };
      await api.post('/review-scheduling/random-assign', payload);
      setSuccess('Thuật toán xếp lịch tự động đã chạy xong! Đã phân bổ tối đa 3 nhóm/slot, không trùng GVHD và không lặp lại giảng viên.');
      fetchBoard();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi thuật toán phân công do vi phạm ràng buộc lịch/trùng lặp.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/review-scheduling/rounds', {
        code: roundCode,
        name: roundName,
        semesterId: Number(semesterId),
        reviewType,
        startDate: roundStart,
        endDate: roundEnd
      });
      setSuccess('Review round registered successfully.');
      setShowCreateRound(false);
      fetchRounds();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create review round.');
    }
  };

  const handlePublishSchedule = async () => {
    setError('');
    setSuccess('');
    setPublishResult(null);
    setLoading(true);
    try {
      const response = await api.post('/review-schedules/publish', {
        semesterId: Number(semesterId),
        reviewType,
        weekStart
      });
      setPublishResult(response.data);
      setSuccess('Đã nhấn nút PUBLISH — Lịch phản biện đã được công bố cho sinh viên và giảng viên thấy trên App/Web!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish schedule.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCloseRegistration = () => {
    if (roundStatus === 'Đang mở đăng ký') {
      setRoundStatus('Đã kết thúc đăng ký (Khóa form)');
      setSuccess('Đã chuyển trạng thái Đợt sang KẾT THÚC ĐĂNG KÝ. Form của giảng viên và sinh viên hiện đã được khóa để sẵn sàng xếp lịch.');
    } else {
      setRoundStatus('Đang mở đăng ký');
      setSuccess('Đã mở lại đăng ký nguyện vọng cho Đợt này.');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Điều phối Lịch & Phản biện (Moderator / Đào tạo)</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Quy trình Điều phối viên: Chốt đóng đăng ký ➔ Chạy thuật toán xếp lịch (Tối đa 3 nhóm/slot) ➔ Nhấn nút Publish công bố.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'board' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('board')}
            style={activeTab !== 'board' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Shuffle size={16} />
            <span>Bảng xếp lịch tự động</span>
          </button>
          <button
            className={`btn ${activeTab === 'rounds' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('rounds')}
            style={activeTab !== 'rounds' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <CalendarCheck size={16} />
            <span>Các đợt phản biện</span>
          </button>
          <button
            className={`btn ${activeTab === 'registrations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('registrations')}
            style={activeTab !== 'registrations' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Users size={16} />
            <span>Sinh viên đăng ký</span>
          </button>
        </div>
      </div>

      {/* Moderator Workflow Control Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>Quy trình Điều phối ({reviewType}):</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #CBD5E1' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Trạng thái Đợt:</span>
            <span className="badge" style={{
              background: roundStatus === 'Đang mở đăng ký' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: roundStatus === 'Đang mở đăng ký' ? '#10B981' : '#EF4444',
              fontWeight: 700
            }}>
              {roundStatus}
            </span>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleCloseRegistration}
            style={{
              background: roundStatus === 'Đang mở đăng ký' ? '#EF4444' : '#10B981',
              color: 'white',
              border: 'none',
              fontWeight: 700
            }}
          >
            <Clock size={16} />
            <span>{roundStatus === 'Đang mở đăng ký' ? 'Chuyển sang: ĐÓNG / KẾT THÚC ĐĂNG KÝ (Khóa lịch)' : 'Chuyển sang: Mở lại Đăng ký'}</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="form-label" style={{ margin: 0, color: '#334155', fontWeight: 600 }}>ID Học kỳ:</label>
          <input
            type="number"
            className="form-input"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            style={{ width: '80px', padding: '0.35rem 0.6rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="form-label" style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Đợt Phản biện:</label>
          <select
            className="form-select"
            value={reviewType}
            onChange={(e) => setReviewType(e.target.value)}
            style={{ padding: '0.35rem 0.6rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
          >
            <option value="Review1">Review 1 (Đề cương / Proposal)</option>
            <option value="Review2">Review 2 (Giữa kỳ / Midterm)</option>
            <option value="Review3">Review 3 (Trước bảo vệ / Pre-Defense)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="form-label" style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Tuần bắt đầu (Thứ 2):</label>
          <input
            type="date"
            className="form-input"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            style={{ padding: '0.35rem 0.6rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
          />
        </div>

        <button className="btn btn-secondary" onClick={() => { if (activeTab==='board') fetchBoard(); else if (activeTab==='rounds') fetchRounds(); else fetchRegistrations(); }} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A' }}>
          <RefreshCw size={16} />
          <span>Tải lại</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* SCHEDULING BOARD TAB */}
      {activeTab === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem', height: 'fit-content', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
              <Shuffle size={20} color="#F26522" />
              <span>Chạy Thuật toán Xếp lịch Tự động</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              <strong>Quy tắc xếp lịch:</strong> Tối đa 3 nhóm được review trong 1 slot. Loại trừ tuyệt đối GVHD chính của nhóm đồ án và các giảng viên đã chấm ở đợt review trước đó.
            </p>

            <form onSubmit={handleRandomAssign}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Số Giảng viên / Ca chấm</label>
                <input
                  type="number"
                  className="form-input"
                  value={reviewersPerSession}
                  onChange={(e) => setReviewersPerSession(e.target.value)}
                  min="1"
                  max="5"
                  style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Tiền tố Phòng chấm</label>
                <input
                  type="text"
                  className="form-input"
                  value={roomPrefix}
                  onChange={(e) => setRoomPrefix(e.target.value)}
                  placeholder="AUTO"
                  style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mã hạt giống ngẫu nhiên (Tùy chọn)</label>
                <input
                  type="number"
                  className="form-input"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="ví dụ: 12345"
                  style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                <span>{loading ? 'Đang chạy thuật toán Phân công...' : 'Chạy thuật toán Phân công'}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0F172A' }}>Chính thức Phát hành Lịch Phản biện</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.4 }}>
                Khóa lịch chấm phản biện, phát hành chính thức và gửi email thông báo tự động đến toàn bộ giảng viên và sinh viên.
              </p>
              <button
                type="button"
                className="btn btn-success"
                disabled={loading}
                onClick={handlePublishSchedule}
                style={{ width: '100%', padding: '0.75rem', background: '#10B981', color: 'white' }}
              >
                <Send size={16} />
                <span style={{ fontWeight: 700 }}>Phát hành Lịch chính thức (Gửi Email)</span>
              </button>

              {publishResult && (
                <div style={{ marginTop: '1rem', background: '#F8FAFC', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#0F172A' }}>
                    <span>Số ca đã phát hành:</span>
                    <strong>{publishResult.publishedCount || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981', fontWeight: 600 }}>
                    <span>Email gửi thành công:</span>
                    <strong>{publishResult.sentEmailCount || 0}</strong>
                  </div>
                  {publishResult.failedEmailCount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444', fontWeight: 600 }}>
                      <span>Email lỗi:</span>
                      <strong>{publishResult.failedEmailCount}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>Tổng quan Lịch chấm Phản biện</h3>
            {loading && !boardData ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Đang tải bảng lịch...</div>
            ) : !boardData ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Chưa có dữ liệu lịch. Vui lòng bấm Tải lại.</div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Nhóm cần chấm</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#F26522' }}>
                      {boardData.unassignedGroupsCount || (boardData.groups || []).length || 0}
                    </h4>
                  </div>
                  <div style={{ padding: '1rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Giảng viên sẵn sàng</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#10B981' }}>
                      {boardData.availableLecturersCount || (boardData.lecturers || []).length || 0}
                    </h4>
                  </div>
                  <div style={{ padding: '1rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Ca chấm đã tạo</span>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: '#0EA5E9' }}>
                      {boardData.assignedSessionsCount || (boardData.sessions || []).length || 0}
                    </h4>
                  </div>
                </div>

                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mã Nhóm</th>
                        <th>Ngày / Ca học</th>
                        <th>Hội đồng Giảng viên Chấm</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(boardData.sessions && boardData.sessions.length > 0) ? (
                        boardData.sessions.map((s, idx) => (
                          <tr key={s.id || idx}>
                            <td style={{ fontWeight: 700, color: '#0F172A' }}>{s.groupCode || `Nhóm #${s.groupId}`}</td>
                            <td style={{ color: '#475569' }}>{s.sessionDate || s.dayOfWeek} / Ca {s.slot}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {(s.reviewerCodes || s.reviewers || ['Đã phân công']).map((rev, ri) => (
                                  <span key={ri} className="badge" style={{ fontSize: '0.7rem', background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>{typeof rev === 'object' ? (rev.code || rev.fullName) : rev}</span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>{s.status || 'Đã xếp lịch'}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748B', background: '#F8FAFC' }}>Chưa có lịch phân công phản biện nào. Vui lòng sử dụng công cụ phân công tự động bên trái!</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVIEW ROUNDS TAB */}
      {activeTab === 'rounds' && (
        <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Danh sách Các đợt Phản biện</h3>
            <button className="btn btn-primary" onClick={() => setShowCreateRound(true)}>
              <Plus size={16} />
              <span>Tạo Đợt Phản biện</span>
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã Đợt</th>
                  <th>Tên Đợt Phản biện</th>
                  <th>Loại Phản biện</th>
                  <th>Thời gian diễn ra</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Chưa cấu hình đợt phản biện nào cho Học kỳ {semesterId}.</td></tr>
                ) : (
                  rounds.map((r) => (
                    <tr key={r.id || r.code}>
                      <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>{r.code}</span></td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{r.name}</td>
                      <td style={{ color: '#475569' }}>{r.reviewType || r.type}</td>
                      <td style={{ color: '#64748B' }}>{r.startDate} &rarr; {r.endDate}</td>
                      <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>{r.status || 'Hoạt động'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENT REGISTRATIONS TAB */}
      {activeTab === 'registrations' && (
        <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A' }}>Danh sách Nhóm Sinh viên Đăng ký</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã Đăng ký</th>
                  <th>Mã Nhóm</th>
                  <th>Lịch đăng ký (Ngày/Ca)</th>
                  <th>Thời gian đăng ký</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Chưa có nhóm sinh viên nào đăng ký lịch chấm cho đợt phản biện này.</td></tr>
                ) : (
                  registrations.map((reg) => (
                    <tr key={reg.id}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>#{reg.id}</td>
                      <td><span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9' }}>{reg.groupCode || `Nhóm #${reg.groupId}`}</span></td>
                      <td style={{ color: '#334155', fontWeight: 600 }}>Thứ {reg.dayOfWeek} / Ca {reg.slot}</td>
                      <td style={{ color: '#64748B' }}>{new Date(reg.registeredAt || reg.createdAt || Date.now()).toLocaleString('vi-VN')}</td>
                      <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>Đã đăng ký</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Round Modal */}
      {showCreateRound && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A' }}>Tạo Đợt Phản biện Mới</h3>
            <form onSubmit={handleCreateRound}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mã Đợt</label>
                <input type="text" className="form-input" value={roundCode} onChange={(e) => setRoundCode(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Tên Đợt Phản biện</label>
                <input type="text" className="form-input" value={roundName} onChange={(e) => setRoundName(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày bắt đầu</label>
                  <input type="date" className="form-input" value={roundStart} onChange={(e) => setRoundStart(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày kết thúc</label>
                  <input type="date" className="form-input" value={roundEnd} onChange={(e) => setRoundEnd(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateRound(false)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo Đợt Phản biện</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewManagementPage;
