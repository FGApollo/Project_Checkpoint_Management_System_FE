import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { LayoutDashboard, Clock, CheckSquare, Gavel, ShieldCheck, Award, ArrowRight, Calendar, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const LecturerDashboard = () => {
  const { user } = useAuth();
  const [myReviews, setMyReviews] = useState([]);
  const [myDefenses, setMyDefenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const revsRes = await api.get('/review-sessions/my').catch(() => ({ data: [] }));
        setMyReviews(Array.isArray(revsRes.data) ? revsRes.data : []);

        const defsRes = await api.get('/defense-management/my-board-sessions').catch(() => ({ data: [] }));
        setMyDefenses(Array.isArray(defsRes.data) ? defsRes.data : []);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Khu vực Làm việc Giảng viên</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Xin chào, {user?.fullName || user?.username}. Quản lý lịch rảnh, chấm điểm phản biện và tham gia hội đồng bảo vệ trực tiếp.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/lecturer/availability" className="btn btn-secondary" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <Clock size={16} color="#F26522" />
            <span style={{ fontWeight: 600 }}>Cập nhật Lịch rảnh</span>
          </Link>
          <Link to="/lecturer/defense-room" className="btn btn-primary">
            <Gavel size={16} />
            <span>Vào Phòng Bảo vệ</span>
          </Link>
        </div>
      </div>

      {/* Role Badges Summary Card */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem', background: 'radial-gradient(circle at top left, rgba(242, 101, 34, 0.12), #FFFFFF 80%)', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #F26522, #FF7A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(242, 101, 34, 0.25)' }}>
            <Award size={26} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>Trách nhiệm Học thuật & Vai trò được Phân công</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>Đảm bảo tính toàn vẹn và không xung đột vai trò theo tiêu chuẩn chất lượng.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span className="badge" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <ShieldCheck size={16} /> Giảng viên Hướng dẫn Nhóm
          </span>
          <span className="badge" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>
            <CheckSquare size={16} /> Giảng viên Phản biện (Review 1/2/3)
          </span>
          <span className="badge" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9' }}>
            <Gavel size={16} /> Chủ tịch / Ủy viên Hội đồng Bảo vệ
          </span>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(242,101,34,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#F26522" />
            </div>
            <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>Ca 1 - Ca 8</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0F172A' }}>Lịch rảnh Phản biện hàng tuần</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', flex: 1, lineHeight: 1.5 }}>
            Đăng ký các ngày và ca rảnh (Ca 1 - Ca 8) trong tuần cho đợt phản biện sắp tới. Hệ thống sẽ tự động xếp lịch dựa trên thời gian bạn đã đăng ký.
          </p>
          <Link to="/lecturer/availability" className="btn btn-secondary" style={{ justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <span style={{ fontWeight: 600 }}>Quản lý Lịch rảnh</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={20} color="#10B981" />
            </div>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>{myReviews.length} Phân công</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0F172A' }}>Danh sách Phản biện & Chấm điểm</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', flex: 1, lineHeight: 1.5 }}>
            Điểm danh sinh viên tham dự, nhận xét tiến độ chuyên môn, lưu nháp phiếu chấm và chính thức nộp kết quả đánh giá cho Phòng Đào tạo.
          </p>
          <Link to="/lecturer/reviews" className="btn btn-secondary" style={{ justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <span style={{ fontWeight: 600 }}>Chấm điểm Phản biện</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(14, 165, 233, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gavel size={20} color="#0EA5E9" />
            </div>
            <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9' }}>{myDefenses.length} Ca bảo vệ</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0F172A' }}>Phòng Chấm Bảo vệ Trực tiếp</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', flex: 1, lineHeight: 1.5 }}>
            Kết nối trực tiếp vào phòng hội đồng bảo vệ đồ án. Chủ tịch mở/đóng ca chấm; các Ủy viên nhập điểm (0.0 - 10.0) cùng ảnh minh chứng trực tuyến.
          </p>
          <Link to="/lecturer/defense-room" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
            <span>Vào Phòng Hội đồng</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Summary Table of Assigned Defense Sessions */}
      <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
          <Calendar size={20} color="#F26522" />
          <span>Lịch Bảo vệ sắp tới của Tôi</span>
        </h3>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Đang tải ca bảo vệ được phân công...</div>
        ) : myDefenses.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
            Hiện tại bạn chưa được phân công lịch bảo vệ nào. Khi Phòng Đào tạo xếp lịch cho hội đồng, thông tin sẽ hiển thị tại đây.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã Ca</th>
                  <th>Mã Hội đồng</th>
                  <th>Mã Nhóm Đồ án</th>
                  <th>Ngày & Ca học</th>
                  <th>Phòng</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {myDefenses.map((s) => (
                  <tr key={s.id}>
                    <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>{s.code || `#${s.id}`}</span></td>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{s.councilCode || `Hội đồng #${s.councilId}`}</td>
                    <td><span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9' }}>{s.groupCode || `Nhóm #${s.groupId}`}</span></td>
                    <td style={{ color: '#475569' }}>{s.sessionDate} — Ca {s.slot}</td>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{s.room}</td>
                    <td>
                      <span className="badge" style={{
                        background: s.isLocked ? 'rgba(239,68,68,0.15)' : s.startedAt ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: s.isLocked ? '#EF4444' : s.startedAt ? '#10B981' : '#F59E0B'
                      }}>
                        {s.isLocked ? 'Đã khóa / Hoàn tất' : s.startedAt ? 'Đang diễn ra' : 'Chờ Chủ tịch mở'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/lecturer/defense-room?session=${s.id || s.code}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A' }}>
                        <span style={{ fontWeight: 600 }}>Vào Phòng</span>
                        <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerDashboard;
