import React, { useCallback, useState, useEffect } from 'react';
import api from '../../services/api';
import { listProjectDocuments, downloadProjectDocument, generateProjectDocumentSuggestions } from '../../services/documents';
import { CheckSquare, Users, MessageSquare, FileText, Download, Save, Send, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { PageSkeleton, PanelSkeleton } from '../../components/common/Skeleton';

const getTabButtonProps = (activeTab, tab) => {
  if (activeTab === tab) return { className: 'btn btn-primary', style: {} };
  return {
    className: 'btn btn-secondary',
    style: { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }
  };
};

const getSessionId = (session) => session?.sessionId ?? session?.id;
const getSessionKey = (session) => session?.submissionId
  ?? `${getSessionId(session)}-${session?.groupId ?? 'group'}`;
const formatSessionDate = (value) => value
  ? new Date(value).toLocaleDateString('vi-VN')
  : 'Chưa xác định';

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

  // Final reviewer feedback
  const [evalNotes, setEvalNotes] = useState('');
  const [aiProjectContent, setAiProjectContent] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  const fetchMySessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/review-sessions/my');
      const rawList = Array.isArray(response.data) ? response.data : (response.data.items || []);
      const list = rawList.map((item) => ({
        ...item,
        id: item.sessionId ?? item.id,
        projectName: item.projectName || item.topicName
      }));
      setSessions(list);
      setSelectedSession((current) => current || list[0] || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch assigned review sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMySessions();
  }, [fetchMySessions]);

  const fetchSessionDetails = useCallback(async (sess) => {
    if (!sess) return;
    const sessionId = getSessionId(sess);
    if (!sessionId) return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'attendance') {
        const res = await api.get(`/review-attendance/${sessionId}`, {
          params: { groupId: sess.groupId }
        });
        setAttendanceList(Array.isArray(res.data) ? res.data : (res.data?.students || []));
      } else if (activeTab === 'comments') {
        const res = await api.get(`/review-attendance/${sessionId}/comments`, {
          params: { groupId: sess.groupId }
        });
        setCommentsList(Array.isArray(res.data) ? res.data : []);
      } else if (activeTab === 'evaluation') {
        const subId = sess.submissionId || sessionId;
        const res = await api.get(`/review-submissions/${subId}`);
        if (res.data) {
          setEvalNotes(res.data.reviewerComment || '');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load details for selected tab.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSession) {
      setAiProjectContent(selectedSession.projectContent || selectedSession.description || '');
      setAiSuggestion(null);
      listProjectDocuments(selectedSession.groupId).then(({ data }) => setDocuments(Array.isArray(data) ? data : [])).catch(() => setDocuments([]));
      fetchSessionDetails(selectedSession);
    }
  }, [selectedSession, fetchSessionDetails]);

  const handleGenerateAiSuggestion = async () => {
    if (!selectedSession) return;
    const projectName = selectedSession.projectName || selectedSession.groupCode || `Nhóm #${selectedSession.groupId}`;
    const projectContent = aiProjectContent.trim() || evalNotes.trim();
    if (!projectContent) {
      setError('Hãy nhập mô tả/nội dung dự án để AI có dữ liệu tham khảo.');
      return;
    }
    setAiLoading(true);
    setError('');
    try {
      const response = await api.post('/project-suggestions/summary', { projectName, projectContent });
      setAiSuggestion(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tạo gợi ý AI lúc này. Vui lòng thử lại sau.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnalyzeDocument = async (document) => {
    setAiLoading(true); setError(''); setSuccess('');
    try {
      const { data } = await generateProjectDocumentSuggestions(document.id);
      setAiSuggestion(data); setActiveTab('evaluation');
      setSuccess(`AI đã đọc ${document.fileName} và tạo gợi ý. Giảng viên cần kiểm tra trước khi sử dụng.`);
    } catch (err) { setError(err.response?.data?.error || 'Không thể phân tích tài liệu bằng AI lúc này.'); }
    finally { setAiLoading(false); }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession) return;
    setError('');
    setSuccess('');
    try {
      await api.post(`/review-attendance/${getSessionId(selectedSession)}`, {
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
      await api.post(`/review-attendance/${getSessionId(selectedSession)}/comments`, {
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
    const subId = selectedSession.submissionId || getSessionId(selectedSession);
    setError('');
    setSuccess('');
    try {
      await api.put(`/review-submissions/${subId}/draft`, {
        workProductVersion: null,
        workProductSize: null,
        effortHours: null,
        reviewerComment: evalNotes,
        suggestion: null,
        resultText: null,
        items: []
      });
      setSuccess('Đã lưu bản nháp nhận xét thành công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save review draft.');
    }
  };

  const handleSubmitEvaluationFinal = async () => {
    if (!selectedSession) return;
    if (!evalNotes.trim()) {
      setError('Vui lòng nhập nhận xét chính thức trước khi kết thúc buổi Review.');
      return;
    }
    const subId = selectedSession.submissionId || getSessionId(selectedSession);
    setError('');
    setSuccess('');
    try {
      await api.put(`/review-submissions/${subId}/draft`, {
        workProductVersion: null,
        workProductSize: null,
        effortHours: null,
        reviewerComment: evalNotes,
        suggestion: null,
        resultText: null,
        items: []
      });
      await api.post(`/review-submissions/${subId}/submit`);
      try {
        await api.post(`/review-attendance/${selectedSession.id}/groups/${selectedSession.groupId}/complete`);
        setSuccess('Đã kết thúc buổi Review. Nhận xét của giảng viên đã được gửi cho sinh viên.');
      } catch (completeError) {
        if (completeError.response?.status === 409) {
          setSuccess('Đã nộp nhận xét của bạn. Buổi review sẽ hoàn thành khi mọi giảng viên đã nộp nhận xét. Sinh viên không ký sẽ tự động được ghi nhận vắng mặt.');
        } else {
          throw completeError;
        }
      }
      fetchSessionDetails(selectedSession);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit final checkpoint review.');
    }
  };

  const handleDownloadReport = async () => {
    if (!selectedSession) return;
    const subId = selectedSession.submissionId || getSessionId(selectedSession);
    setError('');
    try {
      const response = await api.get(`/review-submissions/${encodeURIComponent(String(subId))}/export.xlsx`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedSession.groupCode || 'nhom'}_nhan-xet-review.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải phiếu nhận xét.');
    }
  };

  if (loading && sessions.length === 0) return <PageSkeleton cards={2} rows={6} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Điểm danh & Nhận xét Review Checkpoint</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Xác nhận sinh viên có mặt và gửi nhận xét chuyên môn cho nhóm sau buổi review. Review không chấm điểm.</p>
        </div>

        <button type="button" className="btn btn-secondary" onClick={fetchMySessions} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
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

          {loading && !sessions.length && <PanelSkeleton rows={5} />}
          {!loading && sessions.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
              Hiện chưa có lịch review nào được phân công cho bạn trong tuần này.
            </div>
          )}
          {sessions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sessions.map((sess) => {
                const sessionKey = getSessionKey(sess);
                const isSelected = getSessionKey(selectedSession) === sessionKey;
                return (
                  <button
                    type="button"
                    key={sessionKey}
                    onClick={() => setSelectedSession(sess)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'linear-gradient(135deg, #F26522, #FF7A00)' : '#F8FAFC',
                      color: isSelected ? 'white' : '#0F172A',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      border: `1px solid ${isSelected ? '#F26522' : '#CBD5E1'}`,
                      textAlign: 'left',
                      width: '100%',
                      font: 'inherit'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{sess.groupCode || `Nhóm #${sess.groupId}`}</span>
                      <span className="badge" style={{ background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(242,101,34,0.12)', color: isSelected ? 'white' : '#F26522', fontWeight: 700 }}>
                        Ca {sess.slot}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: isSelected ? 0.95 : 0.75, margin: 0 }}>
                      {formatSessionDate(sess.sessionDate)} — Phòng {sess.room || 'TBD'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Session Work Area */}
        <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          {!selectedSession ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
              Vui lòng chọn một ca review từ danh sách bên trái để ghi nhận xét.
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                    Review Checkpoint Nhóm {selectedSession.groupCode || `#${selectedSession.groupId}`}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    ID Ca: #{getSessionId(selectedSession)} — Ngày: {formatSessionDate(selectedSession.sessionDate)} — Phòng: {selectedSession.room || 'N/A'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleDownloadReport} title="Xuất Phiếu Nhận xét (.xlsx)" style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A' }}>
                    <Download size={16} color="#10B981" />
                    <span style={{ fontWeight: 600 }}>Phiếu Nhận xét (.xlsx)</span>
                  </button>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <strong style={{ color: '#0F172A' }}>Tài liệu đồ án của nhóm</strong>
                {documents.length === 0 ? <p style={{ margin: '0.5rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>Nhóm chưa tải tài liệu.</p> : documents.map((document) => <div key={document.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', paddingTop: '0.6rem' }}><span style={{ fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{document.fileName} <small style={{ color: '#64748B' }}>({document.docType}, v{document.versionNo})</small></span><span style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}><button type="button" className="btn btn-secondary" onClick={async () => { const response = await downloadProjectDocument(document.id); const url = URL.createObjectURL(response.data); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }}><Download size={14} /> Xem</button><button type="button" className="btn btn-primary" disabled={aiLoading || document.fileName.toLowerCase().endsWith('.zip')} onClick={() => handleAnalyzeDocument(document)}><Sparkles size={14} /> AI phân tích</button></span></div>)}
              </div>

              {/* Sub-Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={getTabButtonProps(activeTab, 'attendance').className}
                  onClick={() => setActiveTab('attendance')}
                  style={getTabButtonProps(activeTab, 'attendance').style}
                >
                  <Users size={16} />
                  <span>Điểm danh Sinh viên</span>
                </button>
                <button
                  type="button"
                  className={getTabButtonProps(activeTab, 'comments').className}
                  onClick={() => setActiveTab('comments')}
                  style={getTabButtonProps(activeTab, 'comments').style}
                >
                  <MessageSquare size={16} />
                  <span>Nhận xét Tiến độ</span>
                </button>
                <button
                  type="button"
                  className={getTabButtonProps(activeTab, 'evaluation').className}
                  onClick={() => setActiveTab('evaluation')}
                  style={getTabButtonProps(activeTab, 'evaluation').style}
                >
                  <FileText size={16} />
                  <span>Nhận xét Chính thức</span>
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
                          <th>Chữ ký Sinh viên</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceList.length === 0 ? (
                          <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Chưa có danh sách sinh viên. Bấm Lưu để khởi tạo dữ liệu mặc định.</td></tr>
                        ) : (
                          attendanceList.map((att, idx) => (
                            <tr key={att.studentId ?? att.id ?? att.studentCode}>
                              <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 700 }}>{att.studentCode || `SE#${att.studentId}`}</span></td>
                              <td style={{ fontWeight: 600, color: '#0F172A' }}>{att.fullName || att.studentName || 'Chưa cập nhật họ tên'}</td>
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
                                {att.studentConfirmedAt ? (
                                  <span className="badge badge-success">Đã ký {new Date(att.studentConfirmedAt).toLocaleString('vi-VN')}</span>
                                ) : (
                                  <span className="badge badge-warning">Chưa ký xác nhận</span>
                                )}
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
                      commentsList.map((comm) => (
                        <div key={comm.id ?? comm.createdAt ?? `${comm.authorName}-${comm.commentText ?? comm.content}`} className="glass-panel" style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
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
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0F172A' }}>Nhận xét Chính thức sau Buổi Review</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Giảng viên ghi rõ nội dung nhóm đã thực hiện, các vấn đề cần khắc phục và định hướng cho giai đoạn tiếp theo. Hệ thống chỉ ghi nhận nhận xét, không ghi điểm hoặc xếp loại Pass/Fail.
                  </p>

                  <div className="form-group">
                    <label htmlFor="rev-ai-project-content" className="form-label" style={{ color: '#334155', fontWeight: 700, fontSize: '0.9rem' }}>Nội dung dự án cho AI tham khảo</label>
                    <textarea
                      id="rev-ai-project-content"
                      className="form-input"
                      rows="4"
                      value={aiProjectContent}
                      onChange={(e) => setAiProjectContent(e.target.value)}
                      placeholder="Dán mô tả dự án, mục tiêu, chức năng hoặc nội dung sinh viên trình bày..."
                      style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', fontSize: '0.9rem', lineHeight: 1.6 }}
                    />
                    <button type="button" className="btn btn-secondary" onClick={handleGenerateAiSuggestion} disabled={aiLoading} style={{ marginTop: '0.75rem', background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA', fontWeight: 700 }}>
                      <Sparkles size={16} />
                      <span>{aiLoading ? 'AI đang phân tích...' : 'Tạo gợi ý nhận xét bằng AI'}</span>
                    </button>
                    {aiSuggestion && (
                      <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.75rem', background: '#F8FAFC', border: '1px solid #C7D2FE', color: '#1E293B' }}>
                        <strong style={{ color: '#4338CA' }}>Gợi ý AI — giảng viên cần kiểm tra và chỉnh sửa trước khi gửi</strong>
                        <p><b>Tóm tắt:</b> {aiSuggestion.contentSummary}</p>
                        <p><b>Điểm mạnh:</b> {aiSuggestion.strengthsSummary}</p>
                        <p style={{ marginBottom: 0 }}><b>Cải thiện:</b> {aiSuggestion.improvementSummary}</p>
                        <button type="button" className="btn btn-secondary" onClick={() => setEvalNotes((current) => current.trim() ? `${current.trim()}\n\n${aiSuggestion.improvementSummary}` : aiSuggestion.improvementSummary)} style={{ marginTop: '0.75rem', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
                          Dùng phần cải thiện làm bản nháp nhận xét
                        </button>
                      </div>
                    )}
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
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary" onClick={handleSaveEvaluationDraft} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}>
                      <Save size={16} color="#0EA5E9" />
                      <span>Lưu Bản nháp</span>
                    </button>
                    <button type="button" className="btn btn-success" onClick={handleSubmitEvaluationFinal} style={{ background: '#10B981', color: 'white', fontWeight: 700, padding: '0.75rem 1.5rem' }}>
                      <CheckCircle2 size={18} />
                      <span>Kết thúc Buổi Review & Gửi Nhận xét</span>
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
