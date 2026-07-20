import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, CheckCircle, AlertCircle, RefreshCw, CalendarDays, Lock, Unlock, Trash2 } from 'lucide-react';

const SemesterManagementPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    season: 'SP',
    academicYear: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    isActive: true
  });

  const fetchSemesters = async (pageNumber = page, size = pageSize) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/semesters?page=${pageNumber}&pageSize=${size}`);
      setSemesters(Array.isArray(response.data) ? response.data : (response.data.items || []));
      if (response.data?.totalPages !== undefined) {
        setTotalPages(response.data.totalPages || 1);
      }
      if (response.data?.totalCount !== undefined) {
        setTotalCount(response.data.totalCount || 0);
      }
    } catch {
      setError('Failed to fetch semesters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters(page, pageSize);
  }, [page, pageSize]);

  const handleToggleStatus = async (semester) => {
    try {
      await api.patch(`/semesters/${semester.id}/status`);
      setSuccess(`Trạng thái của kỳ học ${semester.name} đã được cập nhật!`);
      fetchSemesters();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update semester status.');
    }
  };

  const handleDelete = async (semester) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kỳ học ${semester.name}? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/semesters/${semester.id}`);
      setSuccess(`Kỳ học ${semester.name} đã bị xóa thành công!`);
      fetchSemesters();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi xóa kỳ học.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const seasonMap = { 'SP': 'Spring', 'SU': 'Summer', 'FA': 'Fall' };
    const yearSuffix = formData.academicYear.toString().slice(-2);
    const code = `${formData.season}${yearSuffix}`;
    const name = `${seasonMap[formData.season]} ${formData.academicYear}`;
    
    const payload = {
      code,
      name,
      academicYear: formData.academicYear.toString(), // Fix: Backend expects a string
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: formData.isActive
    };

    try {
      await api.post('/semesters', payload);
      setSuccess(`Kỳ học ${name} đã được tạo thành công!`);
      setShowCreateModal(false);
      setFormData({
        season: 'SP',
        academicYear: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        isActive: true
      });
      fetchSemesters();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create semester.');
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Quản lý Kỳ học</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Tạo mới, xem danh sách và quản lý các kỳ học trong hệ thống.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => fetchSemesters(page, pageSize)} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <RefreshCw size={16} />
            <span>Làm mới</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
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

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã kỳ (Code)</th>
                <th>Tên kỳ học</th>
                <th>Năm học</th>
                <th>Thời gian (Từ - Đến)</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Đang tải danh sách kỳ học...</td></tr>
              )}
              {!loading && semesters.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Chưa có kỳ học nào.</td></tr>
              )}
              {!loading && semesters.length > 0 && (
                semesters.map((sem) => (
                  <tr key={sem.id}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>#{sem.id}</td>
                    <td><span style={{ fontWeight: 700, color: '#0F172A' }}>{sem.code}</span></td>
                    <td style={{ color: '#475569', fontWeight: 500 }}>{sem.name}</td>
                    <td>{sem.academicYear}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <CalendarDays size={14} color="#64748B" />
                        <span>{new Date(sem.startDate).toLocaleDateString('vi-VN')} - {new Date(sem.endDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={sem.isActive ? { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' } : { background: 'rgba(100, 116, 139, 0.15)', color: '#64748B' }}>
                        {sem.isActive ? 'Đang hoạt động (Active)' : 'Đã đóng'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className={`btn ${sem.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleToggleStatus(sem)}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          {sem.isActive ? (
                            <>
                              <Lock size={14} /> Đóng kỳ học
                            </>
                          ) : (
                            <>
                              <Unlock size={14} /> Mở khóa
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleDelete(sem)}
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, background: '#FEE2E2', color: '#EF4444', border: '1px solid #FCA5A5' }}
                          title="Xóa kỳ học"
                        >
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {semesters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 600 }}>
                Trang <strong style={{ color: '#0F172A' }}>{page}</strong> / <strong style={{ color: '#0F172A' }}>{totalPages}</strong> ({totalCount || semesters.length} kỳ học)
              </span>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}
                >
                  Trang trước
                </button>

                {getPageNumbers().map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      border: p === page ? 'none' : '1px solid #CBD5E1',
                      background: p === page ? '#3B82F6' : '#FFFFFF',
                      color: p === page ? '#FFFFFF' : '#0F172A',
                      cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}
                >
                  Trang sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A' }}>Tạo Kỳ học Mới</h3>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="season-select" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Kỳ học (Mùa)</label>
                  <select
                    id="season-select"
                    className="form-select"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  >
                    <option value="SP">Mùa Xuân (Spring)</option>
                    <option value="SU">Mùa Hè (Summer)</option>
                    <option value="FA">Mùa Thu (Fall)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="academic-year-input" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Năm học</label>
                  <input
                    id="academic-year-input"
                    type="number"
                    className="form-input"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: Number(e.target.value) })}
                    required
                    placeholder="2026"
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ background: '#F1F5F9', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px dashed #CBD5E1' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Xem trước thông tin sẽ tạo:</p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Mã kỳ học:</span>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>{formData.season}{formData.academicYear.toString().slice(-2)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Tên kỳ học:</span>
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>
                      {(() => { const seasonNames = { SP: 'Spring', SU: 'Summer', FA: 'Fall' }; return seasonNames[formData.season] || 'Fall'; })()} {formData.academicYear}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="start-date-input" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày bắt đầu</label>
                  <input
                    id="start-date-input"
                    type="date"
                    className="form-input"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end-date-input" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày kết thúc</label>
                  <input
                    id="end-date-input"
                    type="date"
                    className="form-input"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
                  Kích hoạt (Hiện đang diễn ra)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo Kỳ học</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterManagementPage;
