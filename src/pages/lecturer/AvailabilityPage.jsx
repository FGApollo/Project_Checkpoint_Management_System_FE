import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Clock, Calendar, CheckCircle2, AlertCircle, RefreshCw, Send, Save, Check, ShieldAlert } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Thứ 2' },
  { id: 2, name: 'Thứ 3' },
  { id: 3, name: 'Thứ 4' },
  { id: 4, name: 'Thứ 5' },
  { id: 5, name: 'Thứ 6' },
  { id: 6, name: 'Thứ 7' },
  { id: 7, name: 'Chủ nhật' },
];

const SLOTS = [
  { id: 1, time: '07:30 - 09:00' },
  { id: 2, time: '09:15 - 10:45' },
  { id: 3, time: '11:00 - 12:30' },
  { id: 4, time: '13:00 - 14:30' },
  { id: 5, time: '14:45 - 16:15' },
  { id: 6, time: '16:30 - 18:00' },
  { id: 7, time: '18:15 - 19:45' },
  { id: 8, time: '20:00 - 21:30' },
];

const AvailabilityPage = () => {
  const [semesterId, setSemesterId] = useState(1);
  const [weekStart, setWeekStart] = useState('2026-06-15');
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of { dayOfWeek, slot }
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAvailability = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.get(`/review-availability/week?semesterId=${semesterId}&weekStart=${weekStart}`);
      const data = response.data || {};
      setSelectedSlots(Array.isArray(data.slots) ? data.slots : []);
      setIsSubmitted(Boolean(data.isSubmitted || data.status === 'Submitted'));
    } catch (err) {
      // If not found (new week), reset cleanly
      setSelectedSlots([]);
      setIsSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [semesterId, weekStart]);

  const toggleSlot = (dayId, slotId) => {
    if (isSubmitted) return;
    setError('');
    setSuccess('');
    const exists = selectedSlots.some((s) => s.dayOfWeek === dayId && s.slot === slotId);
    if (exists) {
      setSelectedSlots(selectedSlots.filter((s) => !(s.dayOfWeek === dayId && s.slot === slotId)));
    } else {
      setSelectedSlots([...selectedSlots, { dayOfWeek: dayId, slot: slotId }]);
    }
  };

  const isSlotSelected = (dayId, slotId) => {
    return selectedSlots.some((s) => s.dayOfWeek === dayId && s.slot === slotId);
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/review-availability/week?semesterId=${semesterId}&weekStart=${weekStart}`, {
        slots: selectedSlots
      });
      setSuccess('Lưu bản nháp lịch rảnh thành công! Bạn có thể chỉnh sửa và hoàn thiện trước khi nộp chính thức.');
      setIsSubmitted(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lưu nháp lịch rảnh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Ensure saved first
      await api.put(`/review-availability/week?semesterId=${semesterId}&weekStart=${weekStart}`, {
        slots: selectedSlots
      });
      await api.post(`/review-availability/week/submit?semesterId=${semesterId}&weekStart=${weekStart}`);
      setSuccess('Đã nộp lịch rảnh chính thức cho Phòng Đào tạo! Lịch tuần này hiện đã khóa chỉnh sửa để phục vụ xếp lịch.');
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi gửi lịch chính thức cho Phòng Đào tạo.');
    } finally {
      setLoading(false);
    }
  };

  const selectAllDay = (dayId) => {
    if (isSubmitted) return;
    const allSelected = SLOTS.every((slot) => isSlotSelected(dayId, slot.id));
    if (allSelected) {
      setSelectedSlots(selectedSlots.filter((s) => s.dayOfWeek !== dayId));
    } else {
      const newForDay = SLOTS.map((slot) => ({ dayOfWeek: dayId, slot: slot.id }));
      const remaining = selectedSlots.filter((s) => s.dayOfWeek !== dayId);
      setSelectedSlots([...remaining, ...newForDay]);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Đăng ký Lịch Rảnh Phản biện hàng tuần</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Đánh dấu các ngày (Thứ 2 đến Chủ nhật) và các ca học trong tuần bạn có thể tham gia hội đồng phản biện.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={fetchAvailability} disabled={loading} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <RefreshCw size={16} color="#F26522" />
            <span style={{ fontWeight: 600 }}>Tải lại Lịch</span>
          </button>
          <button className="btn btn-secondary" onClick={handleSaveDraft} disabled={loading || isSubmitted} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <Save size={16} color="#0EA5E9" />
            <span style={{ fontWeight: 600 }}>Lưu Bản nháp</span>
          </button>
          <button className="btn btn-primary" onClick={handleSubmitFinal} disabled={loading || isSubmitted || selectedSlots.length === 0}>
            <Send size={16} />
            <span>Chính thức Nộp cho Đào tạo</span>
          </button>
        </div>
      </div>

      {/* Week Selector Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="#F26522" />
            <label className="form-label" style={{ margin: 0, color: '#334155', fontWeight: 600 }}>ID Học kỳ:</label>
            <input
              type="number"
              className="form-input"
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              style={{ width: '80px', padding: '0.35rem 0.6rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#10B981" />
            <label className="form-label" style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Tuần bắt đầu (Thứ 2):</label>
            <input
              type="date"
              className="form-input"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Trạng thái:</span>
          {isSubmitted ? (
            <span className="badge" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }}>
              <CheckCircle2 size={14} /> Đã nộp & Khóa lịch bởi Phòng Đào tạo
            </span>
          ) : (
            <span className="badge" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontWeight: 700 }}>
              Chế độ Nháp ({selectedSlots.length} ca đã chọn)
            </span>
          )}
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
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Grid Table */}
      <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div className="table-container">
          <table className="table" style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '130px', color: '#0F172A' }}>Ca học / Thời gian</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day.id} style={{ textAlign: 'center', minWidth: '120px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>{day.name}</span>
                      {!isSubmitted && (
                        <button
                          type="button"
                          onClick={() => selectAllDay(day.id)}
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #CBD5E1',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.15rem 0.4rem',
                            fontSize: '0.65rem',
                            color: '#475569',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Chọn/Bỏ cả ngày
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => (
                <tr key={slot.id}>
                  <td style={{ textAlign: 'left', fontWeight: 700, background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', color: '#F26522', fontWeight: 800 }}>Ca {slot.id}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{slot.time}</span>
                    </div>
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const selected = isSlotSelected(day.id, slot.id);
                    return (
                      <td
                        key={`${day.id}-${slot.id}`}
                        onClick={() => toggleSlot(day.id, slot.id)}
                        style={{
                          padding: '1rem',
                          background: selected ? 'linear-gradient(135deg, #F26522, #FF7A00)' : 'transparent',
                          cursor: isSubmitted ? 'not-allowed' : 'pointer',
                          transition: 'all var(--transition-fast)',
                          border: `1px solid ${selected ? '#F26522' : '#E2E8F0'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '36px' }}>
                          {selected ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>
                              <Check size={18} />
                              <span>Có thể chấm</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#F8FAFC', border: '1px solid #CBD5E1' }}>
        <ShieldAlert size={24} color="#F26522" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
          <strong>Lưu ý xếp lịch:</strong> Theo quy chế của Trường, Phòng Đào tạo chỉ có thể xem và xếp lịch cho bạn sau khi bạn bấm **Chính thức Nộp cho Đào tạo (`POST /week/submit`)**. Sau khi nộp, lịch của tuần đó sẽ được khóa để đảm bảo tính ổn định cho sinh viên.
        </p>
      </div>
    </div>
  );
};

export default AvailabilityPage;
