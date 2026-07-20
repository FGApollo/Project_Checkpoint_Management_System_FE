import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Calendar, ShieldCheck, Bell, Wifi } from 'lucide-react';
import api from '../../services/api';
import presenceService from '../../services/presence';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeSemester, setActiveSemester] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);

  useEffect(() => {
    if (user) {
      api.get('/semesters/resolve')
        .then((res) => setActiveSemester(res.data))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const unsubscribe = presenceService.subscribe(setOnlineMembers);
    presenceService.start();
    return () => { unsubscribe(); presenceService.stop(); };
  }, [user]);

  if (!user || location.pathname === '/login') {
    return null;
  }

  const getRoleBadgeText = (role) => {
    switch (role) {
      case 'SystemAdministrator': return 'Quản trị Hệ thống';
      case 'TrainingDepartment': return 'Phòng Đào Tạo';
      case 'Moderator': return 'Moderator';
      case 'Lecturer': return 'Giảng viên';
      case 'Student': return 'Sinh viên';
      default: return role || 'Tài khoản';
    }
  };

  const getPortalSubTitle = (role) => {
    switch (role) {
      case 'SystemAdministrator': return 'SYSTEM ADMIN PANEL';
      case 'TrainingDepartment':
      case 'Moderator': return 'MODERATOR PANEL';
      case 'Lecturer': return 'LECTURER PORTAL';
      case 'Student': return 'STUDENT PORTAL';
      default: return 'MANAGEMENT PORTAL';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SystemAdministrator':
      case 'TrainingDepartment':
      case 'Moderator':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' };
      case 'Lecturer':
        return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981' };
      case 'Student':
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    }
  };

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      padding: '0 2rem',
      height: '65px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              Capstone Portal
            </h1>
            <p style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 500 }}>
              {getPortalSubTitle(user.role)}
            </p>
          </div>
        </div>

        {activeSemester && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#F8FAFC',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            marginLeft: '0.5rem'
          }}>
            <Calendar size={14} color="#4F46E5" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
              {activeSemester.code || activeSemester.name || 'Kỳ học hiện tại'}
            </span>
          </div>
        )}
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="button" style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '8px',
            position: 'relative',
          }}>
            <Bell size={20} color="#64748B" />
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#EF4444',
              border: '2px solid white',
            }} />
          </button>

          <div style={{ width: '1px', height: '28px', background: '#E2E8F0' }} />

          <div title={onlineMembers.map((member) => `${member.displayName} (${member.role})`).join(', ') || 'Chưa có người dùng khác đang hoạt động'} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, maxWidth: '220px' }}>
            <Wifi size={15} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{onlineMembers.length} online{onlineMembers.length > 0 ? ` · ${onlineMembers.slice(0, 2).map((member) => member.displayName).join(', ')}` : ''}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#E0E7FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <User size={18} color="#4F46E5" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>
                {user.fullName || user.email || user.username}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: getRoleBadgeColor(user.role).color,
              }}>
                {getRoleBadgeText(user.role)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Đăng xuất"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '8px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              cursor: 'pointer',
              color: '#EF4444',
              fontWeight: 600,
              fontSize: '0.8rem',
              transition: 'all 0.15s ease',
            }}
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
