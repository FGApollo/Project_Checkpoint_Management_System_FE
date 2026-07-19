import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, Users, MessageSquare, FileText, Download, Save, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const ReviewScoringPage = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'comments' | 'evaluation'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Attendance & Comments State
  const [attendanceList, setAttendanceList] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Submission / Evaluation State
  const [submissionData, setSubmissionData] = useState(null);
  const [evalResult, setEvalResult] = useState('Pass'); // Pass | Fail | Defense2 | Drop
  const [evalScore, setEvalScore] = useState('8.5');
  const [evalNotes, setEvalNotes] = useState('');

  const fetchMySessions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/review-sessions/my');
      const list = Array.isArray(response.data) ? response.data : (response.data.items || []);
      setSessions(list);
      if (list.length > 0 && !selectedSession) {
        setSelectedSession(list[0]);
      }
    } catch (err) {
      setError('Failed to fetch assigned review sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySessions();
  }, []);

  const fetchSessionDetails = async (sess) => {
    if (!sess) return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'attendance') {
        const res = await api.get(`/review-attendance/${sess.id}`).catch(() => ({ data: [] }));
        setAttendanceList(Array.isArray(res.data) ? res.data : (res.data?.students || []));
      } else if (activeTab === 'comments') {
        const res = await api.get(`/review-attendance/${sess.id}/comments`).catch(() => ({ data: [] }));
        setCommentsList(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'evaluation') {
        const subId = sess.submissionId || sess.id;
        const res = await api.get(`/review-submissions/${subId}`).catch(() => ({ data: null }));
        if (res.data) {
          setSubmissionData(res.data);
          setEvalResult(res.data.result || 'Pass');
          setEvalScore(res.data.score || '8.5');
          setEvalNotes(res.data.notes || '');
        }
      }
    } catch (err) {
      setError('Failed to load details for selected tab.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSession) {
      fetchSessionDetails(selectedSession);
    }
  }, [selectedSession, activeTab]);

  const handleSaveAttendance = async () => {
    if (!selectedSession) return;
    setError('');
    setSuccess('');
    try {
      await api.post(`/review-attendance/${selectedSession.id}`, {
        groupId: Number(selectedSession.groupId),
        entries: attendanceList.map(item => ({
          studentId: Number(item.studentId || item.id),
          isPresent: Boolean(item.isPresent),
          note: item.note || ''
        }))
      });
      setSuccess('Student attendance records saved successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save attendance.');
    }
  };

  const handleToggleAttendance = (index) => {
    const updated = [...attendanceList];
    updated[index].isPresent = !updated[index].isPresent;
    setAttendanceList(updated);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!selectedSession || !newComment.trim()) return;
    setError('');
    setSuccess('');
    try {
      await api.post(`/review-attendance/${selectedSession.id}/comments`, {
        groupId: Number(selectedSession.groupId),
        content: newComment
      });
      setNewComment('');
      setSuccess('Checkpoint comment posted to group.');
      fetchSessionDetails(selectedSession);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit comment.');
    }
  };

  const handleSaveEvaluationDraft = async () => {
    if (!selectedSession) return;
    const subId = selectedSession.submissionId || selectedSession.id;
    setError('');
    setSuccess('');
    try {
      await api.put(`/review-submissions/${subId}/draft`, {
        workProductVersion: '1.0',
        workProductSize: 'Standard',
        effortHours: 10,
        reviewerComment: evalNotes,
        suggestion: evalNotes,
        resultText: evalResult || 'Pass',
        items: []
      });
      setSuccess('Đã lưu bản nháp nhận xét & đánh giá thành công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save review draft.');
    }
  };

  const handleSubmitEvaluationFinal = async () => {
    if (!selectedSession) return;
    const subId = selectedSession.submissionId || selectedSession.id;
    setError('');
    setSuccess('');
    try {
      await api.put(`/review-submissions/${subId}/draft`, {
        workProductVersion: '1.0',
        workProductSize: 'Standard',
        effortHours: 10,
        reviewerComment: evalNotes,
        suggestion: evalNotes,
        resultText: evalResult || 'Pass',
        items: []
      });
      await api.post(`/review-submissions/${subId}/submit`);
      setSuccess('Đã gửi KẾT QUẢ ĐÁNH GIÁ REVIEW! Nhận xét, kết quả đạt yêu cầu và điểm danh đã được nộp chính thức cho sinh viên.');
      fetchSessionDetails(selectedSession);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit final checkpoint review.');
    }
  };

  const handleDownloadReport = (ext) => {
    if (!selectedSession) return;
    const subId = selectedSession.submissionId || selectedSession.id;
    window.open(`http://localhost:5122/api/review-submissions/${subId}/export.${ext}`, '_blank');
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Nhận xét & Đánh giá Review Checkpoint</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Điểm danh sinh viên, nhập ý kiến nhận xét chuyên môn và đánh giá kết quả (Đạt yêu cầu / Không đạt).</p>
        </div>

        <button className="btn btn-secondary" onClick={fetchMySessions} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
          <RefreshCw size={16} color="#F26522" />
          <span style={{ fontWeight: 600 }}>Tải lại Danh sách Phân công</span>
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
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Sessions Sidebar List */}
        <div className="glass-card" style={{ padding: '1.25rem', height: 'fit-content', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
            <CheckSquare size={18} color="#F26522" />
            <span>Ca Review được Phân công ({sessions.length})</span>
          </h3>

          {loading && !sessions.length && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Đang tải...</div>
          )}
          {!loading && sessions.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
              Hiện chưa có lịch review nào được phân công cho bạn trong tuần này.
            </div>
          )}
          {sessions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sessions.map((sess) => {
                const isSelected = selectedSession?.id === sess.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setSelectedSession(sess)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'linear-gradient(135deg, #F26522, #FF7A00)' : '#F8FAFC',
                      color: isSelected ? 'white' : '#0F172A',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      border: `1px solid ${isSelected ? '#F26522' : '#CBD5E1'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{sess.groupCode || `Nhóm #${sess.groupId}`}</span>
                      <span className="badge" style={{ background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(242,101,34,0.12)', color: isSelected ? 'white' : '#F26522', fontWeight: 700 }}>
                        Ca {sess.slot}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: isSelected ? 0.95 : 0.75, margin: 0 }}>
                      {sess.sessionDate || sess.dayOfWeek} — Phòng {sess.room || 'TBD'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Session Work Area */}
        <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          {!selectedSession ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
              Vui lòng chọn một ca review từ danh sách bên trái để bắt đầu chấm điểm.
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                    Chấm điểm Checkpoint Nhóm {selectedSession.groupCode || `#${selectedSession.groupId}`}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    ID Ca: #{selectedSession.id} — Ngày: {selectedSession.sessionDate} — Phòng: {selectedSession.room || 'N/A'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => handleDownloadReport('xlsx')} title="Xuất Báo cáo (.xlsx)" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A' }}>
                    <Download size={16} color="#10B981" />
                    <span style={{ fontWeight: 600 }}>Báo cáo Excel (.xlsx)</span>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleDownloadReport('zip')} title="Xuất Hồ sơ (.zip)" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A' }}>
                    <Download size={16} color="#0EA5E9" />
                    <span style={{ fontWeight: 600 }}>Tải Hồ sơ (.zip)</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('attendance')}
                  style={activeTab !== 'attendance' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
                >
                  <Users size={16} />
                  <span>Điểm danh Sinh viên</span>
                </button>
                <button
                  className={`btn ${activeTab === 'comments' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('comments')}
                  style={activeTab !== 'comments' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
                >
                  <MessageSquare size={16} />
                  <span>Nhận xét Tiến độ</span>
                </button>
                <button
                  className={`btn ${activeTab === 'evaluation' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('evaluation')}
                  style={activeTab !== 'evaluation' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
                >
                  <FileText size={16} />
                  <span>Chấm điểm & Đánh giá Chính thức</span>
                </button>
              </div>

              {/* ATTENDANCE PANEL */}
              {activeTab === 'attendance' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0F172A' }}>Xác nhận Điểm danh Sinh viên trong Nhóm</h3>
                  <div className="table-container" style={{ marginBottom: '1.25rem' }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Mã SV</th>
                          <th>Họ và tên Sinh viên</th>
                          <th>Trạng thái Điểm danh</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceList.length === 0 ? (
                          <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Chưa có danh sách sinh viên. Bấm Lưu để khởi tạo dữ liệu mặc định.</td></tr>
                        ) : (
                          attendanceList.map((att, idx) => (
                            <tr key={att.studentId || idx}>
                              <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 700 }}>{att.studentCode || `SE#${att.studentId}`}</span></td>
                              <td style={{ fontWeight: 600, color: '#0F172A' }}>{att.studentName || 'Sinh viên Nhóm'}</td>
                              <td>
                                <span className="badge" style={{
                                  background: att.isPresent !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: att.isPresent !== false ? '#10B981' : '#EF4444',
                                  fontWeight: 700
                                }}>
                                  {att.isPresent !== false ? 'Có mặt' : 'Vắng mặt'}
                                </span>
                              </td>
                              <td>
                                <button type="button" className="btn btn-secondary" onClick={() => handleToggleAttendance(idx)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}>
                                  Chuyển Có/Vắng
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" className="btn btn-success" onClick={handleSaveAttendance} style={{ background: '#10B981', color: 'white' }}>
                    <Save size={16} />
                    <span style={{ fontWeight: 700 }}>Lưu Kết quả Điểm danh</span>
                  </button>
                </div>
              )}

              {/* COMMENTS PANEL */}
              {activeTab === 'comments' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#0F172A' }}>Trao đổi & Nhận xét Tiến độ</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {commentsList.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', color: '#64748B', border: '1px solid #CBD5E1' }}>
                        Chưa có nhận xét nào được gửi. Hãy nhập góp ý chuyên môn cho nhóm bên dưới!
                      </div>
                    ) : (
                      commentsList.map((comm, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F26522' }}>{comm.authorName || 'Giảng viên'}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{new Date(comm.createdAt || Date.now()).toLocaleString()}</span>
                          </div>
                          <p style={{ fontSize: '0.85rem', margin: 0, color: '#0F172A' }}>{comm.commentText || comm.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment}>
                    <div className="form-group">
                      <label htmlFor="rev-new-comment" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Thêm Nhận xét mới</label>
                      <textarea
                        id="rev-new-comment"
                        className="form-input"
                        rows="3"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Chi tiết góp ý về kiến trúc, các lỗi cần khắc phục, tiến độ checkpoint..."
                        style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      <Send size={16} />
                      <span>Gửi Nhận xét</span>
                    </button>
                  </form>
                </div>
              )}

              {/* EVALUATION PANEL */}
              {activeTab === 'evaluation' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0F172A' }}>Kết quả & Nhận xét Đánh giá Chính thức</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Theo quy chế review checkpoint, giảng viên tập trung đưa ra các ý kiến góp ý chuyên môn và đánh giá mức độ đáp ứng tiến độ của nhóm: Đạt yêu cầu (Pass) hoặc Không đạt (Fail).
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="rev-eval-result" className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: '0.9rem' }}>Đánh giá mức độ đáp ứng tiến độ & yêu cầu Review</label>
                    <select id="rev-eval-result" className="form-select" value={evalResult} onChange={(e) => setEvalResult(e.target.value)} style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '0.65rem 1rem', fontWeight: 600, fontSize: '0.9rem' }}>
                      <option value="Pass">✓ ĐẠT YÊU CẦU (Pass - Nhóm đáp ứng tốt tiến độ, được bước tiếp giai đoạn sau)</option>
                      <option value="Fail">✗ KHÔNG ĐẠT (Fail - Chưa đáp ứng yêu cầu, cần điều chỉnh toàn diện & review lại)</option>
                      <option value="Defense2">⚠ YÊU CẦU REVIEW LẠI (Defense 2 Required - Cần bảo vệ lại trước hội đồng)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="rev-eval-notes" className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: '0.9rem' }}>Ý kiến Nhận xét & Góp ý chuyên môn chi tiết cho Nhóm</label>
                    <textarea
                      id="rev-eval-notes"
                      className="form-input"
                      rows="6"
                      value={evalNotes}
                      onChange={(e) => setEvalNotes(e.target.value)}
                      placeholder="Nhập chi tiết các nhận xét về kiến trúc, chức năng đã hoàn thành, những điểm hạn chế cần khắc phục và định hướng cho giai đoạn tiếp theo..."
                      style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.9rem', lineHeight: 1.6 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleSaveEvaluationDraft} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}>
                      <Save size={16} color="#0EA5E9" />
                      <span>Lưu Bản nháp</span>
                    </button>
                    <button type="button" className="btn btn-success" onClick={handleSubmitEvaluationFinal} style={{ background: '#10B981', color: 'white', fontWeight: 700, padding: '0.75rem 1.5rem' }}>
                      <CheckCircle2 size={18} />
                      <span>Kết thúc Buổi Review & Nộp Điểm</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewScoringPage;
