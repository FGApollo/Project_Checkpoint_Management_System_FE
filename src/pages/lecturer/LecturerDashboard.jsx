import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/authContextValue.js';
import api from '../../services/api';
import { Clock, CheckSquare, Calendar, Users, ArrowRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageSkeleton } from '../../components/common/Skeleton';

const SLOT_LABELS = {
  1: 'Slot 1 (07:30 – 09:00)',
  2: 'Slot 2 (09:10 – 10:40)',
  3: 'Slot 3 (10:50 – 12:20)',
  4: 'Slot 4 (12:50 – 14:20)',
  5: 'Slot 5 (14:30 – 16:00)',
};

const LecturerDashboard = () => {
  const { user } = useAuth();
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const revsRes = await api.get('/review-sessions/my').catch(() => ({ data: [] }));
        const data = revsRes.data;
        setMyReviews(Array.isArray(data) ? data : (data?.items || []));
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  };

  if (loading && myReviews.length === 0) return <PageSkeleton cards={3} rows={5} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Dashboard Giảng viên</h1>
          <p className="page-subtitle" style={{ color: '#64748B' }}>
            Xin chào, <strong>{user?.fullName || user?.username}</strong>. Quản lý đăng ký slot và theo dõi lịch review.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          padding: '1.25rem',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckSquare size={22} color="#4F46E5" />
          </div>
          <div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{myReviews.length}</p>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Slot Review được phân công</p>
          </div>
        </div>

        <Link to="/lecturer/availability" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '1.25rem',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} color="#D97706" />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>Đăng ký Slot</p>
              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Chọn các slot có thể tham gia review</p>
            </div>
            <ArrowRight size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </div>
        </Link>

        <Link to="/lecturer/reviews" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '1.25rem',
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={22} color="#16A34A" />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>Hoàn thành Review</p>
              <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Điểm danh và gửi nhận xét cho sinh viên</p>
            </div>
            <ArrowRight size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </div>
        </Link>
      </div>

      {/* Review Schedule List */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Lịch Review được Phân công</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>Danh sách các slot review mà bạn cần tham gia chấm checkpoint</p>
          </div>
        </div>


        {!loading && myReviews.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
            <Calendar size={40} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 600, color: '#64748B' }}>Chưa có lịch review nào được phân công</p>
            <p style={{ fontSize: '0.8rem' }}>Lịch sẽ hiển thị sau khi Admin publish đợt review.</p>
          </div>
        )}
        {!loading && myReviews.length > 0 && (
          <div style={{ padding: '0.5rem' }}>
            {myReviews.map((review, idx) => (
              <div key={review.submissionId ?? `${review.sessionId}-${review.groupId}`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                margin: '0.25rem 0',
                borderRadius: '8px',
                background: idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
                transition: 'background 0.15s ease',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: '#EEF2FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Clock size={18} color="#4F46E5" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                      {SLOT_LABELS[review.slot] || `Slot ${review.slot || '?'}`}
                    </span>
                    <span style={{ color: '#94A3B8' }}>|</span>
                    <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {formatDate(review.sessionDate || review.date || review.scheduledDate)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    {review.room && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#64748B' }}>
                        <MapPin size={13} /> {review.room}
                      </span>
                    )}
                    {review.groupCode && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#64748B' }}>
                        <Users size={13} /> {review.groupCode}
                      </span>
                    )}
                    {(review.type || review.reviewType) && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: '#EEF2FF',
                        color: '#4F46E5',
                      }}>
                        {review.type || review.reviewType}
                      </span>
                    )}
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  background: review.submissionStatus === 'Submitted' || review.sessionStatus === 'Completed' || review.status === 'Completed' ? '#DCFCE7' : '#FEF3C7',
                  color: review.submissionStatus === 'Submitted' || review.sessionStatus === 'Completed' || review.status === 'Completed' ? '#16A34A' : '#D97706',
                  whiteSpace: 'nowrap',
                }}>
                  {review.submissionStatus === 'Submitted' || review.sessionStatus === 'Completed' || review.status === 'Completed' ? 'Đã nhận xét' : 'Sắp tới'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerDashboard;
