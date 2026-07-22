import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Calendar, ShieldCheck, Bell, Wifi } from 'lucide-react';
import api from '../../services/api';
import presenceService from '../../services/presence';
import notificationService from '../../services/notifications';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeSemester, setActiveSemester] = useState(null);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const notificationRef = useRef(null);

  const loadNotifications = useCallback(async ({ showLoading = false } = {}) => {
    if (!user) return;
    if (showLoading) setNotificationsLoading(true);
    try {
      const data = await notificationService.getLatest();
      setNotifications(Array.isArray(data?.items) ? data.items : []);
      setUnreadCount(Number(data?.unreadCount) || 0);
      setNotificationsError('');
    } catch {
      setNotificationsError('Không thể tải thông báo. Vui lòng thử lại.');
    } finally {
      if (showLoading) setNotificationsLoading(false);
    }
  }, [user]);

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

  useEffect(() => {
    if (!user) return undefined;
    loadNotifications({ showLoading: true });
    const intervalId = window.setInterval(loadNotifications, 60_000);
    return () => window.clearInterval(intervalId);
  }, [user, loadNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [notificationsOpen]);

  const toggleNotifications = () => {
    setNotificationsOpen((open) => !open);
    if (!notificationsOpen) loadNotifications({ showLoading: true });
  };

  const markNotificationRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await notificationService.markRead(notification.id);
      setNotifications((items) => items.map((item) => (
        item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch {
      setNotificationsError('Không thể đánh dấu thông báo đã đọc.');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((items) => items.map((item) => ({
        ...item, isRead: true, readAt: item.readAt || new Date().toISOString(),
      })));
      setUnreadCount(0);
      setNotificationsError('');
    } catch {
      setNotificationsError('Không thể đánh dấu tất cả đã đọc.');
    }
  };

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
    <>
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
          <div ref={notificationRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={toggleNotifications}
              aria-label={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ''}`}
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              title="Thông báo"
              style={{
                background: notificationsOpen ? '#F1F5F9' : 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '8px',
                position: 'relative',
              }}
            >
              <Bell size={20} color="#64748B" />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-7px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  borderRadius: '9px',
                  background: '#EF4444',
                  border: '2px solid white',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  lineHeight: '14px',
                  textAlign: 'center',
                }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {notificationsOpen && (
              <section
                role="dialog"
                aria-label="Danh sách thông báo"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: 'min(390px, calc(100vw - 24px))',
                  maxHeight: '480px',
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18)',
                  zIndex: 100,
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.9rem 1rem', borderBottom: '1px solid #E2E8F0',
                }}>
                  <strong style={{ color: '#0F172A' }}>Thông báo</strong>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      style={{ border: 0, background: 'none', color: '#4F46E5', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '410px', overflowY: 'auto' }}>
                  {notificationsLoading && notifications.length === 0 && (
                    <div style={{ padding: '1.25rem', color: '#64748B', textAlign: 'center' }}>Đang tải thông báo...</div>
                  )}
                  {notificationsError && (
                    <div role="alert" style={{ padding: '0.75rem 1rem', color: '#B91C1C', background: '#FEF2F2', fontSize: '0.8rem' }}>
                      {notificationsError}
                    </div>
                  )}
                  {!notificationsLoading && notifications.length === 0 && !notificationsError && (
                    <div style={{ padding: '2rem 1rem', color: '#64748B', textAlign: 'center' }}>Bạn chưa có thông báo nào.</div>
                  )}
                  {notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => markNotificationRead(notification)}
                      style={{
                        width: '100%', border: 0, borderBottom: '1px solid #F1F5F9',
                        background: notification.isRead ? '#FFFFFF' : '#EEF2FF',
                        padding: '0.85rem 1rem', textAlign: 'left', cursor: 'pointer',
                      }}
                    >
                      <span style={{ display: 'block', color: '#0F172A', fontWeight: notification.isRead ? 600 : 800, fontSize: '0.85rem' }}>
                        {notification.title}
                      </span>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: '#64748B', fontSize: '0.78rem', lineHeight: 1.45, marginTop: '0.3rem' }}>
                        {notification.message}
                      </span>
                      <time style={{ display: 'block', color: '#94A3B8', fontSize: '0.7rem', marginTop: '0.4rem' }}>
                        {new Date(notification.createdAt).toLocaleString('vi-VN')}
                      </time>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div style={{ width: '1px', height: '28px', background: '#E2E8F0' }} />

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

      <div className="presence-widget">
        {presenceOpen && (
          <div className="presence-list" role="status" aria-label="Danh sách người dùng đang online">
            <strong>Đang hoạt động ({onlineMembers.length})</strong>
            {onlineMembers.length === 0 ? (
              <span className="presence-empty">Chưa có người dùng online</span>
            ) : onlineMembers.map((member) => (
              <div className="presence-member" key={member.userId ?? member.connectionId}>
                <span className="presence-dot" aria-hidden="true" />
                <span className="presence-member-name">{member.displayName}</span>
                <small>{getRoleBadgeText(member.role)}</small>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="presence-indicator"
          onClick={() => setPresenceOpen((open) => !open)}
          aria-expanded={presenceOpen}
          aria-label={`${onlineMembers.length} người dùng đang hoạt động. Nhấn để xem danh sách.`}
        >
          <Wifi size={15} aria-hidden="true" />
          <span>{onlineMembers.length} online{onlineMembers.length === 1 ? ` · ${onlineMembers[0].displayName}` : ''}</span>
        </button>
      </div>
    </>
  );
};

export default Navbar;
