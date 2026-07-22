import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { Users, CalendarClock, FileSpreadsheet, ArrowRight, Layers, Activity } from 'lucide-react';
import { PageSkeleton } from '../../components/common/Skeleton';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ accounts: 0, semesters: 0, rounds: 0, groups: 0 });
  const [activeSemester, setActiveSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [accRes, semRes] = await Promise.allSettled([
          api.get('/accounts?page=1&pageSize=1'),
          api.get('/semesters?pageSize=100'),
        ]);
        const accData = accRes.status === 'fulfilled' ? accRes.value.data : {};
        const semesterPayload = semRes.status === 'fulfilled' ? semRes.value.data : {};
        const semesters = Array.isArray(semesterPayload) ? semesterPayload : semesterPayload?.items || [];
        const semData = semesters.find((semester) => semester.isActive) || semesters[0] || null;
        const roundData = semData
          ? await api.get(`/review-scheduling/rounds?semesterId=${semData.id}`).then((res) => res.data).catch(() => [])
          : [];

        setStats({
          accounts: accData?.totalCount || 0,
          rounds: Array.isArray(roundData) ? roundData.length : (roundData?.items?.length || 0),
        });
        setActiveSemester(semData);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <PageSkeleton cards={3} rows={3} />;

  const quickLinks = [
    { to: '/admin/accounts', icon: Users, label: 'Quản lý Người dùng', desc: 'Sinh viên, Giảng viên, Moderator', color: '#4F46E5', bg: '#EEF2FF' },
    { to: '/admin/import', icon: FileSpreadsheet, label: 'Nhập liệu Excel', desc: 'Import danh sách từ file .xlsx', color: '#D97706', bg: '#FEF3C7' },
    { to: '/admin/reviews', icon: CalendarClock, label: 'Quản lý Đợt & Xếp lịch', desc: 'Tạo đợt review, phân công, publish', color: '#16A34A', bg: '#DCFCE7' },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Dashboard</h1>
          <p className="page-subtitle" style={{ color: '#64748B' }}>
            Xin chào, <strong>{user?.fullName || user?.username}</strong>. Tổng quan hệ thống theo dõi và đánh giá review checkpoint.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#4F46E5" />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{stats.accounts}</p>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Tài khoản</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={20} color="#16A34A" />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{stats.rounds}</p>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Đợt Review</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} color="#D97706" />
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{activeSemester?.code || '—'}</p>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Kỳ hiện tại</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>Truy cập nhanh</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
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
              <div style={{ width: 44, height: 44, borderRadius: 10, background: link.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <link.icon size={22} color={link.color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9rem' }}>{link.label}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748B' }}>{link.desc}</p>
              </div>
              <ArrowRight size={16} color="#94A3B8" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
