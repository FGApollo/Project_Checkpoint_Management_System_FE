import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Calendar, ShieldCheck, Award } from 'lucide-react';
import api from '../../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [activeSemester, setActiveSemester] = useState(null);

  useEffect(() => {
    if (user) {
      api.get('/semesters/resolve')
        .then((res) => setActiveSemester(res.data))
        .catch(() => {
          // If no active semester exists or API fails, ignore gracefully
        });
    }
  }, [user]);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'SystemAdministrator':
      case 'TrainingDepartment':
      case 'Moderator':
        return 'badge-primary';
      case 'Lecturer':
        return 'badge-success';
      case 'Student':
        return 'badge-info';
      default:
        return 'badge-warning';
    }
  };

  const getRoleBadgeText = (role) => {
    switch (role) {
      case 'SystemAdministrator': return 'Quản trị Hệ thống';
      case 'TrainingDepartment': return 'Phòng Đào Tạo';
      case 'Moderator': return 'Điều phối viên';
      case 'Lecturer': return 'Giảng viên / Hội đồng';
      case 'Student': return 'Sinh viên SEP490';
      default: return role || 'Tài khoản';
    }
  };

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      padding: '0.875rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #F26522, #FF7A00)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(242, 101, 34, 0.3)'
          }}>
            <Award size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A' }}>
              CPMS <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F26522' }}>v1.1</span>
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1, fontWeight: 500 }}>
              Hệ thống Quản lý Đồ án - Đại học FPT
            </p>
          </div>
        </div>

        {activeSemester && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#F8FAFC',
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            border: '1px solid #E2E8F0'
          }}>
            <Calendar size={14} color="#F26522" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
              {activeSemester.code || activeSemester.name || 'Kỳ học hiện tại'}
            </span>
            <span className="badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              Đang diễn ra
            </span>
          </div>
        )}
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#F1F5F9',
              border: '2px solid #F26522',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} color="#F26522" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                {user.fullName || user.username}
              </span>
              <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ alignSelf: 'flex-start', marginTop: '0.15rem' }}>
                <ShieldCheck size={12} /> {getRoleBadgeText(user.role)}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary"
            title="Đăng xuất"
            style={{ padding: '0.5rem 0.875rem', gap: '0.4rem', background: '#F8FAFC', border: '1px solid #CBD5E1' }}
          >
            <LogOut size={16} color="#EF4444" />
            <span style={{ fontWeight: 600, color: '#0F172A' }}>Đăng xuất</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
