import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Plus, RefreshCw, Layers, Users, CheckCircle, AlertCircle, Search, ArrowRight } from 'lucide-react';

const AdminDashboard = () => {
  const [semesters, setSemesters] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [resolveDate, setResolveDate] = useState(new Date().toISOString().split('T')[0]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Semester Modal
  const [showModal, setShowModal] = useState(false);
  const [newCode, setNewCode] = useState('Summer2026');
  const [newName, setNewName] = useState('Summer Semester 2026');
  const [newStart, setNewStart] = useState('2026-05-01');
  const [newEnd, setNewEnd] = useState('2026-08-31');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const semsRes = await api.get('/semesters').catch(() => ({ data: [] }));
      setSemesters(Array.isArray(semsRes.data) ? semsRes.data : []);

      const resolveRes = await api.get(`/semesters/resolve?date=${resolveDate}`).catch(() => ({ data: null }));
      setActiveSemester(resolveRes.data);

      if (resolveRes.data && resolveRes.data.id) {
        const grpsRes = await api.get(`/semesters/${resolveRes.data.id}/groups`).catch(() => ({ data: [] }));
        setGroups(Array.isArray(grpsRes.data) ? grpsRes.data : []);
      } else {
        setGroups([]);
      }
    } catch (err) {
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [resolveDate]);

  const handleCreateSemester = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/semesters', {
        code: newCode,
        name: newName,
        startDate: newStart,
        endDate: newEnd
      });
      setSuccessMsg(`Semester ${newCode} created successfully!`);
      setShowModal(false);
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create semester.');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Trung tâm Điều hành Quản trị</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Quản lý kỳ học, khung thời gian học tập và danh sách nhóm đồ án tốt nghiệp SEP490.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchDashboardData} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <RefreshCw size={16} />
            <span>Làm mới</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Tạo Kỳ học mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Kỳ học đang chọn</span>
            <Calendar size={20} color="#F26522" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="date"
              className="form-input"
              value={resolveDate}
              onChange={(e) => setResolveDate(e.target.value)}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Ngày tra cứu</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem', color: '#0F172A' }}>
            {activeSemester ? (activeSemester.code || activeSemester.name) : 'Chưa có Kỳ học nào'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            {activeSemester ? `${activeSemester.startDate} -> ${activeSemester.endDate}` : 'Không tìm thấy kỳ học cho ngày đã chọn'}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Nhóm Đồ án Đăng ký</span>
            <Layers size={20} color="#10B981" />
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A' }}>{groups.length}</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Thuộc {activeSemester ? activeSemester.code : 'Kỳ học hiện tại'}
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tổng số Kỳ học</span>
            <Users size={20} color="#0EA5E9" />
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A' }}>{semesters.length}</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Các học kỳ được lưu trữ & lên kế hoạch
          </p>
        </div>
      </div>

      {/* Capstone Groups Table */}
      <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Danh sách Nhóm Đồ án Tốt nghiệp</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Các nhóm đồ án thuộc học kỳ đang được tra cứu.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Đang tải danh sách nhóm đồ án...</div>
        ) : groups.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px dashed #CBD5E1' }}>
            Chưa có nhóm đồ án nào trong kỳ học này. Vui lòng vào tab Nhập liệu Excel (`/admin/import`) để tải lên danh sách nhóm và đề tài từ tệp `.xlsx`.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã Nhóm</th>
                  <th>Tên Đề tài Đồ án</th>
                  <th>Giảng viên Hướng dẫn</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.id || g.code}>
                    <td>
                      <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>{g.code}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{g.topicTitle || g.topicName || 'Đồ án tốt nghiệp SEP490'}</td>
                    <td style={{ color: '#334155' }}>{g.supervisorName || g.supervisorCode || 'Chưa phân công'}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>{g.status || 'Đang thực hiện'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Semester Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A' }}>Tạo Kỳ học Mới</h3>
            <form onSubmit={handleCreateSemester}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mã Kỳ học</label>
                <input type="text" className="form-input" value={newCode} onChange={(e) => setNewCode(e.target.value)} required placeholder="ví dụ: Fall2026" style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Tên Kỳ học</label>
                <input type="text" className="form-input" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="ví dụ: Fall Semester 2026" style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày bắt đầu</label>
                  <input type="date" className="form-input" value={newStart} onChange={(e) => setNewStart(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày kết thúc</label>
                  <input type="date" className="form-input" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu Kỳ học</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
