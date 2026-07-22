import React, { useCallback, useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/authContextValue.js';
import { Calendar, CheckCircle2, AlertCircle, RefreshCw, Send, BookOpen, Layers, ArrowRight, ArrowLeft, Sparkles, ShieldCheck, Users } from 'lucide-react';
import { PageSkeleton } from '../../components/common/Skeleton';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Thứ 2' },
  { id: 2, name: 'Thứ 3' },
  { id: 3, name: 'Thứ 4' },
  { id: 4, name: 'Thứ 5' },
  { id: 5, name: 'Thứ 6' },
  { id: 6, name: 'Thứ 7' },
];

const SLOTS = [
  { id: 1, name: 'Slot 1', time: '07:30 – 09:00' },
  { id: 2, name: 'Slot 2', time: '09:10 – 10:40' },
  { id: 3, name: 'Slot 3', time: '10:50 – 12:20' },
  { id: 4, name: 'Slot 4', time: '12:50 – 14:20' },
  { id: 5, name: 'Slot 5', time: '14:30 – 16:00' },
];

const formatReviewType = (type) => {
  if (type === 'Review1' || type === 0) return 'Review 1';
  if (type === 'Review2' || type === 1) return 'Review 2';
  if (type === 'Review3' || type === 2) return 'Review 3';
  if (typeof type === 'string' && type.startsWith('Review')) return type.replace('Review', 'Review ');
  return type || 'Review Checkpoint';
};

const getAvailabilityList = (data) => {
  if (Array.isArray(data.myAvailability)) return data.myAvailability;
  if (Array.isArray(data.registrations)) return data.registrations;
  return [];
};

const loadReviewRounds = async (semesterId) => {
  const response = await api.get(`/student-review/rounds?semesterId=${semesterId}`);
  return Array.isArray(response.data) ? response.data : [];
};

const loadSlotData = async (roundId) => {
  const response = await api.get(`/student-review/slots?roundId=${roundId}`);
  const data = response.data || {};
  return { data, registrations: getAvailabilityList(data) };
};

const loadStudentSchedule = async () => {
  const response = await api.get('/student-review/schedule');
  return Array.isArray(response.data) ? response.data : [];
};

const getRegistrationStatusColors = (status) => {
  if (status === 'Đang mở đăng ký') return { background: '#DCFCE7', color: '#16A34A' };
  return { background: '#FEE2E2', color: '#DC2626' };
};

const isRoundRegistrationOpen = (status) =>
  status === 'Draft' || status === 0 ||
  status === 'Open' || status === 1 ||
  status === 'Đang mở';

const RegistrationSlotGrid = ({ isSlotSelected, toggleSlot, roundStatus }) => (
  <div className="table-container">
    <table className="table" style={{ textAlign: 'center', width: '100%' }}>
      <thead>
        <tr style={{ background: '#F8FAFC' }}>
          <th style={{ textAlign: 'left', minWidth: '135px', padding: '1rem', fontWeight: 800, color: '#334155' }}>Ca / Khung giờ</th>
          {DAYS_OF_WEEK.map((day) => (
            <th key={day.id} style={{ minWidth: '115px', padding: '1rem', fontWeight: 800, color: '#334155' }}>{day.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SLOTS.map((slot) => (
          <tr key={slot.id}>
            <td style={{ textAlign: 'left', padding: '1rem' }}>
              <div style={{ fontWeight: 850, color: '#0F172A', fontSize: '0.95rem' }}>{slot.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, marginTop: '0.15rem' }}>{slot.time}</div>
            </td>
            {DAYS_OF_WEEK.map((day) => {
              const checked = isSlotSelected(day.id, slot.id);
              return (
                <td key={`${day.id}-${slot.id}`} style={{ background: checked ? 'rgba(242, 101, 34, 0.14)' : 'transparent', transition: 'all 0.15s ease', padding: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: roundStatus === 'Đang mở đăng ký' ? 'pointer' : 'not-allowed' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSlot(day.id, slot.id)}
                      disabled={roundStatus !== 'Đang mở đăng ký'}
                      style={{ width: '19px', height: '19px', accentColor: '#F26522', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: checked ? 800 : 600, color: checked ? '#F26522' : '#64748B' }}>
                      {checked ? 'Available' : 'Trống'}
                    </span>
                  </label>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ReviewRegistrationPage = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Chọn Đợt Review Hub, 2: Bảng chọn Slot 30 ô
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState(1);
  const [groupId, setGroupId] = useState(user?.groupId || user?.group?.id || null);
  const [groupCode, setGroupCode] = useState(user?.groupCode || user?.group?.code || null);
  const [isLeader, setIsLeader] = useState(user?.isLeader ?? true);

  useEffect(() => {
    if (user) {
      if (user.groupId || user?.group?.id) setGroupId(user.groupId || user?.group?.id);
      if (user.groupCode || user?.group?.code) setGroupCode(user.groupCode || user?.group?.code);
      if (user.isLeader !== undefined) setIsLeader(user.isLeader);
    }
  }, [user]);
  const [reviewType, setReviewType] = useState('Review 1');
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of { dayOfWeek, slot }

  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');

  const [registrations, setRegistrations] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roundStatus, setRoundStatus] = useState('Đang mở đăng ký'); // 'Đang mở đăng ký' | 'Đã kết thúc đăng ký'

  const updateRoundStatus = useCallback((roundObj) => {
    if (!roundObj) return;
    setRoundStatus(isRoundRegistrationOpen(roundObj.status)
      ? 'Đang mở đăng ký'
      : 'Đã kết thúc đăng ký');
  }, []);

  const handleSelectRoundStep2 = (roundObj) => {
    setSelectedRoundId(roundObj.id);
    setSemesterId(roundObj.semesterId || semesterId);
    setReviewType(formatReviewType(roundObj.type));
    updateRoundStatus(roundObj);
    if (roundObj.isLeader !== undefined) setIsLeader(roundObj.isLeader);
    if (roundObj.groupId) setGroupId(roundObj.groupId);
    if (roundObj.groupCode) setGroupCode(roundObj.groupCode);
    setStep(2);
  };

  const fetchRounds = useCallback(async (semId) => {
    const targetSem = semId !== undefined ? semId : semesterId;
    setLoading(true);
    try {
      const list = await loadReviewRounds(targetSem);
      setRounds(list);
      const first = list[0];
      if (!first) {
        setSelectedRoundId('');
        return;
      }
      if (first.isLeader !== undefined) setIsLeader(first.isLeader);
      if (first.groupId) setGroupId(first.groupId);
      if (first.groupCode) setGroupCode(first.groupCode);
      const selectedRoundExists = selectedRoundId && list.some((round) => round.id === selectedRoundId);
      if (!selectedRoundExists) {
        setSelectedRoundId(first.id);
        setReviewType(formatReviewType(first.type));
        updateRoundStatus(first);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [semesterId, selectedRoundId, updateRoundStatus]);

  const handleSemesterChange = (newSemId) => {
    const numId = Number(newSemId);
    setSemesterId(numId);
    setSelectedRoundId('');
    fetchRounds(numId);
  };

  const fetchData = useCallback(async () => {
    if (!selectedRoundId) return;
    setLoading(true);
    setError('');
    try {
      const { data: gridData, registrations: list } = await loadSlotData(selectedRoundId);
      if (gridData.isLeader !== undefined) setIsLeader(gridData.isLeader);
      if (gridData.groupId) setGroupId(gridData.groupId);
      if (gridData.groupCode) setGroupCode(gridData.groupCode);
      const myRegistration = gridData.myRegistration;
      const myRegFound = Boolean(myRegistration) || list.length > 0;
      if (myRegistration) {
        setSelectedSlots([{ dayOfWeek: myRegistration.dayOfWeek, slot: myRegistration.slot }]);
      } else if (list.length > 0) {
        setSelectedSlots(list.map((registration) => ({ dayOfWeek: registration.dayOfWeek, slot: registration.slot })));
      }
      setRegistrations(list);
      if (!myRegFound && groupId) {
        const myRegs = list.filter((r) => Number(r.groupId) === Number(groupId));
        setSelectedSlots(myRegs.map((r) => ({ dayOfWeek: r.dayOfWeek, slot: r.slot })));
      }

      setMySchedules(await loadStudentSchedule());
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải dữ liệu nguyện vọng đăng ký.');
    } finally {
      setLoading(false);
    }
  }, [groupId, selectedRoundId]);

  useEffect(() => {
    const initData = async () => {
      try {
        const semRes = await api.get('/semesters?pageSize=100');
        const sems = Array.isArray(semRes.data) ? semRes.data : (semRes.data?.items || []);
        setSemesters(sems);
        if (sems.length > 0) {
          const activeSem = sems.find(s => s.isActive) || sems[0];
          setSemesterId(activeSem.id);
          fetchRounds(activeSem.id);
          return;
        }
      } catch (err) {
        console.error('Lỗi tải kỳ học:', err);
      }
      fetchRounds(semesterId);
    };
    initData();
  }, [fetchRounds, semesterId]);

  useEffect(() => {
    if (selectedRoundId) {
      fetchData();
    }
  }, [fetchData, groupId, selectedRoundId]);

  const toggleSlot = (dayId, slotId) => {
    if (!isLeader) {
      setError('Chỉ có Trưởng nhóm mới có quyền thao tác chọn hoặc hủy slot review.');
      return;
    }
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
    if (!isLeader) {
      setError('Chỉ có Trưởng nhóm mới có quyền đăng ký và chỉnh sửa slot review của nhóm.');
      return;
    }
    if (roundStatus !== 'Đang mở đăng ký') {
      setError('Đợt review này hiện đã kết thúc/đóng đăng ký. Bạn không thể chỉnh sửa.');
      return;
    }
    if (!selectedRoundId) {
      setError('Vui lòng chọn đợt review trước khi lưu.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (selectedSlots.length === 0) {
        await api.delete(`/student-review/slots?roundId=${selectedRoundId}`);
        setSuccess(`Trưởng nhóm #${groupId} đã xóa nguyện vọng đăng ký cho đợt ${reviewType}!`);
        fetchData();
        return;
      }
      await api.put('/student-review/slots', {
        roundId: Number(selectedRoundId),
        slots: selectedSlots.map(s => ({ dayOfWeek: Number(s.dayOfWeek), slot: Number(s.slot) }))
      });
      setSuccess(`Trưởng nhóm #${groupId} đã lưu thành công nguyện vọng đăng ký slot rảnh cho đợt ${reviewType}!`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi lưu danh sách nguyện vọng đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const currentRound = rounds.find(r => r.id === Number(selectedRoundId)) || rounds[0];
  const registrationStatusColors = getRegistrationStatusColors(roundStatus);

  if (loading && rounds.length === 0) return <PageSkeleton cards={3} rows={6} />;

  return (
    <div className="page-container animate-fade-in">
      {step === 1 ? (() => { return (
        /* STEP 1: ROUND SELECTION PORTAL HUB */
        <div>
          <div className="page-header" style={{ marginBottom: '2rem' }}>
            <div>
              <h1 className="page-title" style={{ color: '#0F172A', fontSize: '1.8rem', fontWeight: 850 }}>
                Đăng ký Nguyện vọng Lịch Review Checkpoint
              </h1>
              <p className="page-subtitle" style={{ color: '#475569', fontSize: '0.95rem' }}>
                Bước 1: Vui lòng chọn Học kỳ và Đợt chấm tiến trình (Review Checkpoint) từ danh sách dưới đây để bắt đầu chọn khung giờ rảnh cho nhóm.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {semesters.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>Học kỳ:</span>
                  <select
                    className="form-select"
                    value={semesterId}
                    onChange={(e) => handleSemesterChange(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontWeight: 750, color: '#4F46E5', fontSize: '0.92rem', cursor: 'pointer', outline: 'none' }}
                  >
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) {s.isActive ? '• [Hiện tại]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: '#FFF7ED', padding: '0.6rem 1.25rem', borderRadius: '12px', border: '1px solid #FFEDD5', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <Users size={18} color="#F26522" />
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>Nhóm checkpoint của bạn:</span>
                <span className="badge" style={{ background: '#F26522', color: '#FFFFFF', fontWeight: 850, fontSize: '0.92rem', padding: '0.35rem 0.85rem', borderRadius: '8px' }}>
                  {groupCode || (groupId ? `Nhóm #${groupId}` : 'Chưa có nhóm')}
                </span>
              </div>

              <button type="button" className="btn btn-secondary" onClick={() => fetchRounds()} disabled={loading} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, padding: '0.65rem 1.2rem', borderRadius: '12px' }}>
                <RefreshCw size={16} color="#F26522" />
                <span>Tải lại Đợt</span>
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

          {rounds.length === 0 ? (
            <div className="glass-card" style={{ padding: '4.5rem 2rem', textAlign: 'center', background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '20px' }}>
              <BookOpen size={52} color="#CBD5E1" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Chưa có Đợt Review Checkpoint nào được tạo cho học kỳ này</h3>
              <p style={{ color: '#64748B', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                Hiện tại Ban quản lý (Admin / Trưởng bộ môn) chưa mở hoặc chưa tạo đợt chấm tiến trình nào cho học kỳ đang chọn. Bạn vui lòng kiểm tra kỳ học hoặc quay lại sau!
              </p>
              <button type="button" className="btn btn-primary" onClick={() => fetchRounds()} style={{ padding: '0.75rem 1.75rem', fontWeight: 700, borderRadius: '12px' }}>
                <RefreshCw size={18} />
                <span>Kiểm tra lại ngay</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
              {rounds.map((r) => {
                const isOpen = isRoundRegistrationOpen(r.status);
                return (
                  <div
                    key={r.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '20px',
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 24px -6px rgba(242, 101, 34, 0.14)'; e.currentTarget.style.borderColor = '#F26522'; }}
                    onFocus={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 24px -6px rgba(242, 101, 34, 0.14)'; e.currentTarget.style.borderColor = '#F26522'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    onBlur={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '0.5rem' }}>
                        <span className="badge" style={{ background: 'rgba(242, 101, 34, 0.12)', color: '#F26522', fontWeight: 800, fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderRadius: '8px' }}>
                          {formatReviewType(r.type)}
                        </span>
                        <span className="badge" style={{
                          background: isOpen ? '#DCFCE7' : '#FEE2E2',
                          color: isOpen ? '#16A34A' : '#DC2626',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }}></span>
                          {isOpen ? 'ĐANG MỞ ĐĂNG KÝ' : 'ĐÃ ĐÓNG'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.3rem', fontWeight: 850, color: '#0F172A', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                        Đợt {formatReviewType(r.type)}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Sparkles size={16} color="#F26522" />
                        <span>Mã đợt: <strong>{`REV-${r.id}`}</strong> | Học kỳ ID: <strong>#{r.semesterId || semesterId}</strong></span>
                      </p>

                      <div style={{ background: '#F8FAFC', padding: '1.15rem', borderRadius: '14px', border: '1px solid #F1F5F9', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.88rem', color: '#334155', fontWeight: 650 }}>
                          <Calendar size={17} color="#3B82F6" />
                          <span>Thời gian: <strong>{r.weekStartDate ? new Date(r.weekStartDate).toLocaleDateString('vi-VN') : '---'}</strong> → <strong>{r.weekEndDate ? new Date(r.weekEndDate).toLocaleDateString('vi-VN') : '---'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        width: '100%',
                        padding: '0.95rem 1.35rem',
                        borderRadius: '14px',
                        fontWeight: 800,
                        fontSize: '0.98rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isOpen ? 'linear-gradient(135deg, #F26522, #D9480F)' : '#F1F5F9',
                        color: isOpen ? '#FFFFFF' : '#475569',
                        border: 'none',
                        boxShadow: isOpen ? '0 6px 16px rgba(242, 101, 34, 0.28)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={(e) => { e.stopPropagation(); handleSelectRoundStep2(r); }}
                    >
                      <span>{isOpen ? '👉 Chọn Đợt & Vào Đăng ký Slot' : '👁 Xem Bảng & Kết Quả Lịch'}</span>
                      <ArrowRight size={19} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Official Schedule Section shown in Step 1 too so students can see their finalized reviews easily */}
          <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 850, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#0F172A' }}>
              <Layers size={22} color="#F26522" />
              <span>Lịch Review Checkpoint Chính thức của Nhóm #{groupId}</span>
            </h3>

            {mySchedules.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', lineHeight: 1.6, fontWeight: 500 }}>
                Nhóm #{groupId} chưa có lịch review chính thức nào được chốt cho các đợt trên. Khi Phòng Đào tạo chạy thuật toán xếp lịch và công bố (Publish), hội đồng, địa điểm và thời gian cụ thể sẽ hiển thị ngay tại đây.
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID Phiên</th>
                      <th>Mã Nhóm</th>
                      <th>Ngày review</th>
                      <th>Ca học & Thời gian</th>
                      <th>Phòng</th>
                      <th>Vòng Review</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySchedules.map((sc) => (
                      <tr key={sc.sessionId ?? `${sc.groupId}-${sc.sessionDate}-${sc.slot}`}>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>#{sc.sessionId}</td>
                        <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 800 }}>{sc.groupCode || `Nhóm #${sc.groupId}`}</span></td>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>
                          {sc.sessionDate ? new Date(sc.sessionDate).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ color: '#475569', fontWeight: 600 }}>Ca {sc.slot}</td>
                        <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.85rem', fontWeight: 800 }}>{sc.room}</span></td>
                        <td style={{ color: '#475569', fontWeight: 600 }}>{sc.type}</td>
                        <td><span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9', fontWeight: 800 }}>{sc.status || 'Đã công bố'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ); })() : (() => { return (
        /* STEP 2: 30-SLOT REGISTRATION WORKSPACE */
        <div className="animate-fade-in">
          {/* Navigation Bar Header */}
          <div style={{
            background: '#FFFFFF',
            padding: '1.25rem 1.75rem',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            marginBottom: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 4px 10px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#F1F5F9',
                  color: '#0F172A',
                  border: '1px solid #E2E8F0',
                  padding: '0.7rem 1.25rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontSize: '0.92rem'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                onFocus={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                onBlur={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
              >
                <ArrowLeft size={18} />
                <span>Quay lại Chọn Đợt</span>
              </button>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 850, color: '#0F172A' }}>
                    Đợt {formatReviewType(currentRound?.type || reviewType)} (REV-{currentRound?.id || selectedRoundId})
                  </h2>
                  <span className="badge" style={{ background: 'rgba(242, 101, 34, 0.15)', color: '#F26522', fontWeight: 800, fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
                    {formatReviewType(reviewType)}
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  Thời gian: <strong>{currentRound?.weekStartDate ? new Date(currentRound?.weekStartDate).toLocaleDateString('vi-VN') : '---'}</strong> → <strong>{currentRound?.weekEndDate ? new Date(currentRound?.weekEndDate).toLocaleDateString('vi-VN') : '---'}</strong> | Đang thao tác cho Nhóm ID: <strong style={{ color: '#F26522' }}>#{groupId}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span className="badge" style={{
                background: registrationStatusColors.background,
                color: registrationStatusColors.color,
                fontWeight: 800,
                padding: '0.55rem 1.1rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                {roundStatus}
              </span>

              <button type="button" className="btn btn-secondary" onClick={fetchData} disabled={loading} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, padding: '0.65rem 1.1rem', borderRadius: '12px' }}>
                <RefreshCw size={16} color="#F26522" />
                <span>Tải lại</span>
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

          {!isLeader && (
            <div style={{
              background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
              color: '#92400E',
              border: '1px solid #FCD34D',
              padding: '1.35rem 1.75rem',
              borderRadius: '18px',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1.1rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.14)'
            }}>
              <div style={{ background: '#F59E0B', color: '#FFFFFF', padding: '0.65rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={24} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.08rem', fontWeight: 850, color: '#78350F' }}>
                  Quyền thao tác bị giới hạn: Bạn hiện là Thành viên của {groupCode || (groupId ? `Nhóm #${groupId}` : 'nhóm')} (Không phải Trưởng nhóm)
                </h4>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#92400E', lineHeight: 1.6, fontWeight: 600 }}>
                  Theo quy định của Hệ thống Checkpoint, <strong style={{ color: '#B45309' }}>chỉ có Trưởng nhóm (Leader)</strong> mới có quyền thao tác tick chọn khung giờ rảnh và gửi/lưu nguyện vọng đăng ký cho toàn nhóm. Bạn có thể theo dõi kết quả tick chọn bên dưới nhưng bảng thao tác và nút lưu đã được ẩn mờ.
                </p>
              </div>
            </div>
          )}

          {/* Action Tools Card right above 30-slot grid */}
          <div className="glass-card" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={20} color="#10B981" />
              <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
                Đang chọn: <strong style={{ color: '#F26522', fontSize: '1.1rem' }}>{selectedSlots.length}</strong> / 30 ô slot rảnh trong đợt
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedSlots([])} disabled={!isLeader || roundStatus !== 'Đang mở đăng ký'} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: '0.88rem', fontWeight: 700, padding: '0.65rem 1.25rem', borderRadius: '10px', opacity: !isLeader ? 0.45 : 1, cursor: !isLeader ? 'not-allowed' : 'pointer' }}>
                Xóa chọn tất cả
              </button>
              <button type="button" className="btn btn-primary" onClick={handleRegisterSlots} disabled={!isLeader || loading || roundStatus !== 'Đang mở đăng ký'} style={{ fontWeight: 800, padding: '0.65rem 1.5rem', borderRadius: '10px', background: !isLeader ? '#94A3B8' : 'linear-gradient(135deg, #F26522, #D9480F)', border: 'none', boxShadow: !isLeader ? 'none' : '0 4px 12px rgba(242, 101, 34, 0.25)', cursor: !isLeader ? 'not-allowed' : 'pointer' }}>
                <Send size={16} />
                <span>Save ({selectedSlots.length} ô available)</span>
              </button>
            </div>
          </div>

          {/* 30-Slot Interactive Checklist Grid */}
          <div className="glass-card" style={{
            padding: '1.85rem',
            marginBottom: '2rem',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '20px',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.04)',
            opacity: !isLeader ? 0.5 : 1,
            filter: !isLeader ? 'blur(0.7px)' : 'none',
            pointerEvents: !isLeader ? 'none' : 'auto',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                  <BookOpen size={22} color="#F26522" />
                  <span>Bảng Tick chọn Khung giờ rảnh</span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.3rem 0 0', fontWeight: 500 }}>
                  Trưởng nhóm tick vào tất cả những ô khung giờ mà các thành viên rảnh và sẵn sàng tham gia review, sau đó bấm <strong>Save</strong>.
                </p>
              </div>
              <span className="badge" style={{ background: 'rgba(242, 101, 34, 0.15)', color: '#F26522', fontWeight: 800, fontSize: '0.9rem', padding: '0.45rem 1rem', borderRadius: '12px' }}>
                Đã tick: {selectedSlots.length} ô
              </span>
            </div>

            <RegistrationSlotGrid isSlotSelected={isSlotSelected} toggleSlot={toggleSlot} roundStatus={roundStatus} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={handleRegisterSlots} disabled={!isLeader || loading || roundStatus !== 'Đang mở đăng ký'} style={{ padding: '0.85rem 2rem', fontSize: '1.02rem', fontWeight: 800, borderRadius: '12px', background: !isLeader ? '#94A3B8' : 'linear-gradient(135deg, #F26522, #D9480F)', border: 'none', boxShadow: !isLeader ? 'none' : '0 4px 14px rgba(242, 101, 34, 0.28)', cursor: !isLeader ? 'not-allowed' : 'pointer' }}>
                <Send size={18} />
                <span>Lưu Nguyện vọng Đăng ký</span>
              </button>
            </div>
          </div>

          {/* Current Registrations List */}
          <div className="glass-card" style={{ padding: '1.85rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 850, marginBottom: '1.25rem', color: '#0F172A' }}>Danh sách Nguyện vọng đã nộp ({reviewType})</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '0.9rem 1rem' }}>ID Đăng ký</th>
                    <th>Mã Nhóm</th>
                    <th>Ngày đăng ký</th>
                    <th>Ca đăng ký</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748B', fontWeight: 500 }}>Chưa có nguyện vọng đăng ký nào cho {reviewType}. Hãy tick chọn trên bảng 30 ô và bấm Lưu!</td></tr>
                  ) : (
                    registrations.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 700, color: '#0F172A', padding: '0.9rem 1rem' }}>#{r.id}</td>
                        <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 800 }}>{r.groupCode || `Nhóm #${r.groupId}`}</span></td>
                        <td style={{ color: '#475569', fontWeight: 650 }}>Thứ {r.dayOfWeek + 1 > 7 ? 'CN' : r.dayOfWeek + 1} ({r.dayOfWeek})</td>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>Ca {r.slot}</td>
                        <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontWeight: 800 }}>Đang chờ xếp lịch</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ); })()}
    </div>
  );
};

export default ReviewRegistrationPage;
