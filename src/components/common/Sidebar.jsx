import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  CalendarClock, 
  ClipboardCheck,
  Clock, 
  CheckSquare, 
  BookOpen, 
  ListChecks,
  LogOut,
  Gavel
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'SystemAdministrator' || user.role === 'TrainingDepartment' || user.role === 'Moderator';
  const isLecturer = user.role === 'Lecturer';
  const isStudent = user.role === 'Student';

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 1rem',
    borderRadius: '8px',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.875rem',
    color: isActive ? '#FFFFFF' : '#475569',
    background: isActive ? '#4F46E5' : 'transparent',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    margin: '2px 0',
    cursor: 'pointer',
  });

  const sectionLabel = (text) => (
    <div style={{
      padding: '1.25rem 0 0.5rem',
      fontSize: '0.7rem',
      fontWeight: 700,
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      {text}
    </div>
  );

  return (
    <aside style={{
      width: '256px',
      background: '#FFFFFF',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: 'calc(100vh - 65px)',
      position: 'sticky',
      top: '65px',
    }}>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.75rem 0.75rem', overflowY: 'auto' }}>
        {isAdmin && (
          <>
            {sectionLabel('Quản trị hệ thống')}
            <NavLink to="/admin/dashboard" style={navItemStyle}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/admin/accounts" style={navItemStyle}>
              <Users size={18} />
              <span>Quản lý Người dùng</span>
            </NavLink>
            <NavLink to="/admin/semesters" style={navItemStyle}>
              <BookOpen size={18} />
              <span>Quản lý Kỳ học</span>
            </NavLink>
            <NavLink to="/admin/import" style={navItemStyle}>
              <FileSpreadsheet size={18} />
              <span>Nhập liệu Excel (.xlsx)</span>
            </NavLink>

            {sectionLabel('Điều phối Review')}
            <NavLink to="/admin/reviews" style={navItemStyle}>
              <CalendarClock size={18} />
              <span>Quản lý Đợt & Xếp lịch</span>
            </NavLink>
            <NavLink to="/admin/review-tracking" style={navItemStyle}>
              <ClipboardCheck size={18} />
              <span>Theo dõi Review</span>
            </NavLink>
            <NavLink to="/admin/defenses" style={navItemStyle}>
              <Gavel size={18} />
              <span>Hội đồng & Lịch Bảo vệ</span>
            </NavLink>
          </>
        )}

        {isLecturer && (
          <>
            {sectionLabel('Giảng viên')}
            <NavLink to="/lecturer/dashboard" style={navItemStyle}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/lecturer/availability" style={navItemStyle}>
              <Clock size={18} />
              <span>Đăng ký Slot rảnh</span>
            </NavLink>
            <NavLink to="/lecturer/reviews" style={navItemStyle}>
              <CheckSquare size={18} />
              <span>Điểm danh & Nhận xét Review</span>
            </NavLink>
          </>
        )}

        {isStudent && (
          <>
            {sectionLabel('Sinh viên')}
            <NavLink to="/student/dashboard" style={navItemStyle}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/student/review-schedule" style={navItemStyle}>
              <BookOpen size={18} />
              <span>Đăng ký Nguyện vọng</span>
            </NavLink>
            <NavLink to="/student/results" style={navItemStyle}>
              <ListChecks size={18} />
              <span>Kết quả Review</span>
            </NavLink>
          </>
        )}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
        <button
          type="button"
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.7rem 1rem',
            borderRadius: '8px',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#EF4444',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
