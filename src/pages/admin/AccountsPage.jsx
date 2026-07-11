import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Plus, Search, Filter, Shield, UserCheck, UserX, Lock, Unlock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    role: 'Lecturer',
    identityCode: '',
    email: '',
    password: 'Test@123456',
    fullName: '',
    department: '',
    position: '',
    permissionScope: 'Standard',
    isPartTime: false,
    classCode: '',
    batch: '2026',
    major: 'Software Engineering'
  });

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/accounts');
      setAccounts(Array.isArray(response.data) ? response.data : (response.data.items || []));
    } catch (err) {
      setError('Failed to fetch user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { ...formData };
      if (payload.role !== 'Lecturer' && payload.role !== 'TrainingDepartment' && payload.role !== 'SystemAdministrator' && payload.role !== 'Moderator') {
        payload.department = null;
      }
      if (payload.role !== 'Student') {
        payload.classCode = null;
        payload.batch = null;
        payload.major = null;
      }
      await api.post('/accounts', payload);
      setSuccess(`Account for ${formData.fullName || formData.email} created successfully!`);
      setShowCreateModal(false);
      setFormData({
        role: 'Lecturer',
        identityCode: '',
        email: '',
        password: 'Test@123456',
        fullName: '',
        department: '',
        position: '',
        permissionScope: 'Standard',
        isPartTime: false,
        classCode: '',
        batch: '2026',
        major: 'Software Engineering'
      });
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user account.');
    }
  };

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      await api.patch(`/accounts/${userId}/status`, {
        isActive: !currentActive,
        unlock: true
      });
      setSuccess(`Account status updated to ${!currentActive ? 'Active' : 'Deactivated'}.`);
      fetchAccounts();
    } catch (err) {
      setError('Failed to update account status.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/accounts/${userId}/role`, { role: newRole });
      setSuccess('Account role updated successfully.');
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update account role.');
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = (acc.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (acc.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const effectiveRole = (acc.role === 'SystemAdministrator' || acc.role === 'TrainingDepartment' || acc.role === 'Moderator') ? 'Moderator' : acc.role;
    const matchesRole = roleFilter === 'ALL' || effectiveRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Quản lý Tài khoản & Quyền</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Tạo mới, kích hoạt, mở khóa và phân quyền cho giảng viên, sinh viên và cán bộ ĐH FPT.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchAccounts} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <RefreshCw size={16} />
            <span>Làm mới</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Tạo Tài khoản mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '240px' }}>
            <Search size={18} color="#64748B" />
            <input
              type="text"
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo mã số, tên đăng nhập hoặc email..."
              style={{ width: '100%', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="#64748B" />
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ minWidth: '180px', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="Student">Sinh viên</option>
              <option value="Lecturer">Giảng viên</option>
              <option value="Moderator">Moderator</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Địa chỉ Email</th>
                <th>Vai trò hệ thống</th>
                <th>Trạng thái / Khóa</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Đang tải danh sách tài khoản...</td></tr>
              ) : filteredAccounts.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Không có tài khoản nào phù hợp với bộ lọc.</td></tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const isLocked = acc.lockedUntil && new Date(acc.lockedUntil) > new Date();
                  return (
                    <tr key={acc.id}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>#{acc.id}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>{acc.username}</span>
                      </td>
                      <td style={{ color: '#475569' }}>{acc.email}</td>
                      <td>
                        <select
                          className="form-select"
                          value={(acc.role === 'SystemAdministrator' || acc.role === 'TrainingDepartment' || acc.role === 'Moderator') ? 'Moderator' : acc.role}
                          onChange={(e) => {
                            const val = e.target.value;
                            const targetRole = val === 'Moderator' ? (acc.role === 'SystemAdministrator' ? 'SystemAdministrator' : 'TrainingDepartment') : val;
                            handleRoleChange(acc.id, targetRole);
                          }}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                        >
                          <option value="Student">Sinh viên</option>
                          <option value="Lecturer">Giảng viên</option>
                          <option value="Moderator">Moderator</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`badge`} style={acc.isActive ? { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' } : { background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                            {acc.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                            {acc.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                          {isLocked && (
                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }} title={`Bị khóa đến ${acc.lockedUntil}`}>
                              <Lock size={12} /> Khóa tạm
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn ${acc.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(acc.id, acc.isActive)}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          {acc.isActive ? (
                            <>
                              <UserX size={14} /> Khóa tài khoản
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} /> Kích hoạt / Mở khóa
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A' }}>Tạo Hồ sơ Tài khoản Mới</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Vai trò chính</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                >
                  <option value="Student">Sinh viên (Thành viên Nhóm Đồ án)</option>
                  <option value="Lecturer">Giảng viên (Chấm checkpoint, Hướng dẫn)</option>
                  <option value="TrainingDepartment">Moderator (Điều phối viên / Quản trị hệ thống)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mã số cá nhân (Mã GV / MSSV)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.identityCode}
                    onChange={(e) => setFormData({ ...formData, identityCode: e.target.value })}
                    required
                    placeholder="ví dụ: SE194673 hoặc GV00123"
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Họ và tên đầy đủ</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    placeholder="ví dụ: Dương Thanh Duy"
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Địa chỉ Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="user@fpt.edu.vn"
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mật khẩu khởi tạo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              {(formData.role === 'Lecturer' || formData.role === 'TrainingDepartment' || formData.role === 'SystemAdministrator' || formData.role === 'Moderator') && (
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Khoa / Phòng ban</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="ví dụ: Khoa Kỹ thuật Phần mềm"
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  />
                </div>
              )}

              {formData.role === 'Student' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Lớp học</label>
                    <input type="text" className="form-input" value={formData.classCode} onChange={(e) => setFormData({ ...formData, classCode: e.target.value })} placeholder="SE1801" style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Khóa</label>
                    <input type="text" className="form-input" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} placeholder="2026" style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Chuyên ngành</label>
                    <input type="text" className="form-input" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} placeholder="SWD" style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo Tài khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
