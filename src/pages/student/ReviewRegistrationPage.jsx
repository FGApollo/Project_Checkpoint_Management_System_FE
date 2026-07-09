import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, Send, BookOpen, Layers, ArrowRight } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Thứ 2' },
  { id: 2, name: 'Thứ 3' },
  { id: 3, name: 'Thứ 4' },
  { id: 4, name: 'Thứ 5' },
  { id: 5, name: 'Thứ 6' },
  { id: 6, name: 'Thứ 7' },
];

const SLOTS = [
  { id: 1, name: 'Ca 1 (Sáng)' },
  { id: 2, name: 'Ca 2 (Sáng)' },
  { id: 3, name: 'Ca 3 (Trưa)' },
  { id: 4, name: 'Ca 4 (Chiều)' },
  { id: 5, name: 'Ca 5 (Tối)' },
];

const ReviewRegistrationPage = () => {
  const [semesterId, setSemesterId] = useState(1);
  const [groupId, setGroupId] = useState(1);
  const [reviewType, setReviewType] = useState('Review1');
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of { dayOfWeek, slot }

  const [registrations, setRegistrations] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roundStatus, setRoundStatus] = useState('Đang mở đăng ký'); // 'Đang mở đăng ký' | 'Đã kết thúc đăng ký'

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const regRes = await api.get(`/review-scheduling/student-registrations?semesterId=${semesterId}&reviewType=${reviewType}`).catch(() => ({ data: [] }));
      const list = Array.isArray(regRes.data) ? regRes.data : [];
      setRegistrations(list);
      // Populate checked slots from existing registrations if this group
      const myRegs = list.filter((r) => Number(r.groupId) === Number(groupId));
      setSelectedSlots(myRegs.map((r) => ({ dayOfWeek: r.dayOfWeek, slot: r.slot })));

      const schedRes = await api.get('/review-schedules/my').catch(() => ({ data: [] }));
      setMySchedules(Array.isArray(schedRes.data) ? schedRes.data : []);
    } catch (err) {
      setError('Failed to fetch registration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [semesterId, reviewType, groupId]);

  const toggleSlot = (dayId, slotId) => {
    if (roundStatus !== 'Đang mở đăng ký') return;
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

  const handleRegisterSlots = async (e) => {
    e.preventDefault();
    if (roundStatus !== 'Đang mở đăng ký') {
      setError('Đợt phản biện này hiện đã kết thúc/đóng đăng ký. Bạn không thể chỉnh sửa.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (selectedSlots.length === 0) {
        setError('Vui lòng tích chọn ít nhất 1 ô slot khung giờ rảnh trước khi lưu!');
        setLoading(false);
        return;
      }
      // Save all checked available slots
      for (const item of selectedSlots) {
        await api.post('/review-scheduling/student-registrations', {
          semesterId: Number(semesterId),
          groupId: Number(groupId),
          reviewType,
          dayOfWeek: Number(item.dayOfWeek),
          slot: Number(item.slot)
        }).catch(() => {});
      }
      setSuccess(`Trưởng nhóm #${groupId} đã lưu thành công ${selectedSlots.length} ô slot rảnh cho đợt ${reviewType}!`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lưu danh sách nguyện vọng đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Đăng ký Nguyện vọng Lịch Phản biện (Trưởng nhóm)</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Chọn N ô khung giờ rảnh trong bảng 30 ô (`Thứ 2 đến Thứ 7 x 5 ca/ngày`) để đánh dấu tick là bạn available, sau đó bấm Save.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFFFFF', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>Trạng thái Đợt:</span>
            <span className="badge" style={{
              background: roundStatus === 'Đang mở đăng ký' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: roundStatus === 'Đang mở đăng ký' ? '#10B981' : '#EF4444',
              fontWeight: 700
            }}>
              {roundStatus}
            </span>
          </div>

          <button className="btn btn-secondary" onClick={fetchData} disabled={loading} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <RefreshCw size={16} color="#F26522" />
            <span style={{ fontWeight: 600 }}>Tải lại Dữ liệu</span>
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
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter and Group Info */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0, color: '#334155', fontWeight: 600 }}>ID Học kỳ:</label>
            <input type="number" className="form-input" value={semesterId} onChange={(e) => setSemesterId(e.target.value)} style={{ width: '80px', padding: '0.35rem 0.6rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} required />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0, color: '#334155', fontWeight: 600 }}>ID Nhóm:</label>
            <input type="number" className="form-input" value={groupId} onChange={(e) => setGroupId(e.target.value)} style={{ width: '80px', padding: '0.35rem 0.6rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} required />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0, color: '#334155', fontWeight: 600 }}>Đợt Phản biện:</label>
            <select className="form-select" value={reviewType} onChange={(e) => setReviewType(e.target.value)} style={{ padding: '0.35rem 0.6rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}>
              <option value="Review1">Review 1 (Báo cáo Đề cương)</option>
              <option value="Review2">Review 2 (Đánh giá Giữa kỳ)</option>
              <option value="Review3">Review 3 (Bảo vệ thử/Pre-Defense)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedSlots([])} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: '0.8rem', fontWeight: 600 }}>
            Xóa chọn tất cả
          </button>
          <button type="button" className="btn btn-primary" onClick={handleRegisterSlots} disabled={loading || roundStatus !== 'Đang mở đăng ký'} style={{ fontWeight: 700 }}>
            <Send size={16} />
            <span>Save ({selectedSlots.length} ô available)</span>
          </button>
        </div>
      </div>

      {/* 30-Slot Interactive Checklist Grid */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="#F26522" />
              <span>Bảng Tick chọn Khung giờ rảnh (6 Ngày x 5 Ca = 30 ô slot)</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.25rem 0 0' }}>
              Đại diện nhóm tích (`check đi, check đi`) vào tất cả những ô khung giờ mà nhóm rảnh và sẵn sàng tham gia phản biện, sau đó bấm <strong>Save</strong>.
            </p>
          </div>
          <span className="badge" style={{ background: 'rgba(242, 101, 34, 0.15)', color: '#F26522', fontWeight: 700, fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            Đang chọn: {selectedSlots.length} / 30 ô slot
          </span>
        </div>

        <div className="table-container">
          <table className="table" style={{ textAlign: 'center' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '130px' }}>Ca / Khung giờ</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day.id} style={{ minWidth: '110px' }}>{day.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((s) => (
                <tr key={s.id}>
                  <td style={{ textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>
                    {s.name}
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const checked = isSlotSelected(day.id, s.id);
                    return (
                      <td
                        key={`${day.id}-${s.id}`}
                        onClick={() => toggleSlot(day.id, s.id)}
                        style={{
                          cursor: roundStatus === 'Đang mở đăng ký' ? 'pointer' : 'not-allowed',
                          background: checked ? 'rgba(242, 101, 34, 0.15)' : 'transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justify: 'center', gap: '0.4rem' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            disabled={roundStatus !== 'Đang mở đăng ký'}
                            style={{ width: '18px', height: '18px', accentColor: '#F26522', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: checked ? 700 : 500, color: checked ? '#F26522' : '#64748B' }}>
                            {checked ? 'Available' : 'Trống'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button type="button" className="btn btn-primary" onClick={handleRegisterSlots} disabled={loading || roundStatus !== 'Đang mở đăng ký'} style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', fontWeight: 700 }}>
            <Send size={18} />
            <span>Lưu Nguyện vọng Đăng ký</span>
          </button>
        </div>
      </div>

      {/* Current Registrations & Official Schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Current Registrations Table */}
        <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>Danh sách Nguyện vọng đã nộp ({reviewType})</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Đăng ký</th>
                  <th>Mã Nhóm</th>
                  <th>Ngày đăng ký</th>
                  <th>Ca đăng ký</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Chưa có nguyện vọng đăng ký nào cho {reviewType}. Hãy điền form bên trái để gửi yêu cầu!</td></tr>
                ) : (
                  registrations.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>#{r.id}</td>
                      <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 700 }}>{r.groupCode || `Nhóm #${r.groupId}`}</span></td>
                      <td style={{ color: '#475569' }}>Thứ {r.dayOfWeek + 1 > 7 ? 'CN' : r.dayOfWeek + 1} ({r.dayOfWeek})</td>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>Ca {r.slot}</td>
                      <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 700 }}>Đang chờ xếp lịch</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Official Schedule Section */}
      <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
          <Layers size={20} color="#F26522" />
          <span>Lịch Phản biện Chính thức của Nhóm</span>
        </h3>

        {mySchedules.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', lineHeight: 1.5 }}>
            Nhóm chưa có lịch phản biện chính thức nào được công bố. Khi Phòng Đào tạo chốt lịch và thông báo, địa điểm và thời gian cụ thể sẽ hiển thị tại đây.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Phiên</th>
                  <th>Mã Nhóm</th>
                  <th>Ngày phản biện</th>
                  <th>Ca học & Thời gian</th>
                  <th>Phòng</th>
                  <th>Vòng Phản biện</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {mySchedules.map((sc, idx) => (
                  <tr key={sc.id || idx}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>#{sc.id}</td>
                    <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 700 }}>{sc.groupCode || `Nhóm #${sc.groupId}`}</span></td>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{sc.sessionDate}</td>
                    <td style={{ color: '#475569' }}>Ca {sc.slot}</td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>{sc.room}</span></td>
                    <td style={{ color: '#475569' }}>{sc.reviewType}</td>
                    <td><span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9', fontWeight: 700 }}>{sc.status || 'Đã công bố'}</span></td>
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

export default ReviewRegistrationPage;
