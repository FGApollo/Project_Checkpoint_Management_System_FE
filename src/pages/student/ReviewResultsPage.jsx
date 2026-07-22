import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AlertCircle, Download, FileText, MessageSquare, RefreshCw, ShieldCheck } from 'lucide-react';
import { PageSkeleton } from '../../components/common/Skeleton';

const completedStatusLabel = (status) => status === 'Submitted' ? 'Đã hoàn thành' : 'Đã lưu nhận xét';

const ReviewResultsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [comments, setComments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMySubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/review-submissions/my');
      const list = Array.isArray(response.data) ? response.data : [];
      setSubmissions(list);
      setSelectedSubmission((current) =>
        list.find((submission) => submission.id === current?.id) || list[0] || null
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải nhận xét Review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  useEffect(() => {
    if (!selectedSubmission) {
      setComments([]);
      setAttendance([]);
      return;
    }

    const fetchDetails = async () => {
      const sessionId = Number(selectedSubmission.sessionId);
      if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
        setError('Mã phiên Review không hợp lệ.');
        return;
      }

      setError('');
      try {
        const safeSessionId = encodeURIComponent(String(sessionId));
        const [commentResponse, attendanceResponse] = await Promise.all([
          api.get(`/review-attendance/${safeSessionId}/comments`),
          api.get(`/review-attendance/${safeSessionId}`),
        ]);
        setComments(Array.isArray(commentResponse.data) ? commentResponse.data : []);
        setAttendance(Array.isArray(attendanceResponse.data)
          ? attendanceResponse.data
          : (attendanceResponse.data?.students || []));
      } catch (err) {
        setError(err.response?.data?.error || 'Không thể tải điểm danh và nhận xét chi tiết.');
      }
    };

    fetchDetails();
  }, [selectedSubmission]);

  const handleDownloadReport = async (submissionId) => {
    if (!Number.isSafeInteger(Number(submissionId)) || Number(submissionId) <= 0) {
      setError('Mã phiếu nhận xét không hợp lệ.');
      return;
    }

    setError('');
    try {
      const response = await api.get(`/review-submissions/${encodeURIComponent(String(submissionId))}/export.xlsx`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedSubmission?.reviewType || 'Review'}_nhan-xet.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải phiếu nhận xét.');
    }
  };

  if (loading && submissions.length === 0) return <PageSkeleton cards={2} rows={5} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Nhận xét Review Checkpoint</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>
            Xem trạng thái hoàn thành, điểm danh và nhận xét chuyên môn do giảng viên gửi sau mỗi buổi Review.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchMySubmissions} disabled={loading} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}>
          <RefreshCw size={16} color="#F26522" />
          <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!loading && submissions.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <FileText size={48} color="#F26522" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Chưa có nhận xét Review</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', maxWidth: '460px', margin: '0.5rem auto 0', lineHeight: 1.5 }}>
            Nhận xét sẽ xuất hiện sau khi giảng viên kết thúc buổi Review và gửi nhận xét chính thức cho nhóm.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', height: 'fit-content', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>Lịch sử Nhận xét</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {submissions.map((submission) => {
                const isSelected = selectedSubmission?.id === submission.id;
                return (
                  <button
                    type="button"
                    key={submission.id}
                    onClick={() => setSelectedSubmission(submission)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'linear-gradient(135deg, #F26522, #EA580C)' : '#F8FAFC',
                      color: isSelected ? 'white' : '#0F172A',
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? '#F26522' : '#CBD5E1'}`,
                      textAlign: 'left',
                      width: '100%',
                      font: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{submission.reviewType || `Review #${submission.id}`}</span>
                      <span className="badge" style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.12)', color: isSelected ? 'white' : '#059669', fontWeight: 700 }}>
                        {completedStatusLabel(submission.status)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: isSelected ? 0.95 : 0.75, margin: 0 }}>
                      {submission.reviewerName || 'Giảng viên'} — {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSubmission && (
            <div className="glass-card" style={{ padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
                    ✓ Review đã hoàn thành
                  </span>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '0.65rem' }}>
                    {selectedSubmission.reviewType || 'Review Checkpoint'}
                  </h2>
                  <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
                    Nhận xét bởi {selectedSubmission.reviewerName || 'Giảng viên phụ trách'} — Phiên #{selectedSubmission.sessionId}
                  </p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => handleDownloadReport(selectedSubmission.id)} style={{ fontWeight: 600 }}>
                  <Download size={16} />
                  <span>Tải Phiếu Nhận xét (.xlsx)</span>
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '1.5rem', background: '#F8FAFC', border: '1px solid #CBD5E1', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                  <FileText size={17} color="#F26522" />
                  <span>Nhận xét chính thức của Giảng viên</span>
                </h4>
                <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedSubmission.notes || 'Giảng viên chưa nhập nhận xét.'}
                </p>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                <ShieldCheck size={18} color="#10B981" />
                <span>Điểm danh của Nhóm</span>
              </h4>
              <div className="table-container" style={{ marginBottom: '2rem' }}>
                <table className="table">
                  <thead><tr><th>Mã SV</th><th>Họ và tên</th><th>Trạng thái</th></tr></thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>Chưa có dữ liệu điểm danh.</td></tr>
                    ) : attendance.map((entry) => (
                      <tr key={entry.studentId ?? entry.id ?? entry.studentCode}>
                        <td style={{ fontWeight: 700 }}>{entry.studentCode || `SV #${entry.studentId}`}</td>
                        <td>{entry.fullName || entry.studentName || 'Sinh viên'}</td>
                        <td><span className={`badge ${entry.isPresent !== false ? 'badge-success' : 'badge-danger'}`}>{entry.isPresent !== false ? 'Có mặt' : 'Vắng mặt'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                <MessageSquare size={18} color="#0EA5E9" />
                <span>Nhận xét bổ sung</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {comments.length === 0 ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', color: '#64748B', fontSize: '0.85rem', border: '1px solid #E2E8F0' }}>
                    Không có nhận xét bổ sung cho phiên Review này.
                  </div>
                ) : comments.map((comment) => (
                  <div key={comment.id ?? comment.createdAt ?? `${comment.authorName}-${comment.commentText ?? comment.content}`} className="glass-panel" style={{ padding: '1rem', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', gap: '1rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#F26522' }}>{comment.authorName || 'Giảng viên'}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{new Date(comment.createdAt || Date.now()).toLocaleString('vi-VN')}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', margin: 0, color: '#334155' }}>{comment.commentText || comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewResultsPage;
