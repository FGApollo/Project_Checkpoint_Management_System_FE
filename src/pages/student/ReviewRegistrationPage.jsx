import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getRoundStatusMeta, getStudentAvailabilityValidationError, isRegistrationOpen, REQUIRED_STUDENT_AVAILABILITY_SLOTS, ROUND_STATUS } from '../../features/reviews/reviewDomain';
import { getOwnRegistrations, replaceStudentAvailability } from '../../features/reviews/studentAvailability';
import { Calendar, CheckCircle2, AlertCircle, RefreshCw, Send, BookOpen, Layers, ArrowRight, ArrowLeft, Sparkles, ShieldCheck, Users } from 'lucide-react';

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

const ReviewRegistrationPage = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Chọn Đợt Review Hub, 2: Bảng chọn Slot 30 ô
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState(1);
  const [groupId, setGroupId] = useState(user?.groupId || user?.group?.id || null);

  useEffect(() => {
    if (user && (user.groupId || user?.group?.id)) {
      setGroupId(user.groupId || user?.group?.id);
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
  const [roundStatus, setRoundStatus] = useState(ROUND_STATUS.DRAFT);

  const handleSelectRoundStep2 = (roundObj) => {
    setSelectedRoundId(roundObj.id);
    setSemesterId(roundObj.semesterId || semesterId);
    setReviewType(formatReviewType(roundObj.type));
    updateRoundStatus(roundObj);
    setStep(2);
  };

  const fetchRounds = async (semId) => {
    const targetSem = semId !== undefined ? semId : semesterId;
    setLoading(true);
    try {
      const revRes = await api.get(`/student-review/rounds?semesterId=${targetSem}`).catch(() => ({ data: [] }));
      let list = Array.isArray(revRes.data) ? revRes.data : [];
      if (list.length === 0) {
        const fallbackRes = await api.get(`/review-scheduling/rounds?semesterId=${targetSem}`).catch(() => ({ data: [] }));
        list = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      }
      setRounds(list);
      if (list.length > 0 && (!selectedRoundId || !list.some(r => r.id === selectedRoundId))) {
        const first = list[0];
        setSelectedRoundId(first.id);
        setReviewType(formatReviewType(first.type));
        updateRoundStatus(first);
      } else if (list.length === 0) {
        setSelectedRoundId('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateRoundStatus = (roundObj) => {
    if (!roundObj) return;
    setRoundStatus(roundObj.status || ROUND_STATUS.DRAFT);
  };

  const handleSemesterChange = (newSemId) => {
    const numId = Number(newSemId);
    setSemesterId(numId);
    setSelectedRoundId('');
    fetchRounds(numId);
  };

  const fetchData = async () => {
    if (!selectedRoundId) return;
    setLoading(true);
    setError('');
    try {
      let myRegFound = false;
      let list = [];
      try {
        const slotRes = await api.get(`/student-review/slots?roundId=${selectedRoundId}`);
        const gridData = slotRes.data || {};
        list = Array.isArray(gridData.registrations) ? gridData.registrations : [];
        const ownRegistrations = getOwnRegistrations(gridData, groupId);
        if (ownRegistrations.length > 0) {
          if (ownRegistrations[0].groupId) {
            setGroupId(ownRegistrations[0].groupId);
          }
          setSelectedSlots(ownRegistrations.map((registration) => ({
            dayOfWeek: registration.dayOfWeek,
            slot: registration.slot,
          })));
          myRegFound = true;
        }
      } catch {
        const regRes = await api.get(`/review-scheduling/student-registrations?roundId=${selectedRoundId}`).catch(() => ({ data: [] }));
        list = Array.isArray(regRes.data) ? regRes.data : [];
      }
      setRegistrations(list);
      if (!myRegFound) {
        const myRegs = list.filter((r) => Number(r.groupId) === Number(groupId));
        setSelectedSlots(myRegs.map((r) => ({ dayOfWeek: r.dayOfWeek, slot: r.slot })));
      }

      const schedRes = await api.get('/student-review/schedule').catch(() =>
        api.get('/review-sessions/my').catch(() => ({ data: [] }))
      );
      setMySchedules(Array.isArray(schedRes.data) ? schedRes.data : []);
    } catch {
      setError('Không thể tải dữ liệu nguyện vọng đăng ký.');
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  useEffect(() => {
    if (selectedRoundId) {
      fetchData();
    }
  }, [selectedRoundId, groupId]);

  const toggleSlot = (dayId, slotId) => {
    if (!isRegistrationOpen(roundStatus)) return;
    setError('');
    setSuccess('');
    const exists = selectedSlots.some((s) => s.dayOfWeek === dayId && s.slot === slotId);
    if (exists) {
      setSelectedSlots(selectedSlots.filter((s) => !(s.dayOfWeek === dayId && s.slot === slotId)));
    } else {
      if (selectedSlots.length >= REQUIRED_STUDENT_AVAILABILITY_SLOTS) {
        setError(`Mỗi nhóm chỉ được chọn đúng ${REQUIRED_STUDENT_AVAILABILITY_SLOTS} slot rảnh.`);
        return;
      }
      setSelectedSlots([...selectedSlots, { dayOfWeek: dayId, slot: slotId }]);
    }
  };

  const isSlotSelected = (dayId, slotId) => {
    return selectedSlots.some((s) => s.dayOfWeek === dayId && s.slot === slotId);
  };

  const handleRegisterSlots = async (e) => {
    e.preventDefault();
    if (!isRegistrationOpen(roundStatus)) {
      setError('Đợt review này hiện đã kết thúc/đóng đăng ký. Bạn không thể chỉnh sửa.');
      return;
    }
    if (!selectedRoundId) {
      setError('Vui lòng chọn đợt review trước khi lưu.');
      return;
    }
    const validationError = getStudentAvailabilityValidationError(selectedSlots);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await replaceStudentAvailability(api, {
        roundId: selectedRoundId,
        slots: selectedSlots,
        knownGroupId: groupId,
      });

      setSuccess(`Đã lưu thành công ${REQUIRED_STUDENT_AVAILABILITY_SLOTS} slot rảnh của nhóm cho đợt ${reviewType}!`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Lỗi khi lưu danh sách nguyện vọng đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const currentRound = rounds.find(r => r.id === Number(selectedRoundId)) || rounds[0];
  const roundStatusMeta = getRoundStatusMeta(roundStatus);

  return (
    <div className="page-container animate-fade-in">
      {step === 1 ? (
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
                  {groupId ? `Nhóm #${groupId}` : 'Nhóm của bạn'}
                </span>
              </div>

              <button className="btn btn-secondary" onClick={() => fetchRounds()} disabled={loading} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, padding: '0.65rem 1.2rem', borderRadius: '12px' }}>
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
              <button className="btn btn-primary" onClick={() => fetchRounds()} style={{ padding: '0.75rem 1.75rem', fontWeight: 700, borderRadius: '12px' }}>
                <RefreshCw size={18} />
                <span>Kiểm tra lại ngay</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
              {rounds.map((r) => {
                const isOpen = isRegistrationOpen(r.status);
                const statusMeta = getRoundStatusMeta(r.status);
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
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleSelectRoundStep2(r)}
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 24px -6px rgba(242, 101, 34, 0.14)'; e.currentTarget.style.borderColor = '#F26522'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '0.5rem' }}>
                        <span className="badge" style={{ background: 'rgba(242, 101, 34, 0.12)', color: '#F26522', fontWeight: 800, fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderRadius: '8px' }}>
                          {formatReviewType(r.type)}
                        </span>
                        <span className="badge" style={{
                          background: statusMeta.background,
                          color: statusMeta.color,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }}></span>
                          {statusMeta.label.toUpperCase()}
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
              <span>Lịch Review Checkpoint Chính thức của {groupId ? `Nhóm #${groupId}` : 'nhóm bạn'}</span>
            </h3>

            {mySchedules.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', lineHeight: 1.6, fontWeight: 500 }}>
                Nhóm của bạn chưa có lịch review chính thức nào được chốt cho các đợt trên. Khi Phòng Đào tạo chạy thuật toán xếp lịch và công bố (Publish), hội đồng, địa điểm và thời gian cụ thể sẽ hiển thị ngay tại đây.
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
                    {mySchedules.map((sc, idx) => (
                      <tr key={sc.id || idx}>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>#{sc.id}</td>
                        <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontWeight: 800 }}>{sc.groupCode || `Nhóm #${sc.groupId}`}</span></td>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>{sc.sessionDate}</td>
                        <td style={{ color: '#475569', fontWeight: 600 }}>Ca {sc.slot}</td>
                        <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.85rem', fontWeight: 800 }}>{sc.room}</span></td>
                        <td style={{ color: '#475569', fontWeight: 600 }}>{sc.reviewType}</td>
                        <td><span className="badge" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9', fontWeight: 800 }}>{sc.status || 'Đã công bố'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
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
                onMouseOut={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
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
                  Thời gian: <strong>{currentRound?.weekStartDate ? new Date(currentRound?.weekStartDate).toLocaleDateString('vi-VN') : '---'}</strong> → <strong>{currentRound?.weekEndDate ? new Date(currentRound?.weekEndDate).toLocaleDateString('vi-VN') : '---'}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span className="badge" style={{
                background: roundStatusMeta.background,
                color: roundStatusMeta.color,
                fontWeight: 800,
                padding: '0.55rem 1.1rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                {roundStatusMeta.label}
              </span>

              <button className="btn btn-secondary" onClick={fetchData} disabled={loading} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, padding: '0.65rem 1.1rem', borderRadius: '12px' }}>
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

          {/* Action Tools Card right above 30-slot grid */}
          <div className="glass-card" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={20} color="#10B981" />
              <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
                Đã chọn: <strong style={{ color: '#F26522', fontSize: '1.1rem' }}>{selectedSlots.length}</strong> / {REQUIRED_STUDENT_AVAILABILITY_SLOTS} slot bắt buộc
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedSlots([])} disabled={!isRegistrationOpen(roundStatus)} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontSize: '0.88rem', fontWeight: 700, padding: '0.65rem 1.25rem', borderRadius: '10px' }}>
                Xóa chọn tất cả
              </button>
              <button type="button" className="btn btn-primary" onClick={handleRegisterSlots} disabled={loading || !isRegistrationOpen(roundStatus) || selectedSlots.length !== REQUIRED_STUDENT_AVAILABILITY_SLOTS} style={{ fontWeight: 800, padding: '0.65rem 1.5rem', borderRadius: '10px', background: 'linear-gradient(135deg, #F26522, #D9480F)', border: 'none', boxShadow: '0 4px 12px rgba(242, 101, 34, 0.25)' }}>
                <Send size={16} />
                <span>Save ({selectedSlots.length}/{REQUIRED_STUDENT_AVAILABILITY_SLOTS} slot)</span>
              </button>
            </div>
          </div>

          {/* 30-Slot Interactive Checklist Grid */}
          <div className="glass-card" style={{ padding: '1.85rem', marginBottom: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '20px', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                  <BookOpen size={22} color="#F26522" />
                  <span>Bảng Tick chọn Khung giờ rảnh</span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.3rem 0 0', fontWeight: 500 }}>
                  Trưởng nhóm chọn đúng <strong>{REQUIRED_STUDENT_AVAILABILITY_SLOTS} slot</strong> mà nhóm có thể tham gia, sau đó bấm <strong>Save</strong>.
                </p>
              </div>
              <span className="badge" style={{ background: 'rgba(242, 101, 34, 0.15)', color: '#F26522', fontWeight: 800, fontSize: '0.9rem', padding: '0.45rem 1rem', borderRadius: '12px' }}>
                Đã chọn: {selectedSlots.length}/{REQUIRED_STUDENT_AVAILABILITY_SLOTS} slot
              </span>
            </div>

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
                  {SLOTS.map((s) => (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'left', padding: '1rem' }}>
                        <div style={{ fontWeight: 850, color: '#0F172A', fontSize: '0.95rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, marginTop: '0.15rem' }}>{s.time}</div>
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        const checked = isSlotSelected(day.id, s.id);
                        return (
                          <td
                            key={`${day.id}-${s.id}`}
                            onClick={() => toggleSlot(day.id, s.id)}
                            style={{
                              cursor: isRegistrationOpen(roundStatus) ? 'pointer' : 'not-allowed',
                              background: checked ? 'rgba(242, 101, 34, 0.14)' : 'transparent',
                              transition: 'all 0.15s ease',
                              padding: '0.85rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justify: 'center', gap: '0.5rem' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                disabled={!isRegistrationOpen(roundStatus)}
                                style={{ width: '19px', height: '19px', accentColor: '#F26522', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '0.85rem', fontWeight: checked ? 800 : 600, color: checked ? '#F26522' : '#64748B' }}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-primary" onClick={handleRegisterSlots} disabled={loading || !isRegistrationOpen(roundStatus) || selectedSlots.length !== REQUIRED_STUDENT_AVAILABILITY_SLOTS} style={{ padding: '0.85rem 2rem', fontSize: '1.02rem', fontWeight: 800, borderRadius: '12px', background: 'linear-gradient(135deg, #F26522, #D9480F)', border: 'none', boxShadow: '0 4px 14px rgba(242, 101, 34, 0.28)' }}>
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
      )}
    </div>
  );
};

export default ReviewRegistrationPage;
