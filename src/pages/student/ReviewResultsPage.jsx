import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { downloadReviewReport } from '../../services/reviewReports';
import { MessageSquare, FileText, Download, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

const ReviewResultsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [comments, setComments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [scheduleBySession, setScheduleBySession] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMySubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [response, scheduleResponse] = await Promise.all([
        api.get('/review-submissions/my'),
        api.get('/student-review/schedule').catch(() => ({ data: [] })),
      ]);
      const list = Array.isArray(response.data) ? response.data : [];
      const schedules = Array.isArray(scheduleResponse.data) ? scheduleResponse.data : [];
      setScheduleBySession(Object.fromEntries(
        schedules.map((schedule) => [String(schedule.sessionId), schedule])
      ));
      setSubmissions(list);
      setSelectedSubmission((currentSubmission) => (
        currentSubmission && list.some((submission) => submission.id === currentSubmission.id)
          ? currentSubmission
          : list[0] || null
      ));
    } catch {
      setError('Failed to fetch evaluation results.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMySubmissions();
  }, [fetchMySubmissions]);

  useEffect(() => {
    if (!selectedSubmission) return;
    const fetchDetails = async () => {
      try {
        const sessionId = selectedSubmission.sessionId || selectedSubmission.id;
        const groupQuery = selectedSubmission.groupId ? `?groupId=${selectedSubmission.groupId}` : '';
        const commRes = await api.get(`/review-attendance/${sessionId}/comments${groupQuery}`).catch(() => ({ data: [] }));
        setComments(Array.isArray(commRes.data) ? commRes.data : []);

        const attRes = await api.get(`/review-attendance/${sessionId}${groupQuery}`).catch(() => ({ data: [] }));
        const students = Array.isArray(attRes.data) ? attRes.data : attRes.data?.students;
        setAttendance(Array.isArray(students) ? students : []);
      } catch (e) {
        console.error('Error fetching submission details:', e);
      }
    };
    fetchDetails();
  }, [selectedSubmission]);

  const handleDownloadReport = async (subId) => {
    setError('');
    try {
      await downloadReviewReport(subId);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Không thể tải phiếu đánh giá.');
    }
  };

  const getResultBadge = (res) => {
    switch (res) {
      case 'Pass':
        return 'badge-success';
      case 'Fail':
      case 'Drop':
        return 'badge-danger';
      case 'Defense2':
        return 'badge-warning';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Kết quả & Nhận xét Review Checkpoint</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Xem nhận xét chuyên môn từ hội đồng giảng viên, kết quả đạt yêu cầu hay không đạt và tải biên bản review.</p>
        </div>

        <button className="btn btn-secondary" onClick={fetchMySubmissions} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}>
          <RefreshCw size={16} color="#F26522" />
          <span>Làm mới Kết quả</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#64748B' }}>
          Đang tải kết quả review...
        </div>
      ) : submissions.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <FileText size={48} color="#F26522" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Chưa có Báo cáo Đánh giá Review nào</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', maxWidth: '440px', margin: '0.5rem auto 0', lineHeight: 1.5 }}>
            Khi Giảng viên hoàn thành đánh giá (Review 1, Review 2, hoặc Review 3) và gửi điểm chính thức, kết quả chi tiết của nhóm sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
          {/* Submissions List Sidebar */}
          <div className="glass-card" style={{ padding: '1.25rem', height: 'fit-content', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>Lịch sử Đánh giá</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {submissions.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'linear-gradient(135deg, #F26522, #EA580C)' : '#F8FAFC',
                      color: isSelected ? 'white' : '#0F172A',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      border: `1px solid ${isSelected ? '#F26522' : '#CBD5E1'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{sub.type || `Vòng Review #${sub.id}`}</span>
                      <span className={`badge ${isSelected ? '' : getResultBadge(sub.resultText)}`} style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : undefined, color: isSelected ? 'white' : undefined, fontWeight: 700 }}>
                        {sub.resultText || sub.status}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: isSelected ? 0.95 : 0.75, margin: 0 }}>
                      Trạng thái: <strong>{scheduleBySession[String(sub.sessionId)]?.groupStatus || sub.status}</strong> — Ngày: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Evaluation Details */}
          {selectedSubmission && (
            <div className="glass-card" style={{ padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9', fontSize: '0.8rem', fontWeight: 700 }}>Biên bản Đánh giá Chính thức</span>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.85rem', padding: '0.25rem 0.65rem', fontWeight: 700 }}>
                      Trạng thái: {scheduleBySession[String(selectedSubmission.sessionId)]?.groupStatus || selectedSubmission.status}
                    </span>
                    <span className={`badge ${getResultBadge(selectedSubmission.resultText)}`} style={{ fontSize: '0.85rem', padding: '0.25rem 0.65rem', fontWeight: 700 }}>
                      Kết quả: {selectedSubmission.resultText || 'Chưa có kết luận'}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{selectedSubmission.type || 'Kết quả Review Checkpoint'}</h2>
                  <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
                    Được đánh giá bởi Giảng viên — ID Phiên: #{selectedSubmission.sessionId || selectedSubmission.id}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-primary" onClick={() => handleDownloadReport(selectedSubmission.id)} style={{ fontWeight: 600 }}>
                    <Download size={16} />
                    <span>Tải Phiếu Đánh giá (.xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Verdict & Notes Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: selectedSubmission.resultText === 'Fail' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: selectedSubmission.resultText === 'Fail' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>KẾT QUẢ REVIEW</span>
                  <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: selectedSubmission.resultText === 'Fail' ? '#EF4444' : '#10B981', margin: '0.4rem 0' }}>
                    {selectedSubmission.resultText === 'Fail' ? 'KHÔNG ĐẠT' : selectedSubmission.resultText || 'CHƯA CÓ KẾT LUẬN'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    {selectedSubmission.resultText === 'Fail' ? 'Yêu cầu sửa chữa & review lại' : '✓ Đủ điều kiện bước tiếp'}
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                    <FileText size={16} color="#F26522" />
                    <span>Nhận xét Tổng hợp của Giảng viên</span>
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                    {selectedSubmission.reviewerComment || 'Giảng viên chưa nhập nhận xét tổng hợp.'}
                  </p>
                </div>
              </div>

              {/* Attendance Verification Section */}
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                <ShieldCheck size={18} color="#10B981" />
                <span>Trạng thái Điểm danh của Nhóm</span>
              </h4>
              <div className="table-container" style={{ marginBottom: '2rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã SV</th>
                      <th>Họ và tên Sinh viên</th>
                      <th>Trạng thái Điểm danh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>Chưa có dữ liệu điểm danh cho ca review này.</td></tr>
                    ) : (
                      attendance.map((att, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: '#0F172A' }}>{att.studentCode || `Thành viên #${att.studentId}`}</td>
                          <td style={{ color: '#334155' }}>{att.fullName || att.studentName || 'Thành viên Nhóm'}</td>
                          <td>
                            <span className={`badge ${att.isPresent !== false ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                              {att.isPresent !== false ? 'Đã điểm danh (Có mặt)' : 'Vắng mặt'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Feedback Comments Log */}
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                <MessageSquare size={18} color="#0EA5E9" />
                <span>Nhật ký Nhận xét Chi tiết</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {comments.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', color: '#64748B', fontSize: '0.85rem', border: '1px solid #E2E8F0' }}>
                    Không có nhận xét bổ sung nào cho phiên review này.
                  </div>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F26522' }}>{c.authorName || 'Giảng viên'}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{new Date(c.createdAt || Date.now()).toLocaleString('vi-VN')}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', margin: 0, color: '#334155' }}>{c.commentText || c.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewResultsPage;
