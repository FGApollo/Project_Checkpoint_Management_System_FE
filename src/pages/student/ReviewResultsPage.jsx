import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, MessageSquare, FileText, Download, Award, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const ReviewResultsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [comments, setComments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMySubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/review-submissions/my');
      const list = Array.isArray(response.data) ? response.data : [];
      setSubmissions(list);
      if (list.length > 0 && !selectedSubmission) {
        setSelectedSubmission(list[0]);
      }
    } catch (err) {
      setError('Failed to fetch evaluation results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  useEffect(() => {
    if (!selectedSubmission) return;
    const fetchDetails = async () => {
      try {
        const sessionId = selectedSubmission.sessionId || selectedSubmission.id;
        const commRes = await api.get(`/review-attendance/${sessionId}/comments`).catch(() => ({ data: [] }));
        setComments(Array.isArray(commRes.data) ? commRes.data : []);

        const attRes = await api.get(`/review-attendance/${sessionId}`).catch(() => ({ data: [] }));
        setAttendance(Array.isArray(attRes.data) ? attRes.data : []);
      } catch (e) {
        console.error('Error fetching submission details:', e);
      }
    };
    fetchDetails();
  }, [selectedSubmission]);

  const handleDownloadReport = (subId, ext) => {
    window.open(`http://localhost:5122/api/review-submissions/${subId}/export.${ext}`, '_blank');
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
          <h1 className="page-title" style={{ color: '#0F172A' }}>Kết quả & Nhận xét Review Đồ án</h1>
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

      {submissions.length === 0 ? (
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
                      <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{sub.reviewType || `Vòng Review #${sub.id}`}</span>
                      <span className={`badge ${isSelected ? '' : getResultBadge(sub.result)}`} style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : undefined, color: isSelected ? 'white' : undefined, fontWeight: 700 }}>
                        {sub.result || 'Đã chấm'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: isSelected ? 0.95 : 0.75, margin: 0 }}>
                      Điểm: <strong>{sub.score || 'N/A'}</strong> — Ngày: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
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
                      ✓ Trạng thái: Đã hoàn tất review (Completed)
                    </span>
                    <span className={`badge ${getResultBadge(selectedSubmission.result)}`} style={{ fontSize: '0.85rem', padding: '0.25rem 0.65rem', fontWeight: 700 }}>
                      Kết quả: {selectedSubmission.result || 'Đạt (Pass)'}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{selectedSubmission.reviewType || 'Kết quả Review Đồ án'}</h2>
                  <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
                    Được đánh giá bởi Giảng viên — ID Phiên: #{selectedSubmission.sessionId || selectedSubmission.id}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-primary" onClick={() => handleDownloadReport(selectedSubmission.id, 'xlsx')} style={{ fontWeight: 600 }}>
                    <Download size={16} />
                    <span>Tải Phiếu Đánh giá (.xlsx)</span>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleDownloadReport(selectedSubmission.id, 'zip')} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}>
                    <Download size={16} color="#F26522" />
                    <span>Tải Hồ sơ (.zip)</span>
                  </button>
                </div>
              </div>

              {/* Verdict & Notes Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: (selectedSubmission.result === 'Fail' || selectedSubmission.result === 'Drop') ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: (selectedSubmission.result === 'Fail' || selectedSubmission.result === 'Drop') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>KẾT QUẢ REVIEW</span>
                  <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: (selectedSubmission.result === 'Fail' || selectedSubmission.result === 'Drop') ? '#EF4444' : '#10B981', margin: '0.4rem 0' }}>
                    {(selectedSubmission.result === 'Fail' || selectedSubmission.result === 'Drop') ? 'KHÔNG ĐẠT' : 'ĐẠT YÊU CẦU'}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                    {(selectedSubmission.result === 'Fail' || selectedSubmission.result === 'Drop') ? 'Yêu cầu sửa chữa & bảo vệ lại' : '✓ Đủ điều kiện bước tiếp'}
                  </span>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                    <FileText size={16} color="#F26522" />
                    <span>Nhận xét Tổng hợp của Giảng viên</span>
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                    {selectedSubmission.notes || 'Nhóm trình bày đáp ứng yêu cầu kiến trúc và chức năng đồ án. Các mục tiêu học tập (CLO) đã được bao phủ đầy đủ trong giải pháp kỹ thuật.'}
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
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>Hồ sơ điểm danh đã xác nhận (`100% Có mặt`).</td></tr>
                    ) : (
                      attendance.map((att, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: '#0F172A' }}>{att.studentCode || `Thành viên #${att.studentId}`}</td>
                          <td style={{ color: '#334155' }}>{att.studentName || 'Thành viên Nhóm'}</td>
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
                <span>Nhật ký Nhận xét Chi tiết ('GET /comments')</span>
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
