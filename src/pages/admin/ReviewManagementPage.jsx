import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Layers, UserPlus, Zap, CheckCircle2, AlertCircle, RefreshCw, Plus, Clock, Users, Calendar, ArrowRight, Play, CheckSquare } from 'lucide-react';

const ReviewManagementPage = () => {
  const [activeStep, setActiveStep] = useState(1); // 1: Rounds, 2: Lecturers, 3: Match, 4: Publish

  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1 Form
  const [formData, setFormData] = useState({
    semesterId: 1,
    name: '',
    reviewType: 'Review1',
    startDate: '',
    endDate: ''
  });

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const response = await api.get('/defense-management/rounds'); // Reusing existing round endpoint
      setRounds(Array.isArray(response.data) ? response.data : (response.data?.items || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRounds();
  }, []);

  const handleStartDateChange = (e) => {
    const startVal = e.target.value;
    let endVal = formData.endDate;
    if (startVal) {
      const d = new Date(startVal);
      d.setDate(d.getDate() + 6);
      endVal = d.toISOString().split('T')[0];
    }
    setFormData({ ...formData, startDate: startVal, endDate: endVal });
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.startDate || !formData.endDate) {
      setError('Vui lòng chọn Từ ngày và Đến ngày.');
      return;
    }
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      setError('Đến ngày không được nhỏ hơn Từ ngày.');
      return;
    }
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays !== 6) {
      setError(`Ràng buộc: 1 đợt review có độ dài đúng 6 ngày (Khoảng thời gian từ ${formData.startDate} đến ${formData.endDate} hiện là ${diffDays} ngày, không hợp lệ).`);
      return;
    }

    try {
      await api.post('/defense-management/rounds', {
        semesterId: Number(formData.semesterId),
        code: `REV_${formData.semesterId}_${formData.reviewType}_${Date.now()}`,
        name: formData.name,
        description: formData.reviewType,
        startDate: formData.startDate,
        endDate: formData.endDate
      });
      setSuccess('Đã tạo đợt review thành công.');
      fetchRounds();
      setActiveStep(2); // Move to next step
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tạo đợt review');
    }
  };

  const handleMatch = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/review-scheduling/random-assign', {
        semesterId: Number(formData.semesterId),
        reviewType: formData.reviewType,
        weekStart: formData.startDate || '2026-07-06'
      });
      setSuccess('Đã chạy thuật toán xếp lịch và lưu phân công vào Database thành công!');
      setActiveStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi chạy thuật toán phân công. Hãy kiểm tra danh sách giảng viên đăng ký slot rảnh và nguyện vọng nhóm.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/review-schedules/publish', {
        semesterId: Number(formData.semesterId),
        reviewType: formData.reviewType,
        weekStart: formData.startDate || '2026-07-06',
        subject: `[CPMS] Thông báo Lịch Phản biện Đồ án (${formData.reviewType})`,
        messageBody: `Kính gửi Quý Giảng viên và Sinh viên,\n\nLịch phản biện đồ án cho đợt ${formData.name} đã được công bố chính thức trên hệ thống CPMS. Vui lòng đăng nhập để xem chi tiết ca review và phòng ban.\n\nTrân trọng,\nPhòng Đào tạo.`
      });
      setSuccess(`Đã công bố lịch thành công! Đã chốt ${res.data?.publishedSessionCount || 'danh sách'} ca review vào Database và thông báo cho Giảng viên & Sinh viên.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi publish lịch review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Quản lý Đợt & Xếp lịch Review</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Thiết lập đợt review, quản lý đăng ký của giảng viên, chạy thuật toán và công bố lịch.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} /><span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} /><span>{success}</span>
        </div>
      )}

      {/* Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: '#E2E8F0', zIndex: 0 }}></div>
        {[
          { step: 1, icon: Layers, label: 'Tạo đợt' },
          { step: 2, icon: UserPlus, label: 'Đăng ký' },
          { step: 3, icon: Zap, label: 'Phân công' },
          { step: 4, icon: CheckSquare, label: 'Publish' }
        ].map(s => {
          const isActive = activeStep >= s.step;
          return (
            <div key={s.step} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveStep(s.step)}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: isActive ? '#4F46E5' : '#F1F5F9', border: `2px solid ${isActive ? '#4F46E5' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'white' : '#64748B', transition: 'all 0.2s' }}>
                <s.icon size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#0F172A' : '#64748B' }}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="glass-card" style={{ padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', minHeight: '400px' }}>
        
        {/* STEP 1: Create Round */}
        {activeStep === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0F172A' }}>Bước 1: Thiết lập Đợt Review</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <form onSubmit={handleCreateRound}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Tên đợt (vd: Review 1 - SE)</label>
                    <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Loại Review</label>
                    <select className="form-select" value={formData.reviewType} onChange={e => setFormData({...formData, reviewType: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}>
                      <option value="Review1">Review 1</option>
                      <option value="Review2">Review 2</option>
                      <option value="Review3">Review 3</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Từ ngày</label>
                      <input required type="date" className="form-input" value={formData.startDate} onChange={handleStartDateChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Đến ngày</label>
                      <input required type="date" className="form-input" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} color="#F26522" />
                    <span>* Khi chọn Từ ngày, Đến ngày sẽ tự động cộng 6 ngày. Ràng buộc 1 đợt có tối thiểu và tối đa 6 ngày.</span>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Tạo Đợt Review & Tiếp tục <ArrowRight size={16}/></button>
                </form>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#475569' }}>Các đợt đã tạo</h3>
                {rounds.length === 0 ? <p style={{ color: '#94A3B8' }}>Chưa có đợt nào</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {rounds.slice(0, 4).map(r => (
                      <div key={r.id} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', margin: 0 }}>{r.name}</p>
                          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0 }}>{r.startDate && new Date(r.startDate).toLocaleDateString()} - {r.endDate && new Date(r.endDate).toLocaleDateString()}</p>
                        </div>
                        <span className="badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{r.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Lecturers & Students */}
        {activeStep === 2 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0F172A' }}>Bước 2: Mở đăng ký cho Giảng viên & Sinh viên</h2>
            <p style={{ color: '#475569', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>Hệ thống đang mở đăng ký. Giảng viên và sinh viên có thể đăng nhập để chọn các ô slot rảnh trong bảng 30 ô.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
              <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', width: '200px' }}>
                <Users size={32} color="#4F46E5" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>24</p>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Giảng viên đã đăng ký</p>
              </div>
              <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', width: '200px' }}>
                <Users size={32} color="#F26522" style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>42</p>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Nhóm đã đăng ký</p>
              </div>
            </div>
            
            <button className="btn btn-danger" onClick={() => setActiveStep(3)} style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
              Khóa Đăng ký & Chuyển sang Phân công <ArrowRight size={18}/>
            </button>
          </div>
        )}

        {/* STEP 3: Matching */}
        {activeStep === 3 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0F172A' }}>Bước 3: Thuật toán Phân công Lịch Review</h2>
            <p style={{ color: '#475569', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>Thuật toán sẽ tự động khớp lịch rảnh của giảng viên và nhóm sinh viên để tạo bảng lịch trình tối ưu (tối đa 3 nhóm/slot).</p>
            
            <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', padding: '3rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              <Zap size={48} color="#D97706" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#0F172A', marginBottom: '1rem' }}>Sẵn sàng chạy thuật toán</h3>
              <button className="btn btn-primary" onClick={handleMatch} style={{ padding: '0.75rem 2rem', fontSize: '1rem', background: '#4F46E5' }}>
                <Play size={18} fill="white" /> Chạy Auto-Match
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Publish */}
        {activeStep === 4 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0F172A' }}>Bước 4: Publish Lịch & Công bố</h2>
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
              <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#065F46', marginBottom: '0.5rem' }}>Phân công hoàn tất</h3>
              <p style={{ color: '#047857', margin: 0, fontSize: '0.9rem' }}>Đã phân 42 nhóm vào 18 slot với 24 giảng viên chấm.</p>
            </div>
            
            <button className="btn btn-success" onClick={handlePublish} style={{ padding: '0.75rem 2rem', fontSize: '1rem', background: '#10B981', color: 'white' }}>
              <CheckSquare size={18} /> Công bố Lịch Chính thức
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default ReviewManagementPage;
