import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  CalendarCheck, 
  Gavel, 
  Clock, 
  CheckSquare, 
  BookOpen, 
  ListChecks, 
  UserCheck 
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'SystemAdministrator' || user.role === 'TrainingDepartment' || user.role === 'Moderator';
  const isLecturer = user.role === 'Lecturer';
  const isStudent = user.role === 'Student';

  const navItemStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: isActive ? 700 : 500,
    fontSize: '0.875rem',
    color: isActive ? '#FFFFFF' : '#475569',
    background: isActive ? 'linear-gradient(135deg, #F26522, #FF7A00)' : 'transparent',
    boxShadow: isActive ? '0 4px 12px rgba(242, 101, 34, 0.3)' : 'none',
    transition: 'all var(--transition-fast)',
    textDecoration: 'none',
    margin: '0.25rem 0.75rem',
  });

  return (
    <aside style={{
      width: '260px',
      background: '#FFFFFF',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '2rem',
      flexShrink: 0,
      boxShadow: '4px 0 16px rgba(0, 0, 0, 0.02)'
    }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', marginBottom: '0.5rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Cổng Điều Hướng
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {isAdmin && (
          <>
            <div style={{ padding: '0.75rem 1.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#F26522' }}>
              QUẢN TRỊ HỆ THỐNG
            </div>
            <NavLink to="/admin/dashboard" style={navItemStyle}>
              <LayoutDashboard size={18} />
              <span>Bảng điều khiển</span>
            </NavLink>
            <NavLink to="/admin/accounts" style={navItemStyle}>
              <Users size={18} />
              <span>Quản lý Tài khoản & Quyền</span>
            </NavLink>
            <NavLink to="/admin/import" style={navItemStyle}>
              <FileSpreadsheet size={18} />
              <span>Nhập liệu Excel (.xlsx)</span>
            </NavLink>
            <NavLink to="/admin/reviews" style={navItemStyle}>
              <CalendarCheck size={18} />
              <span>Lịch & Phân công Phản biện</span>
            </NavLink>
            <NavLink to="/admin/defenses" style={navItemStyle}>
              <Gavel size={18} />
              <span>Hội đồng & Lịch Bảo vệ</span>
            </NavLink>
          </>
        )}

        {isLecturer && (
          <>
            <div style={{ padding: '0.75rem 1.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
              GIẢNG VIÊN & HỘI ĐỒNG
            </div>
            <NavLink to="/lecturer/dashboard" style={navItemStyle}>
              <LayoutDashboard size={18} />
              <span>Tổng quan Giảng viên</span>
            </NavLink>
            <NavLink to="/lecturer/availability" style={navItemStyle}>
              <Clock size={18} />
              <span>Đăng ký Lịch rảnh tuần</span>
            </NavLink>
            <NavLink to="/lecturer/reviews" style={navItemStyle}>
              <CheckSquare size={18} />
              <span>Chấm điểm Phản biện</span>
            </NavLink>
            <NavLink to="/lecturer/defense-room" style={navItemStyle}>
              <Gavel size={18} />
              <span>Phòng chấm Bảo vệ (Live)</span>
            </NavLink>
          </>
        )}

        {isStudent && (
          <>
            <div style={{ padding: '0.75rem 1.5rem 0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#0EA5E9' }}>
              KHÔNG GIAN SINH VIÊN
            </div>
            <NavLink to="/student/dashboard" style={navItemStyle}>
              <LayoutDashboard size={18} />
              <span>Bảng điều khiển Đồ án</span>
            </NavLink>
            <NavLink to="/student/review-schedule" style={navItemStyle}>
              <BookOpen size={18} />
              <span>Đăng ký Phản biện & Nộp bài</span>
            </NavLink>
            <NavLink to="/student/results" style={navItemStyle}>
              <ListChecks size={18} />
              <span>Kết quả & Nhận xét Bảo vệ</span>
            </NavLink>
          </>
        )}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <UserCheck size={16} color="#F26522" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>Quy tắc Độc lập Học thuật</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
            Giảng viên hướng dẫn không được phép chấm phản biện hoặc tham gia hội đồng bảo vệ cho nhóm đồ án của mình.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
