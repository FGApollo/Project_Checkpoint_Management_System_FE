import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import { AlertCircle, Download, FileText, MessageSquare, RefreshCw, ShieldCheck, UserCheck } from 'lucide-react';
import { PageSkeleton } from '../../components/common/Skeleton';

const completedStatusLabel = (status) => status === 'Submitted' ? 'Đã hoàn thành' : 'Đã lưu nhận xét';

const ReviewResultsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
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
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải nhận xét Review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, []);

  // Gộp các nhận xét của nhiều giảng viên thuộc cùng 1 đợt Review (Review 1, Review 2...)
  const groupedReviews = useMemo(() => {
    const map = new Map();

    submissions.forEach((item) => {
      const key = item.reviewType || (item.sessionId ? `session-${item.sessionId}` : `sub-${item.id}`);
      if (!map.has(key)) {
        map.set(key, {
          key,
          reviewType: item.reviewType || 'Review Checkpoint',
          sessionId: item.sessionId,
          items: []
        });
      }
      map.get(key).items.push(item);
    });

    return Array.from(map.values());
  }, [submissions]);

  // Tự chọn đợt Review đầu tiên khi danh sách tải xong
  useEffect(() => {
    if (groupedReviews.length > 0) {
      setSelectedGroupKey((prevKey) => {
        if (prevKey && groupedReviews.some((g) => g.key === prevKey)) return prevKey;
        return groupedReviews[0].key;
      });
    } else {
      setSelectedGroupKey(null);
    }
  }, [groupedReviews]);

  const activeGroup = useMemo(() => {
    return groupedReviews.find((g) => g.key === selectedGroupKey) || groupedReviews[0] || null;
  }, [groupedReviews, selectedGroupKey]);

  useEffect(() => {
    if (!activeGroup || !activeGroup.sessionId) {
      setComments([]);
      setAttendance([]);
      return;
    }

    const fetchDetails = async () => {
      const sessionId = Number(activeGroup.sessionId);
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
  }, [activeGroup]);

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
      link.download = `${activeGroup?.reviewType || 'Review'}_nhan-xet.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải phiếu nhận xét.');
    }
  };

  if (loading && groupedReviews.length === 0) return <PageSkeleton cards={2} rows={5} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Nhận xét Review Checkpoint</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>
            Xem trạng thái hoàn thành, điểm danh và nhận xét chuyên môn từ Hội đồng Giảng viên gửi sau mỗi đợt Review.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchMySubmissions} disabled={loading} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}>
          <RefreshCw size={16} color="#F26522" className={loading ? 'spin' : ''} />
          <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!loading && groupedReviews.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <FileText size={48} color="#F26522" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Chưa có nhận xét Review</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', maxWidth: '460px', margin: '0.5rem auto 0', lineHeight: 1.5 }}>
            Nhận xét sẽ xuất hiện sau khi giảng viên kết thúc buổi Review và gửi nhận xét chính thức cho nhóm.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr', gap: '1.5rem' }}>
          {/* CỘT BÊN TRÁI: DANH SÁCH CÁC ĐỢT REVIEW ĐÃ GỘP */}
          <div className="glass-card" style={{ padding: '1.25rem', height: 'fit-content', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>Lịch sử Nhận xét</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {groupedReviews.map((group) => {
                const isSelected = activeGroup?.key === group.key;
                const lecturerNames = group.items
                  .map((item) => item.reviewerName)
                  .filter(Boolean)
                  .join(', ');
                const primaryDate = group.items[0]?.submittedAt
                  ? new Date(group.items[0].submittedAt).toLocaleDateString('vi-VN')
                  : 'Gần đây';

                return (
                  <button
                    type="button"
                    key={group.key}
                    onClick={() => setSelectedGroupKey(group.key)}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: isSelected ? 'linear-gradient(135deg, #F26522, #EA580C)' : '#F8FAFC',
                      color: isSelected ? 'white' : '#0F172A',
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? '#F26522' : '#CBD5E1'}`,
                      textAlign: 'left',
                      width: '100%',
                      font: 'inherit',
                      boxShadow: isSelected ? '0 4px 12px rgba(242, 101, 34, 0.25)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{group.reviewType}</span>
                      <span className="badge" style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(16,185,129,0.12)', color: isSelected ? 'white' : '#059669', fontWeight: 700, fontSize: '0.72rem' }}>
                        {completedStatusLabel(group.items[0]?.status)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', opacity: isSelected ? 0.95 : 0.75, margin: 0, lineHeight: 1.45 }}>
                      <UserCheck size={13} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                      {lecturerNames || 'Hội đồng Giảng viên'} — {primaryDate}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CỘT BÊN PHẢI: CHI TIẾT ĐỢT REVIEW ĐƯỢC CHỌN (GỘP TẤT CẢ GIẢNG VIÊN HỘI ĐỒNG) */}
          {activeGroup && (
            <div className="glass-card" style={{ padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
                    ✓ Review đã hoàn thành
                  </span>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '0.65rem', marginBotton: '0.35rem' }}>
                    {activeGroup.reviewType}
                  </h2>
                  <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
                    Hội đồng {activeGroup.items.length} Giảng viên nhận xét: <strong>{activeGroup.items.map((i) => i.reviewerName).filter(Boolean).join(', ')}</strong> — Phiên #{activeGroup.sessionId}
                  </p>
                </div>
                {activeGroup.items[0]?.id && (
                  <button type="button" className="btn btn-primary" onClick={() => handleDownloadReport(activeGroup.items[0].id)} style={{ fontWeight: 600 }}>
                    <Download size={16} />
                    <span>Tải Phiếu Nhận xét (.xlsx)</span>
                  </button>
                )}
              </div>

              {/* PHẦN NHẬN XÉT CHÍNH THỨC CỦA CÁC GIẢNG VIÊN TRONG HỘI ĐỒNG */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                  <FileText size={18} color="#F26522" />
                  <span>Nhận xét chính thức của Hội đồng Giảng viên ({activeGroup.items.length} nhận xét)</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeGroup.items.map((sub, idx) => (
                    <div key={sub.id} className="glass-panel" style={{ padding: '1.25rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ background: '#F26522', color: 'white', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                            {idx + 1}
                          </span>
                          Giảng viên: {sub.reviewerName || 'Giảng viên phụ trách'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {sub.notes || 'Giảng viên chưa nhập nội dung nhận xét chi tiết.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BẢNG ĐIỂM DANH VÀ CHỮ KÝ */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
                <ShieldCheck size={18} color="#10B981" />
                <span>Điểm danh của Nhóm</span>
              </h4>
              <div className="table-container" style={{ marginBottom: '2rem' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mã SV</th>
                      <th>Họ và tên</th>
                      <th>Trạng thái Điểm danh</th>
                      <th>Chữ ký / Xác nhận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>Chưa có dữ liệu điểm danh.</td></tr>
                    ) : attendance.map((entry) => {
                      const isSigned = Boolean(entry.studentConfirmedAt);
                      const defaultDateStr = activeGroup?.items[0]?.submittedAt
                        ? new Date(activeGroup.items[0].submittedAt).toLocaleDateString('vi-VN')
                        : new Date().toLocaleDateString('vi-VN');
                      const signDateText = isSigned
                        ? new Date(entry.studentConfirmedAt).toLocaleString('vi-VN')
                        : defaultDateStr;

                      return (
                        <tr key={entry.studentId ?? entry.id ?? entry.studentCode}>
                          <td style={{ fontWeight: 700 }}>{entry.studentCode || `SV #${entry.studentId}`}</td>
                          <td>{entry.fullName || entry.studentName || 'Sinh viên'}</td>
                          <td>
                            <span className={`badge ${entry.isPresent !== false ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                              {entry.isPresent !== false ? 'Có mặt' : 'Vắng mặt'}
                            </span>
                          </td>
                          <td>
                            {isSigned ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span className="badge badge-success" style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                                  ✓ Đã ký
                                </span>
                                <small style={{ color: '#64748B', fontSize: '0.78rem' }}>({signDateText})</small>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span className="badge badge-warning" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontWeight: 700 }}>
                                  Chưa ký
                                </span>
                                <small style={{ color: '#94A3B8', fontSize: '0.78rem' }}>({signDateText})</small>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* NHẬN XÉT BỔ SUNG */}
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
