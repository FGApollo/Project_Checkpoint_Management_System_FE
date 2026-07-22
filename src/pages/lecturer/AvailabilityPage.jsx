import React, { useCallback, useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckCircle2, AlertCircle, RefreshCw, Save, Send, Check, ArrowLeft, ArrowRight, BookOpen, Sparkles, Calendar, ShieldCheck, Pencil, X } from 'lucide-react';
import { PageSkeleton } from '../../components/common/Skeleton';
import { REVIEW_LUNCH_BREAK, REVIEW_SLOTS } from '../../features/reviews/reviewSlots';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Thứ 2' },
  { id: 2, name: 'Thứ 3' },
  { id: 3, name: 'Thứ 4' },
  { id: 4, name: 'Thứ 5' },
  { id: 5, name: 'Thứ 6' },
  { id: 6, name: 'Thứ 7' },
];

const SLOTS = REVIEW_SLOTS;

const formatReviewType = (type) => {
  if (type === 'Review1' || type === 0) return 'Review 1';
  if (type === 'Review2' || type === 1) return 'Review 2';
  if (type === 'Review3' || type === 2) return 'Review 3';
  if (typeof type === 'string' && type.startsWith('Review')) return type.replace('Review', 'Review ');
  return type || 'Review Checkpoint';
};

const formatRoundDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '---';

const isAvailabilityRoundOpen = (round) => round?.status === 'Open'
  || round?.status === 1
  || round?.status === 0
  || round?.status === 'Draft'
  || round?.status === 'Đang mở';

const getApiErrorMessage = (error, fallback) => error.response?.data?.error
  || error.response?.data?.message
  || error.response?.data?.errors?.[0]?.message
  || fallback;

const getAvailabilityRoundMeta = (isOpen) => {
  if (isOpen) {
    return {
      statusBackground: '#DCFCE7',
      statusColor: '#16A34A',
      statusLabel: 'ĐANG MỞ KHAI BÁO',
      buttonBackground: 'linear-gradient(135deg, #4F46E5, #4338CA)',
      buttonColor: '#FFFFFF',
      buttonShadow: '0 6px 16px rgba(79, 70, 229, 0.28)',
      buttonLabel: '👉 Chọn Đợt & Đăng ký Slot'
    };
  }
  return {
    statusBackground: '#FEE2E2',
    statusColor: '#DC2626',
    statusLabel: 'ĐÃ ĐÓNG',
    buttonBackground: '#F1F5F9',
    buttonColor: '#475569',
    buttonShadow: 'none',
    buttonLabel: '👁 Xem các Slot đã Đăng ký'
  };
};

const getSubmissionMeta = (isSubmitted) => {
  if (isSubmitted) return { background: '#DCFCE7', color: '#16A34A', label: '✓ Đã nộp chính thức' };
  return { background: '#FEF3C7', color: '#D97706', label: 'Đang soạn nháp' };
};

const AvailabilityPage = () => {
  const [step, setStep] = useState(1); // 1: Chọn Đợt Review Hub, 2: Bảng Khai báo 30 ô
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState(1);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEditingSubmitted, setIsEditingSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [rounds, setRounds] = useState([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');

  const handleSelectRoundStep2 = (roundObj) => {
    setSelectedRoundId(roundObj.id);
    setSemesterId(roundObj.semesterId || semesterId);
    setStep(2);
  };

  const fetchRounds = useCallback(async (semId) => {
    const targetSem = semId !== undefined ? semId : semesterId;
    setLoading(true);
    try {
      const res = await api.get(`/review-scheduling/rounds?semesterId=${targetSem}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setRounds(list);
      setSelectedRoundId((current) => {
        if (list.length === 0) return '';
        return current && list.some((round) => round.id === current) ? current : list[0].id;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [semesterId]);

  const handleSemesterChange = (newSemId) => {
    const numId = Number(newSemId);
    setSemesterId(numId);
    setSelectedRoundId('');
    fetchRounds(numId);
  };

  const fetchAvailability = useCallback(async () => {
    if (!selectedRoundId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.get(`/review-availability/week?roundId=${selectedRoundId}`);
      const data = response.data || {};
      setSelectedSlots(Array.isArray(data.slots) ? data.slots : []);
      setIsSubmitted(Boolean(data.isSubmitted || data.status === 'Submitted'));
      setIsEditingSubmitted(false);
    } catch (err) {
      console.error('Failed to load availability:', err);
      setSelectedSlots([]);
      setIsSubmitted(false);
      setIsEditingSubmitted(false);
    } finally {
      setLoading(false);
    }
  }, [selectedRoundId]);

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
      fetchAvailability();
    }
  }, [fetchAvailability, selectedRoundId]);

  const toggleSlot = (dayId, slotId) => {
    if (!canModifyAvailability) return;
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
    if (!selectedRoundId || !canModifyAvailability) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/review-availability/week?roundId=${selectedRoundId}`, {
        slots: selectedSlots
      });
      setSuccess('Đã lưu bản nháp. Bạn có thể chỉnh sửa trước khi nộp chính thức.');
      setIsSubmitted(false);
      setIsEditingSubmitted(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Lỗi khi lưu nháp.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!selectedRoundId || !canModifyAvailability) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/review-availability/week?roundId=${selectedRoundId}`, {
        slots: selectedSlots
      });
      await api.post(`/review-availability/week/submit?roundId=${selectedRoundId}`);
      setSuccess('Đã nộp chính thức! Bạn vẫn có thể chỉnh sửa và nộp lại khi đợt đăng ký còn mở.');
      setIsSubmitted(true);
      setIsEditingSubmitted(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Lỗi khi nộp chính thức.'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditing = () => {
    if (!isSubmitted || !canEditAvailability) return;
    setIsEditingSubmitted(true);
    setError('');
    setSuccess('Bạn đang chỉnh sửa đăng ký đã nộp. Hãy bấm “Nộp lại” để cập nhật bản chính thức.');
  };

  const handleCancelEditing = () => {
    fetchAvailability();
  };

  const selectAllDay = (dayId) => {
    if (!canModifyAvailability) return;
    const allSelected = SLOTS.every((s) => isSlotSelected(dayId, s.id));
    if (allSelected) {
      setSelectedSlots(selectedSlots.filter((s) => s.dayOfWeek !== dayId));
    } else {
      const newSlots = [...selectedSlots.filter((s) => s.dayOfWeek !== dayId)];
      SLOTS.forEach((s) => newSlots.push({ dayOfWeek: dayId, slot: s.id }));
      setSelectedSlots(newSlots);
    }
  };

  const currentRound = rounds.find(r => r.id === Number(selectedRoundId)) || rounds[0];
  const canEditAvailability = isAvailabilityRoundOpen(currentRound);
  const canModifyAvailability = canEditAvailability && (!isSubmitted || isEditingSubmitted);
  const submissionMeta = getSubmissionMeta(isSubmitted);

  if (loading && rounds.length === 0) return <PageSkeleton cards={3} rows={6} />;

  return (
    <div className="page-container animate-fade-in">
      {step === 1 ? (
        /* STEP 1: LECTURER ROUND SELECTION PORTAL HUB */
        <div>
          <div className="page-header" style={{ marginBottom: '2rem' }}>
            <div>
              <h1 className="page-title" style={{ color: '#0F172A', fontSize: '1.8rem', fontWeight: 850 }}>
                Đăng ký Slot Review cho Giảng viên
              </h1>
              <p className="page-subtitle" style={{ color: '#475569', fontSize: '0.95rem' }}>
                Bước 1: Vui lòng chọn Học kỳ và Đợt Review bên dưới để đăng ký các slot bạn có thể tham gia.
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

              <button type="button" className="btn btn-secondary" onClick={() => fetchRounds()} disabled={loading} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, padding: '0.65rem 1.2rem', borderRadius: '12px' }}>
                <RefreshCw size={16} color="#4F46E5" />
                <span>Tải lại Đợt</span>
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <CheckCircle2 size={18} /> {success}
            </div>
          )}

          {rounds.length === 0 ? (
            <div className="glass-card" style={{ padding: '4.5rem 2rem', textAlign: 'center', background: '#FFFFFF', border: '1px dashed #CBD5E1', borderRadius: '20px' }}>
              <BookOpen size={52} color="#CBD5E1" style={{ margin: '0 auto 1.25rem' }} />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Chưa có Đợt Review Checkpoint nào được tạo cho học kỳ này</h3>
              <p style={{ color: '#64748B', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                Hiện tại Ban quản lý (Admin / Trưởng bộ môn) chưa mở hoặc chưa tạo đợt chấm tiến trình nào cho học kỳ đang chọn. Bạn vui lòng kiểm tra kỳ học hoặc quay lại sau!
              </p>
              <button type="button" className="btn btn-primary" onClick={() => fetchRounds()} style={{ padding: '0.75rem 1.75rem', fontWeight: 700, borderRadius: '12px', background: '#4F46E5' }}>
                <RefreshCw size={18} />
                <span>Kiểm tra lại ngay</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
              {rounds.map((r) => {
                const isOpen = isAvailabilityRoundOpen(r);
                const roundMeta = getAvailabilityRoundMeta(isOpen);
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
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 24px -6px rgba(79, 70, 229, 0.14)'; e.currentTarget.style.borderColor = '#4F46E5'; }}
                    onFocus={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 24px -6px rgba(79, 70, 229, 0.14)'; e.currentTarget.style.borderColor = '#4F46E5'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                    onBlur={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '0.5rem' }}>
                        <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#4F46E5', fontWeight: 800, fontSize: '0.8rem', padding: '0.4rem 0.85rem', borderRadius: '8px' }}>
                          {formatReviewType(r.type)}
                        </span>
                        <span className="badge" style={{
                          background: roundMeta.statusBackground,
                          color: roundMeta.statusColor,
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }}></span>
                          {roundMeta.statusLabel}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.3rem', fontWeight: 850, color: '#0F172A', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                        Đợt {formatReviewType(r.type)}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Sparkles size={16} color="#4F46E5" />
                        <span>Mã đợt: <strong>{`REV-${r.id}`}</strong> | Học kỳ ID: <strong>#{r.semesterId || semesterId}</strong></span>
                      </p>

                      <div style={{ background: '#F8FAFC', padding: '1.15rem', borderRadius: '14px', border: '1px solid #F1F5F9', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.88rem', color: '#334155', fontWeight: 650 }}>
                          <Calendar size={17} color="#3B82F6" />
                          <span>Thời gian: <strong>{formatRoundDate(r.weekStartDate || r.startDate)}</strong> → <strong>{formatRoundDate(r.weekEndDate || r.endDate)}</strong></span>
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
                        background: roundMeta.buttonBackground,
                        color: roundMeta.buttonColor,
                        border: 'none',
                        boxShadow: roundMeta.buttonShadow,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={(e) => { e.stopPropagation(); handleSelectRoundStep2(r); }}
                    >
                      <span>{roundMeta.buttonLabel}</span>
                      <ArrowRight size={19} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* STEP 2: LECTURER 30-SLOT AVAILABILITY WORKSPACE */
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
                    Đợt {formatReviewType(currentRound?.type)} (REV-{currentRound?.id || selectedRoundId})
                  </h2>
                  <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.15)', color: '#4F46E5', fontWeight: 800, fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
                    {formatReviewType(currentRound?.type)}
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: '#64748B', fontWeight: 600 }}>
                  Thời gian: <strong>{formatRoundDate(currentRound?.weekStartDate || currentRound?.startDate)}</strong> → <strong>{formatRoundDate(currentRound?.weekEndDate || currentRound?.endDate)}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span className="badge" style={{
                background: submissionMeta.background,
                color: submissionMeta.color,
                fontWeight: 800,
                padding: '0.55rem 1.1rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor' }}></span>
                {submissionMeta.label}
              </span>

              <button type="button" className="btn btn-secondary" onClick={fetchAvailability} disabled={loading} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700, padding: '0.65rem 1.1rem', borderRadius: '12px' }}>
                <RefreshCw size={16} color="#4F46E5" />
                <span>Tải lại</span>
              </button>
              {isSubmitted && canEditAvailability && !isEditingSubmitted && (
                <button type="button" className="btn btn-primary" onClick={handleStartEditing} disabled={loading} style={{ background: '#4F46E5', border: 'none', color: '#FFFFFF', fontWeight: 750, padding: '0.65rem 1.1rem', borderRadius: '12px' }}>
                  <Pencil size={16} />
                  <span>Chỉnh sửa đăng ký</span>
                </button>
              )}
              {isEditingSubmitted && (
                <button type="button" className="btn btn-secondary" onClick={handleCancelEditing} disabled={loading} style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, padding: '0.65rem 1.1rem', borderRadius: '12px' }}>
                  <X size={16} />
                  <span>Hủy chỉnh sửa</span>
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <CheckCircle2 size={18} /> {success}
            </div>
          )}

          {!canEditAvailability && (
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', color: '#C2410C', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <AlertCircle size={18} /> Đợt review này đã đóng. Bạn chỉ có thể xem các slot đã đăng ký.
            </div>
          )}

          {isSubmitted && canEditAvailability && !isEditingSubmitted && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <CheckCircle2 size={18} /> Đăng ký đã được nộp. Bạn có thể chỉnh sửa và nộp lại trong thời gian đợt review còn mở.
            </div>
          )}

          {/* Action Tools Card right above 30-slot grid */}
          <div className="glass-card" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={20} color="#4F46E5" />
              <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
                Đã chọn: <strong style={{ color: '#4F46E5', fontSize: '1.1rem' }}>{selectedSlots.length}</strong> / 30 slot
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading || !canModifyAvailability}
                className="btn btn-secondary"
                style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155', opacity: canModifyAvailability ? 1 : 0.5, fontWeight: 700, padding: '0.65rem 1.25rem', borderRadius: '10px' }}
              >
                <Save size={16} /> <span>Lưu nháp</span>
              </button>
              <button
                type="button"
                onClick={handleSubmitFinal}
                disabled={loading || !canModifyAvailability || selectedSlots.length === 0}
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)', border: 'none', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', opacity: (!canModifyAvailability || selectedSlots.length === 0) ? 0.5 : 1, fontWeight: 800, padding: '0.65rem 1.5rem', borderRadius: '10px' }}
              >
                <Send size={16} /> <span>{isEditingSubmitted ? 'Nộp lại' : 'Nộp chính thức'}</span>
              </button>
            </div>
          </div>

          {/* 6×5 Grid */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            marginBottom: '2rem',
            boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ padding: '1.5rem 1.85rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 850, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
                  <BookOpen size={22} color="#4F46E5" />
                  <span>Danh sách Slot Đăng ký</span>
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.3rem 0 0', fontWeight: 500 }}>
                  Giảng viên chọn các slot có thể tham gia để hệ thống tự động phân công lịch review phù hợp.
                </p>
                <p style={{ fontSize: '0.82rem', color: '#B45309', margin: '0.35rem 0 0', fontWeight: 700 }}>
                  {REVIEW_LUNCH_BREAK.label}
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', fontSize: '0.85rem', fontWeight: 800, color: '#334155', textAlign: 'left', width: '140px' }}>
                      Slot / Ngày
                    </th>
                    {DAYS_OF_WEEK.map((day) => (
                      <th key={day.id} style={{ padding: '0.85rem 0.5rem', background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{day.name}</div>
                        <button
                          type="button"
                          onClick={() => selectAllDay(day.id)}
                          disabled={!canModifyAvailability}
                          style={{
                            marginTop: '0.3rem', fontSize: '0.72rem', color: '#4F46E5', background: 'none', border: 'none', cursor: canModifyAvailability ? 'pointer' : 'not-allowed', fontWeight: 700, opacity: canModifyAvailability ? 1 : 0.4,
                          }}
                        >
                          {SLOTS.every((s) => isSlotSelected(day.id, s.id)) ? 'Bỏ tất cả' : '+ Chọn tất cả'}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map((slot) => (
                    <tr key={slot.id}>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem', textAlign: 'left' }}>
                        <div style={{ fontWeight: 850, color: '#0F172A', fontSize: '0.95rem' }}>{slot.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 700, marginTop: '0.15rem' }}>{slot.time}</div>
                      </td>
                      {DAYS_OF_WEEK.map((day) => {
                        const selected = isSlotSelected(day.id, slot.id);
                        return (
                          <td key={`${day.id}-${slot.id}`} style={{ padding: '0.5rem', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => toggleSlot(day.id, slot.id)}
                              disabled={!canModifyAvailability}
                              style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '10px',
                                border: selected ? '2px solid #4F46E5' : '1px solid #E2E8F0',
                                background: selected ? '#EEF2FF' : '#FFFFFF',
                                cursor: canModifyAvailability ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s ease',
                                opacity: canModifyAvailability ? 1 : 0.6,
                                boxShadow: selected ? '0 2px 6px rgba(79, 70, 229, 0.15)' : 'none'
                              }}
                            >
                              {selected ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4F46E5', fontWeight: 800, fontSize: '0.8rem' }}>
                                  <Check size={18} strokeWidth={3} />
                                  <span>Có thể tham gia</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 500 }}>---</span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '2rem' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading || !canModifyAvailability}
              className="btn btn-secondary"
              style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', color: '#334155', opacity: canModifyAvailability ? 1 : 0.5, fontWeight: 700, padding: '0.8rem 1.5rem', borderRadius: '12px' }}
            >
              <Save size={18} /> <span>Lưu nháp</span>
            </button>
            <button
              type="button"
              onClick={handleSubmitFinal}
              disabled={loading || !canModifyAvailability || selectedSlots.length === 0}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)', border: 'none', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.28)', opacity: (!canModifyAvailability || selectedSlots.length === 0) ? 0.5 : 1, fontWeight: 800, padding: '0.8rem 2rem', borderRadius: '12px' }}
            >
              <Send size={18} /> <span>{isEditingSubmitted ? 'Nộp lại' : 'Nộp chính thức'} ({selectedSlots.length} slot)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityPage;
