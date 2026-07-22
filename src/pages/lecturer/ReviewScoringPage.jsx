import React, { useCallback, useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { listProjectDocuments, downloadProjectDocument, generateProjectDocumentSuggestions, listDocumentComments, createDocumentComment } from '../../services/documents';
import reviewProgressService from '../../services/reviewProgress';
import { useAuth } from '../../context/authContextValue.js';
import { CheckSquare, CalendarDays, Users, MessageSquare, FileText, Download, Save, Send, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { PageSkeleton, PanelSkeleton } from '../../components/common/Skeleton';
import { filterReviewSessions, getReviewDateKey, getReviewReminder, REVIEW_TIME_ZONE } from '../../features/reviews/reviewSessionDates.js';

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
  ? new Date(value).toLocaleDateString('vi-VN', { timeZone: REVIEW_TIME_ZONE })
  : 'Chưa xác định';

const formatSessionDateHeading = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: REVIEW_TIME_ZONE
  }).format(new Date(value))
  : 'Chưa xác định';

const formatCommentTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(value))
  : '';
const getInitials = (value = '') => value
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map((part) => part[0]?.toUpperCase())
  .join('') || 'GV';

const ReviewScoringPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionFilter, setSessionFilter] = useState('today');
  const [activeTab, setActiveTab] = useState('evaluation'); // 'attendance' | 'comments' | 'evaluation'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Attendance & Comments State
  const [attendanceList, setAttendanceList] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentSending, setCommentSending] = useState(false);
  const [progressConnection, setProgressConnection] = useState('offline');
  const commentsViewportRef = useRef(null);

  // Final reviewer feedback
  const [evalNotes, setEvalNotes] = useState('');
  const [aiProjectContent, setAiProjectContent] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [commentViewer, setCommentViewer] = useState(null);
  const [inlineComments, setInlineComments] = useState([]);
  const [commentReference, setCommentReference] = useState('');
  const [inlineCommentText, setInlineCommentText] = useState('');
  const [inlineCommentBusy, setInlineCommentBusy] = useState(false);
  const todaySessions = filterReviewSessions(sessions, 'today');
  const upcomingSessions = filterReviewSessions(sessions, 'upcoming');
  const filteredSessions = filterReviewSessions(sessions, sessionFilter);
  const sessionDateGroups = new Map();
  filteredSessions.forEach((session) => {
    const dateKey = getReviewDateKey(session.sessionDate) || 'unknown';
    const existingGroup = sessionDateGroups.get(dateKey);

    if (existingGroup) {
      existingGroup.sessions.push(session);
    } else {
      sessionDateGroups.set(dateKey, {
        key: dateKey,
        date: session.sessionDate,
        sessions: [session]
      });
    }
  });
  const sessionsByDate = Array.from(sessionDateGroups.values());

  const mergeProgressComment = useCallback((incoming) => {
    if (!incoming?.id) return;
    setCommentsList((current) => {
      const next = current.some((comment) => comment.id === incoming.id)
        ? current.map((comment) => comment.id === incoming.id ? incoming : comment)
        : [...current, incoming];
      return next.sort((left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
    });
  }, []);

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
      const today = filterReviewSessions(list, 'today');
      const upcoming = filterReviewSessions(list, 'upcoming');
      const preferredSession = today[0] || upcoming[0] || list[0] || null;
      setSessionFilter(today.length > 0 ? 'today' : upcoming.length > 0 ? 'upcoming' : 'all');
      setSelectedSession(preferredSession);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải danh sách phiên bảo vệ được phân công.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMySessions();
  }, [fetchMySessions]);

  useEffect(() => () => { reviewProgressService.stop(); }, []);

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
      setError(err.response?.data?.error || 'Không thể tải thông tin của phiên bảo vệ đã chọn.');
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

  useEffect(() => {
    if (!selectedSession) return undefined;
    const sessionId = getSessionId(selectedSession);
    const groupId = selectedSession.groupId;
    if (!sessionId || !groupId) return undefined;

    setCommentsList([]);
    const unsubscribeComment = reviewProgressService.subscribe(mergeProgressComment);
    const unsubscribeStatus = reviewProgressService.subscribeStatus(setProgressConnection);
    reviewProgressService.join(sessionId, groupId).catch(() => setProgressConnection('offline'));

    return () => {
      unsubscribeComment();
      unsubscribeStatus();
      reviewProgressService.leave(sessionId, groupId);
    };
  }, [selectedSession, mergeProgressComment]);

  useEffect(() => {
    if (activeTab !== 'comments') return;
    const viewport = commentsViewportRef.current;
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
  }, [activeTab, commentsList.length]);

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

  const openCommentViewer = async (document) => {
    setError('');
    try {
      const [fileResponse, commentResponse] = await Promise.all([
        downloadProjectDocument(document.id),
        listDocumentComments(document.id),
      ]);
      const url = URL.createObjectURL(fileResponse.data);
      setCommentViewer({ document, url });
      setInlineComments(Array.isArray(commentResponse.data) ? commentResponse.data : []);
      setCommentReference('');
      setInlineCommentText('');
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể mở tài liệu và nhận xét.');
    }
  };

  const closeCommentViewer = () => {
    if (commentViewer?.url) URL.revokeObjectURL(commentViewer.url);
    setCommentViewer(null);
    setInlineComments([]);
  };

  const handleCreateInlineComment = async (event) => {
    event.preventDefault();
    if (!commentViewer || !inlineCommentText.trim()) return;
    setInlineCommentBusy(true);
    try {
      const response = await createDocumentComment(commentViewer.document.id, {
        content: inlineCommentText.trim(),
        reference: commentReference.trim() || null,
      });
      setInlineComments((current) => [...current, response.data]);
      setInlineCommentText('');
      setCommentReference('');
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể lưu nhận xét theo vị trí.');
    } finally {
      setInlineCommentBusy(false);
    }
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
      setSuccess('Đã lưu kết quả điểm danh của sinh viên.');
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể lưu kết quả điểm danh.');
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
    setCommentSending(true);
    try {
      const response = await api.post(`/review-attendance/${getSessionId(selectedSession)}/comments`, {
        groupId: Number(selectedSession.groupId),
        content: newComment.trim()
      });
      mergeProgressComment(response.data);
      setNewComment('');
      setSuccess('Nhận xét tiến độ đã được gửi tới các giảng viên trong phiên bảo vệ.');
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể gửi nhận xét.');
    } finally {
      setCommentSending(false);
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
      setError(err.response?.data?.error || 'Không thể lưu bản nháp nhận xét.');
    }
  };

  const handleSubmitEvaluationFinal = async () => {
    if (!selectedSession) return;
    if (!evalNotes.trim()) {
      setError('Vui lòng nhập nhận xét chính thức trước khi kết thúc phiên bảo vệ.');
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
        setSuccess('Đã kết thúc phiên bảo vệ. Nhận xét của giảng viên đã được gửi cho sinh viên.');
      } catch (completeError) {
        if (completeError.response?.status === 409) {
          setSuccess('Đã nộp nhận xét của bạn. Phiên bảo vệ sẽ hoàn thành khi mọi giảng viên đã nộp nhận xét. Sinh viên không ký sẽ tự động được ghi nhận vắng mặt.');
        } else {
          throw completeError;
        }
      }
      fetchSessionDetails(selectedSession);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể gửi nhận xét chính thức cho phiên bảo vệ.');
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

  const handleSessionFilterChange = (filter) => {
    setSessionFilter(filter);
    const candidates = filterReviewSessions(sessions, filter);
    if (!candidates.some((session) => getSessionKey(session) === getSessionKey(selectedSession))) {
      setSelectedSession(candidates[0] || null);
    }
  };

  if (loading && sessions.length === 0) return <PageSkeleton cards={2} rows={6} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Phòng Bảo vệ Trực tiếp</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Theo dõi phiên bảo vệ, xác nhận sinh viên tham dự và gửi nhận xét chuyên môn cho nhóm.</p>
        </div>

        <button type="button" className="btn btn-secondary" onClick={fetchMySessions} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
          <RefreshCw size={16} color="#F26522" />
          <span style={{ fontWeight: 600 }}>Tải lại danh sách phiên bảo vệ</span>
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
            <span>Phiên Bảo vệ được Phân công ({sessions.length})</span>
          </h3>

          {sessions.length > 0 && (
            <div role="tablist" aria-label="Lọc phiên bảo vệ theo ngày" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.4rem', marginBottom: '1rem' }}>
              {[
                { key: 'today', label: 'Hôm nay', count: todaySessions.length },
                { key: 'upcoming', label: 'Sắp tới', count: upcomingSessions.length },
                { key: 'all', label: 'Tất cả', count: sessions.length }
              ].map((filter) => {
                const isActive = sessionFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSessionFilterChange(filter.key)}
                    style={{
                      border: `1px solid ${isActive ? '#F26522' : '#CBD5E1'}`,
                      borderRadius: '0.6rem',
                      padding: '0.55rem 0.3rem',
                      background: isActive ? '#FFF7ED' : '#FFFFFF',
                      color: isActive ? '#C2410C' : '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {filter.label} ({filter.count})
                  </button>
                );
              })}
            </div>
          )}

          {loading && !sessions.length && <PanelSkeleton rows={5} />}
          {!loading && sessions.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
              Hiện chưa có phiên bảo vệ nào được phân công cho bạn trong tuần này.
            </div>
          )}
          {!loading && sessions.length > 0 && filteredSessions.length === 0 && (
            <div style={{ padding: '1.5rem 0.75rem', textAlign: 'center', color: '#64748B', fontSize: '0.8rem', lineHeight: 1.5 }}>
              {sessionFilter === 'today'
                ? 'Hôm nay bạn chưa có phiên bảo vệ nào.'
                : 'Không có phiên bảo vệ sắp tới.'}
            </div>
          )}
          {filteredSessions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {sessionsByDate.map((dateGroup) => (
                <section key={dateGroup.key} aria-label={formatSessionDateHeading(dateGroup.date)}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    padding: '0.65rem 0.75rem',
                    marginBottom: '0.6rem',
                    borderLeft: '3px solid #F26522',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    background: '#FFF7ED',
                    color: '#9A3412'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <CalendarDays size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'capitalize', lineHeight: 1.3 }}>
                        {formatSessionDateHeading(dateGroup.date)}
                      </span>
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem', whiteSpace: 'nowrap', color: '#C2410C' }}>
                      {getReviewReminder(dateGroup.date) && (
                        <strong style={{ fontSize: '0.72rem' }}>{getReviewReminder(dateGroup.date)}</strong>
                      )}
                      <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{dateGroup.sessions.length} ca</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                    {dateGroup.sessions.map((sess) => {
                      const sessionKey = getSessionKey(sess);
                      const isSelected = getSessionKey(selectedSession) === sessionKey;
                      return (
                        <button
                          type="button"
                          key={sessionKey}
                          onClick={() => setSelectedSession(sess)}
                          aria-pressed={isSelected}
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', gap: '0.75rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{sess.groupCode || `Nhóm #${sess.groupId}`}</span>
                            <span className="badge" style={{ background: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(242,101,34,0.12)', color: isSelected ? 'white' : '#F26522', fontWeight: 700 }}>
                              Ca {sess.slot}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.75rem', opacity: isSelected ? 0.95 : 0.75, margin: 0 }}>
                            Phòng {sess.room || 'Chưa xếp phòng'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Selected Session Work Area */}
        <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          {!selectedSession ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
              Vui lòng chọn một phiên bảo vệ từ danh sách bên trái để ghi nhận xét.
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                    Phiên Bảo vệ Checkpoint: Nhóm {selectedSession.groupCode || `#${selectedSession.groupId}`}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    Mã phiên: #{getSessionId(selectedSession)} — Ngày: {formatSessionDate(selectedSession.sessionDate)} — Phòng: {selectedSession.room || 'Chưa xác định'}
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
                <strong style={{ color: '#0F172A' }}>Lịch sử tài liệu của nhóm</strong>
                {documents.length === 0 ? <p style={{ margin: '0.5rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>Nhóm chưa tải tài liệu.</p> : documents.map((document, index) => <div key={document.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', paddingTop: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}><span style={{ fontSize: '0.9rem', overflowWrap: 'anywhere', minWidth: 0 }}><strong>{document.fileName}</strong><small style={{ color: '#64748B', display: 'block', marginTop: '0.2rem' }}>Lần tải #{documents.length - index} · {document.uploadedByName || `Sinh viên #${document.uploadedById}`} · {new Date(document.uploadedAt).toLocaleString('vi-VN')} · {(document.fileSize / 1024 / 1024).toFixed(2)} MB</small></span><span style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}><button type="button" className="btn btn-secondary" onClick={() => openCommentViewer(document)}><FileText size={14} /> Mở & nhận xét</button><button type="button" className="btn btn-primary" disabled={aiLoading || document.fileName.toLowerCase().endsWith('.zip')} onClick={() => handleAnalyzeDocument(document)}><Sparkles size={14} /> AI phân tích</button></span></div>)}
              </div>

              {/* Session work areas */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={getTabButtonProps(activeTab, 'evaluation').className}
                  onClick={() => setActiveTab('evaluation')}
                  style={getTabButtonProps(activeTab, 'evaluation').style}
                >
                  <FileText size={16} />
                  <span>Nhận xét sau Phiên Bảo vệ</span>
                </button>
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
                  <span>Trao đổi trong Phiên</span>
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
                <section style={{ border: '1px solid #E2E8F0', borderRadius: '1rem', overflow: 'hidden', background: '#FFFFFF' }}>
                  <header style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid #E2E8F0', background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 72%)', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#F26522', color: '#FFFFFF', boxShadow: '0 8px 20px rgba(242, 101, 34, 0.22)' }}>
                        <MessageSquare size={20} />
                      </span>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>Trao đổi tiến độ</h3>
                        <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                          Nhận xét được cập nhật trực tiếp cho các giảng viên trong phiên bảo vệ này.
                        </p>
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 999, padding: '0.4rem 0.7rem', fontSize: '0.75rem', fontWeight: 700, color: progressConnection === 'connected' ? '#047857' : progressConnection === 'connecting' ? '#B45309' : '#64748B', background: progressConnection === 'connected' ? '#D1FAE5' : progressConnection === 'connecting' ? '#FEF3C7' : '#F1F5F9', border: `1px solid ${progressConnection === 'connected' ? '#A7F3D0' : progressConnection === 'connecting' ? '#FDE68A' : '#E2E8F0'}` }}>
                      {progressConnection === 'connected' ? <Wifi size={14} /> : progressConnection === 'connecting' ? <Loader2 size={14} className="spin" /> : <WifiOff size={14} />}
                      {progressConnection === 'connected' ? 'Đang cập nhật trực tiếp' : progressConnection === 'connecting' ? 'Đang kết nối' : 'Đang đồng bộ dữ liệu'}
                    </span>
                  </header>

                  <div
                    ref={commentsViewportRef}
                    aria-live="polite"
                    style={{ height: 'min(42vh, 420px)', minHeight: 280, overflowY: 'auto', padding: '1.25rem', background: '#F8FAFC', scrollBehavior: 'smooth' }}
                  >
                    {commentsList.length === 0 ? (
                      <div style={{ height: '100%', minHeight: 230, display: 'grid', placeItems: 'center', textAlign: 'center', color: '#64748B' }}>
                        <div>
                          <span style={{ width: 56, height: 56, margin: '0 auto 0.75rem', borderRadius: 18, display: 'grid', placeItems: 'center', color: '#F26522', background: '#FFEDD5' }}>
                            <MessageSquare size={26} />
                          </span>
                          <strong style={{ display: 'block', color: '#334155', marginBottom: '0.3rem' }}>Chưa có trao đổi tiến độ</strong>
                          <span style={{ fontSize: '0.85rem' }}>Gửi nhận xét đầu tiên để các giảng viên cùng theo dõi.</span>
                        </div>
                      </div>
                    ) : commentsList.map((comm) => {
                      const isOwn = Number(comm.authorUserId) === Number(user?.id);
                      const authorName = comm.authorName || 'Giảng viên';
                      return (
                        <article key={comm.id ?? `${comm.createdAt}-${authorName}`} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: '0.65rem', marginBottom: '1rem' }}>
                          {!isOwn && (
                            <span aria-hidden="true" style={{ width: 34, height: 34, flex: '0 0 34px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#E0E7FF', color: '#4338CA', fontSize: '0.72rem', fontWeight: 800 }}>
                              {getInitials(authorName)}
                            </span>
                          )}
                          <div style={{ width: 'fit-content', maxWidth: 'min(76%, 680px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: '0.55rem', marginBottom: '0.3rem', padding: '0 0.2rem' }}>
                              <strong style={{ color: isOwn ? '#C2410C' : '#334155', fontSize: '0.78rem' }}>{isOwn ? 'Bạn' : authorName}</strong>
                              <time style={{ color: '#94A3B8', fontSize: '0.7rem' }}>{formatCommentTime(comm.createdAt)}</time>
                            </div>
                            <div style={{ padding: '0.8rem 1rem', borderRadius: isOwn ? '1rem 0.25rem 1rem 1rem' : '0.25rem 1rem 1rem 1rem', background: isOwn ? 'linear-gradient(135deg, #F26522, #FF7A00)' : '#FFFFFF', color: isOwn ? '#FFFFFF' : '#0F172A', border: isOwn ? 'none' : '1px solid #E2E8F0', boxShadow: '0 5px 16px rgba(15, 23, 42, 0.06)', fontSize: '0.88rem', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                              {comm.commentText || comm.content}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <form onSubmit={handleAddComment} style={{ padding: '1rem 1.25rem 1.15rem', borderTop: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                    <label htmlFor="rev-new-comment" className="form-label" style={{ color: '#334155', fontWeight: 700, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                      <span>Thêm nhận xét tiến độ</span>
                      <span style={{ color: newComment.length > 1900 ? '#DC2626' : '#94A3B8', fontSize: '0.72rem', fontWeight: 600 }}>{newComment.length}/2000</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                      <textarea
                        id="rev-new-comment"
                        className="form-input"
                        rows="3"
                        maxLength={2000}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(event) => {
                          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') event.currentTarget.form?.requestSubmit();
                        }}
                        placeholder="Góp ý về kiến trúc, lỗi cần khắc phục hoặc tiến độ checkpoint..."
                        style={{ minHeight: 88, resize: 'vertical', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', lineHeight: 1.5 }}
                        required
                      />
                      <button type="submit" className="btn btn-primary" disabled={commentSending || !newComment.trim()} style={{ minWidth: 132, justifyContent: 'center', height: 44, marginBottom: 1 }}>
                        {commentSending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                        <span>{commentSending ? 'Đang gửi...' : 'Gửi nhận xét'}</span>
                      </button>
                    </div>
                    <p style={{ margin: '0.45rem 0 0', fontSize: '0.7rem', color: '#94A3B8' }}>Nhấn Ctrl + Enter để gửi nhanh.</p>
                  </form>
                </section>
              )}

              {/* EVALUATION PANEL */}
              {activeTab === 'evaluation' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0F172A' }}>Nhận xét Chính thức sau Phiên Bảo vệ</h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                    Giảng viên ghi rõ nội dung nhóm đã thực hiện, các vấn đề cần khắc phục và định hướng cho giai đoạn tiếp theo.
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
                        <p><b>Nội dung làm tốt:</b> {aiSuggestion.strengthsSummary}</p>
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
                      placeholder="Nhập chi tiết các nhận xét về kiến trúc, chức năng đã hoàn thành, các hạn chế cần khắc phục và định hướng cho giai đoạn tiếp theo..."
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
                      <span>Kết thúc Phiên Bảo vệ & Gửi Nhận xét</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {commentViewer && (
        <div role="dialog" aria-modal="true" aria-label="Mở tài liệu và nhận xét theo vị trí" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: 'min(1200px, 100%)', height: 'min(850px, 95vh)', background: '#FFFFFF', borderRadius: '1rem', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', boxShadow: '0 24px 70px rgba(15, 23, 42, 0.35)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                <strong style={{ overflowWrap: 'anywhere' }}>{commentViewer.document.fileName}</strong>
                <button type="button" className="btn btn-secondary" onClick={closeCommentViewer}>Đóng</button>
              </div>
              <iframe title={`Xem ${commentViewer.document.fileName}`} src={commentViewer.url} style={{ width: '100%', flex: 1, border: 0, background: '#F8FAFC' }} />
            </div>
            <aside style={{ borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid #E2E8F0' }}>
                <strong>Nhận xét theo vị trí</strong>
                <p style={{ color: '#64748B', fontSize: '0.78rem', lineHeight: 1.45, margin: '0.4rem 0 0' }}>Ghi tham chiếu như “Trang 2, dòng 14” hoặc “Mục 3.1, đoạn 2” để sinh viên tìm đúng nội dung.</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
                {inlineComments.length === 0 ? <p style={{ color: '#64748B', fontSize: '0.85rem' }}>Chưa có nhận xét gắn vị trí.</p> : inlineComments.map((comment) => <article key={comment.id} style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '0.65rem', marginBottom: '0.65rem', background: '#F8FAFC' }}><strong style={{ fontSize: '0.78rem', color: '#4F46E5' }}>{comment.reference || `Dòng ${comment.paragraphIndex || '?'}`}</strong><p style={{ margin: '0.4rem 0', color: '#0F172A', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{comment.content}</p><small style={{ color: '#64748B' }}>{comment.authorName} · {new Date(comment.createdAt).toLocaleString('vi-VN')}</small></article>)}
              </div>
              <form onSubmit={handleCreateInlineComment} style={{ borderTop: '1px solid #E2E8F0', padding: '0.75rem' }}>
                <input className="form-input" value={commentReference} onChange={(event) => setCommentReference(event.target.value)} placeholder="Vị trí: trang/dòng/mục" maxLength={200} />
                <textarea className="form-input" value={inlineCommentText} onChange={(event) => setInlineCommentText(event.target.value)} placeholder="Nhập nhận xét cho vị trí này..." rows={4} maxLength={4000} required style={{ marginTop: '0.5rem' }} />
                <button type="submit" className="btn btn-primary" disabled={inlineCommentBusy || !inlineCommentText.trim()} style={{ width: '100%', marginTop: '0.5rem' }}>{inlineCommentBusy ? 'Đang lưu...' : 'Lưu nhận xét'}</button>
              </form>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewScoringPage;
