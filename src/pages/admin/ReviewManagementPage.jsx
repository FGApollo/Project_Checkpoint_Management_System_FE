import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { Layers, UserPlus, Zap, CheckCircle2, AlertCircle, Users, Calendar, ArrowRight, Play, CheckSquare, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { REVIEW_TYPES, getAvailableReviewTypes, getDuplicateReviewTypes, getExistingReviewTypes } from '../../features/reviews/reviewRoundTypes';
import { calculateReviewDates, getRegistrationEndDate, isWednesday } from '../../features/reviews/reviewRoundDates';
import { PageSkeleton } from '../../components/common/Skeleton';

const formatReviewType = (type) => {
  if (type === 'Review1' || type === 0) return 'Review 1';
  if (type === 'Review2' || type === 1) return 'Review 2';
  if (type === 'Review3' || type === 2) return 'Review 3';
  if (typeof type === 'string' && type.startsWith('Review')) return type.replace('Review', 'Review ');
  return type || '';
};

const isRoundOpen = (status) => status === 'Open' || status === 1;
const isRoundPublished = (status) => status === 'Published' || status === 3;
const canOpenRoundRegistration = (status) =>
  status === 'Draft' || status === 0 || status === 'Closed' || status === 2;

const getRoundStatusMeta = (status) => {
  if (isRoundOpen(status)) {
    return {
      isOpen: true,
      badgeBackground: '#DCFCE7',
      badgeColor: '#16A34A',
      badgeLabel: '● Đang Mở Đăng Ký',
      panelBackground: '#ECFDF5',
      panelBorder: '#6EE7B7',
      iconBackground: '#D1FAE5',
      iconColor: '#10B981',
      headingColor: '#065F46',
      textColor: '#047857',
      heading: 'ĐANG MỞ ĐĂNG KÝ (OPEN)',
      description: '● Giảng viên và Sinh viên có quyền truy cập bảng 30 slot để đăng ký hoặc chỉnh sửa lựa chọn.',
      Icon: Unlock
    };
  }
  if (status === 'Closed' || status === 2) {
    return {
      isOpen: false,
      badgeBackground: '#FEE2E2',
      badgeColor: '#DC2626',
      badgeLabel: '🔒 Đã Khóa Đăng Ký',
      panelBackground: '#FEF2F2',
      panelBorder: '#FCA5A5',
      iconBackground: '#FEE2E2',
      iconColor: '#EF4444',
      headingColor: '#991B1B',
      textColor: '#B91C1C',
      heading: 'ĐÃ KHÓA ĐĂNG KÝ (CLOSED)',
      description: '🔒 Đã khóa không cho phép tick chọn thêm hoặc sửa lịch. Bạn có thể mở khóa đăng ký nếu cần cho phép đăng ký lại.',
      Icon: Lock
    };
  }
  if (status === 'Draft' || status === 0) {
    return {
      isOpen: false,
      badgeBackground: '#FEF3C7',
      badgeColor: '#D97706',
      badgeLabel: '📝 Nháp (Chưa Mở)',
      panelBackground: '#FFFBEB',
      panelBorder: '#FDE68A',
      iconBackground: '#FEF3C7',
      iconColor: '#D97706',
      headingColor: '#92400E',
      textColor: '#B45309',
      heading: 'NHÁP (CHƯA MỞ ĐĂNG KÝ)',
      description: '📝 Đợt vừa tạo ở dạng Nháp. Vui lòng mở khóa đăng ký để bắt đầu nhận nguyện vọng.',
      Icon: ShieldAlert
    };
  }
  return {
    isOpen: false,
    badgeBackground: '#E0F2FE',
    badgeColor: '#0284C7',
    badgeLabel: 'Đã Công Bố',
    panelBackground: '#E0F2FE',
    panelBorder: '#7DD3FC',
    iconBackground: '#BAE6FD',
    iconColor: '#0284C7',
    headingColor: '#075985',
    textColor: '#0369A1',
    heading: 'ĐÃ CÔNG BỐ',
    description: 'Lịch review đã được công bố.',
    Icon: CheckCircle2
  };
};

const normalizeRoundStatus = (status) => {
  if (status === 0 || status === 'Draft') return 'Draft';
  if (status === 1 || status === 'Open') return 'Open';
  if (status === 2 || status === 'Closed') return 'Closed';
  if (status === 3 || status === 'Published') return 'Published';
  return status;
};

const RoundStatusPanel = ({ status }) => {
  const meta = getRoundStatusMeta(status);
  const StatusIcon = meta.Icon;
  return (
    <div style={{ background: meta.panelBackground, border: `1px solid ${meta.panelBorder}`, borderRadius: '14px', padding: '1.25rem', maxWidth: '680px', margin: '0 auto 2rem', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ padding: '0.75rem', borderRadius: '12px', background: meta.iconBackground, color: meta.iconColor }}>
        <StatusIcon size={26} />
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 800, color: meta.headingColor }}>Trạng thái: {meta.heading}</h4>
        <p style={{ margin: 0, fontSize: '0.88rem', color: meta.textColor, lineHeight: 1.5, fontWeight: 550 }}>{meta.description}</p>
      </div>
    </div>
  );
};

const ReviewManagementPage = () => {
  const [activeStep, setActiveStep] = useState(1); // 1: Rounds, 2: Lecturers, 3: Match, 4: Publish
  const [reviewersPerSession, setReviewersPerSession] = useState(4);

  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [semesters, setSemesters] = useState([]);
  const existingReviewTypes = useMemo(() => getExistingReviewTypes(rounds), [rounds]);
  const availableReviewTypes = useMemo(() => getAvailableReviewTypes(rounds), [rounds]);
  const duplicateReviewTypes = useMemo(() => getDuplicateReviewTypes(rounds), [rounds]);

  // Step 1 Form
  const [formData, setFormData] = useState({
    semesterId: 1,
    reviewType: 'Review1',
    registrationEndDate: '',
    startDate: '',
    endDate: ''
  });

  const [boardData, setBoardData] = useState({
    lecturersCount: 0,
    registeredLecturersCount: 0,
    draftLecturersCount: 0,
    registeredGroupsCount: 0,
    sessions: []
  });

  const fetchRounds = async (semId = formData.semesterId) => {
    setLoading(true);
    try {
      const response = await api.get(`/review-scheduling/rounds?semesterId=${semId}`);
      const list = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      setRounds(list);
      if (list.length > 0) {
        setSelectedRound(prev => {
          if (prev && list.some(r => r.id === prev.id)) {
            return list.find(r => r.id === prev.id);
          }
          return list[0];
        });
      } else {
        setSelectedRound(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardDetails = async (round, semId = formData.semesterId) => {
    if (!round) {
      setBoardData({
        lecturersCount: 0,
        registeredLecturersCount: 0,
        draftLecturersCount: 0,
        registeredGroupsCount: 0,
        sessions: []
      });
      return;
    }
    try {
      const [res, registrationsResponse] = await Promise.all([
        api.get('/review-scheduling/board', {
          params: {
            semesterId: Number(semId),
            reviewType: String(round.type),
            weekStart: String(round.weekStartDate)
          }
        }),
        api.get('/review-scheduling/student-registrations', { params: { roundId: round.id } })
      ]);
      const data = res.data || {};
      const lecturersCount = data.lecturers?.length || 0;
      const availabilitySubmissions = Array.isArray(data.availabilitySubmissions) ? data.availabilitySubmissions : [];
      const submittedLecturerIds = new Set(
        availabilitySubmissions
          .filter(s => (s.isSubmitted === true || s.submitted === true) && Number(s.slotCount || 0) > 0)
          .map(s => s.lecturerId)
      );
      const registeredLecturersCount = submittedLecturerIds.size;
      const draftLecturersCount = new Set(
        availabilitySubmissions
          .filter(s => s.isSubmitted !== true && s.submitted !== true && Number(s.slotCount || 0) > 0)
          .map(s => s.lecturerId)
      ).size;
      const registrations = Array.isArray(registrationsResponse.data) ? registrationsResponse.data : [];
      const registeredGroupsCount = new Set(registrations.map((item) => item.groupId)).size
        || round.registrationCount
        || round.registeredGroupCount
        || 0;
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];

      setBoardData({
        lecturersCount,
        registeredLecturersCount,
        draftLecturersCount,
        registeredGroupsCount,
        sessions
      });
    } catch (err) {
      console.error('Lỗi tải dữ liệu bảng review:', err);
      setBoardData({
        lecturersCount: 0,
        registeredLecturersCount: 0,
        draftLecturersCount: 0,
        registeredGroupsCount: 0,
        sessions: []
      });
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
          setFormData(prev => ({ ...prev, semesterId: activeSem.id }));
          fetchRounds(activeSem.id);
          return;
        }
      } catch (err) {
        console.error('Lỗi tải kỳ học:', err);
      }
      fetchRounds(1);
    };
    initData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      fetchBoardDetails(selectedRound, formData.semesterId);
    } else {
      setBoardData({
        lecturersCount: 0,
        registeredLecturersCount: 0,
        draftLecturersCount: 0,
        registeredGroupsCount: 0,
        sessions: []
      });
    }
  }, [selectedRound, formData.semesterId]);

  useEffect(() => {
    if (availableReviewTypes.length > 0 && existingReviewTypes.has(formData.reviewType)) {
      setFormData((current) => ({ ...current, reviewType: availableReviewTypes[0] }));
    }
  }, [availableReviewTypes, existingReviewTypes, formData.reviewType]);

  const handleRegistrationEndDateChange = (e) => {
    const registrationEndDate = e.target.value;
    const { weekStartDate, weekEndDate } = calculateReviewDates(registrationEndDate);
    setFormData({
      ...formData,
      registrationEndDate,
      startDate: weekStartDate,
      endDate: weekEndDate,
    });
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (existingReviewTypes.has(formData.reviewType)) {
      setError(`Học kỳ này đã có ${formatReviewType(formData.reviewType)}. Mỗi học kỳ chỉ được có một Review 1, một Review 2 và một Review 3.`);
      return;
    }

    if (availableReviewTypes.length === 0) {
      setError('Học kỳ này đã đủ ba đợt Review 1, Review 2 và Review 3.');
      return;
    }

    if (!formData.registrationEndDate || !formData.startDate || !formData.endDate) {
      setError('Vui lòng chọn ngày cuối đăng ký.');
      return;
    }
    if (!isWednesday(formData.registrationEndDate)) {
      setError('Ngày cuối đăng ký phải là Thứ 4 để lịch chấm bắt đầu vào Thứ 2, đúng 5 ngày sau đó.');
      return;
    }
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      setError('Đến ngày không được nhỏ hơn Từ ngày.');
      return;
    }
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays !== 6) {
      setError(`Ràng buộc: 1 đợt review có độ dài đúng 6 ngày từ thứ 2 đến thứ 7 (Khoảng thời gian từ ${formData.startDate} đến ${formData.endDate} hiện là ${diffDays} ngày, không hợp lệ).`);
      return;
    }

    try {
      const res = await api.post('/review-scheduling/rounds', {
        semesterId: Number(formData.semesterId),
        reviewType: formData.reviewType,
        registrationEndDate: formData.registrationEndDate,
        weekStartDate: formData.startDate
      });
      setSuccess('Đã tạo đợt review thành công.');
      await fetchRounds(formData.semesterId);
      if (res.data) {
        setSelectedRound(res.data);
        await fetchBoardDetails(res.data, formData.semesterId);
      }
      setActiveStep(2); // Move to next step only after successful creation
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi tạo đợt review');
    }
  };

  const handleLockRegistrationAndProceed = async () => {
    if (!selectedRound) return;
    if (isRoundPublished(selectedRound.status)) {
      setActiveStep(3);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (selectedRound.status !== 'Closed' && selectedRound.status !== 2 && selectedRound.status !== 'Published' && selectedRound.status !== 3) {
        await api.patch(`/review-scheduling/rounds/${selectedRound.id}/status`, { status: 2 }); // Closed
      }
      const updatedRound = { ...selectedRound, status: 'Closed' };
      setSelectedRound(updatedRound);
      await fetchRounds(formData.semesterId);
      setActiveStep(3);
      setSuccess('Đã khóa đăng ký và chuyển sang bước Chạy thuật toán phân công!');
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi khóa đăng ký đợt review');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRoundStatus = async (roundToUpdate, newStatus, e) => {
    if (e) e.stopPropagation();
    if (!roundToUpdate) return;
    if (isRoundOpen(newStatus) && isRoundPublished(roundToUpdate.status)) {
      setSuccess('');
      setError('Đợt review đã công bố nên không thể mở lại đăng ký.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.patch(`/review-scheduling/rounds/${roundToUpdate.id}/status`, { status: newStatus });
      const updatedRound = res.data || { ...roundToUpdate, status: normalizeRoundStatus(newStatus) };
      if (selectedRound && selectedRound.id === roundToUpdate.id) {
        setSelectedRound(updatedRound);
      }
      await fetchRounds(formData.semesterId);
      setSuccess(newStatus === 1 || newStatus === 'Open' ? `Đã MỞ KHÓA đăng ký cho đợt ${formatReviewType(roundToUpdate.type)}! Giảng viên và Sinh viên hiện có thể đăng ký slot.` : `Đã KHÓA đăng ký cho đợt ${formatReviewType(roundToUpdate.type)}! Giảng viên và Sinh viên không thể thay đổi đăng ký.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái đợt review');
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedRound) {
      setError('Vui lòng chọn hoặc tạo đợt review trước.');
      return;
    }
    if (isRoundPublished(selectedRound.status)) {
      setSuccess('');
      setError('Đợt review đã công bố nên không thể chạy lại phân công.');
      return;
    }
    if (boardData.registeredLecturersCount < reviewersPerSession) {
      setSuccess('');
      setError(`Cần ít nhất ${reviewersPerSession} giảng viên nộp đăng ký slot chính thức trước khi chạy phân công. Hiện có ${boardData.registeredLecturersCount} giảng viên đã nộp${boardData.draftLecturersCount > 0 ? ` và ${boardData.draftLecturersCount} giảng viên mới lưu nháp` : ''}.`);
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (selectedRound.status !== 'Closed' && selectedRound.status !== 2 && selectedRound.status !== 'Published' && selectedRound.status !== 3) {
        await api.patch(`/review-scheduling/rounds/${selectedRound.id}/status`, { status: 2 }); // Closed
        setSelectedRound(prev => prev ? { ...prev, status: 'Closed' } : prev);
      }
      const res = await api.post('/review-scheduling/random-assign', {
        semesterId: Number(formData.semesterId),
        reviewType: selectedRound.type,
        weekStart: selectedRound.weekStartDate,
        reviewersPerSession,
        roomPrefix: 'REV'
      });
      const data = res.data || {};
      const assignedCount = data.assignedCount !== undefined ? data.assignedCount : (data.sessions?.length || 0);
      await fetchBoardDetails(selectedRound, formData.semesterId);

      if (assignedCount === 0) {
        const unassignedReasons = data.unassignedGroups?.map(u => `${u.groupCode}: ${u.reason}`).join(' | ') || `Chưa đủ giảng viên đăng ký cùng một slot (cần ${reviewersPerSession} giảng viên trong cùng slot và không trùng với GVHD).`;
        setError(`Thuật toán chưa thể xếp lịch được ca nào (0/${data.totalCandidateGroups || boardData.registeredGroupsCount || 3} nhóm). Lý do chi tiết:\n${unassignedReasons}`);
        return;
      }

      setSuccess(`Đã chạy thuật toán xếp lịch và lưu phân công vào Database thành công cho ${assignedCount}/${data.totalCandidateGroups || assignedCount} nhóm!`);
      setActiveStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi chạy thuật toán phân công. Hãy kiểm tra các slot giảng viên và nhóm đã đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedRound) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/review-schedules/publish', {
        semesterId: Number(formData.semesterId),
        reviewType: selectedRound.type,
        weekStart: selectedRound.weekStartDate,
        subject: `[CPMS] Thông báo Lịch Review Checkpoint (${formatReviewType(selectedRound.type)})`,
        message: `Kính gửi Quý Giảng viên và Sinh viên,\n\nLịch review checkpoint cho đợt ${formatReviewType(selectedRound.type)} đã được công bố chính thức trên hệ thống CPMS. Vui lòng đăng nhập để xem chi tiết ca review và phòng.\n\nTrân trọng,\nPhòng Đào tạo.`
      });
      const publishedCount = res.data?.publishedSessionCount ?? boardData.sessions.length;
      const queuedEmailCount = res.data?.queuedEmailCount ?? 0;
      const sentEmailCount = res.data?.sentEmailCount ?? 0;
      const failedEmailCount = res.data?.failedEmailCount ?? 0;
      setSuccess(
        queuedEmailCount > 0
          ? `Đã công bố ${publishedCount} ca review. ${queuedEmailCount} email lịch cho Giảng viên & Sinh viên đang được gửi nền; bạn có thể tiếp tục sử dụng hệ thống.`
          : `Đã công bố ${publishedCount} ca review và gửi thành công ${sentEmailCount} email lịch cho Giảng viên & Sinh viên.`
      );
      if (failedEmailCount > 0) {
        setError(`Lịch đã được công bố nhưng có ${failedEmailCount} email gửi thất bại. Vui lòng kiểm tra cấu hình SMTP và nhật ký gửi mail.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi khi publish lịch review.');
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === activeStep) return;
    setError('');
    setSuccess('');

    // Kiểm tra tuần tự từng bước
    if (targetStep >= 2) {
      if (rounds.length === 0 || !selectedRound) {
        setError('Vui lòng thiết lập ít nhất 1 đợt review ở Bước 1 trước khi chuyển sang các bước tiếp theo!');
        setTimeout(() => setError(''), 4000);
        return;
      }
    }

    if (targetStep === 4) {
      if (!boardData.sessions || boardData.sessions.length === 0) {
        setError('Vui lòng chạy thuật toán Auto-Match ở Bước 3 thành công trước khi sang Bước 4 (Publish)!');
        setTimeout(() => setError(''), 4000);
        return;
      }
    }

    setActiveStep(targetStep);
  };

  if (loading && rounds.length === 0) return <PageSkeleton cards={4} rows={6} />;

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
      {duplicateReviewTypes.length > 0 && (
        <div role="alert" style={{ background: '#FFF7ED', color: '#9A3412', border: '1px solid #FDBA74', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>Dữ liệu bất thường: {duplicateReviewTypes.map(formatReviewType).join(', ')} đang bị trùng trong cùng học kỳ. Vui lòng đồng bộ lại dữ liệu backend.</span>
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
          const isAccessible = s.step === 1 || (s.step <= 3 && rounds.length > 0 && selectedRound) || (s.step === 4 && boardData.sessions.length > 0);
          return (
            <button type="button" key={s.step} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: isAccessible ? 'pointer' : 'not-allowed', opacity: isAccessible ? 1 : 0.65, background: 'none', border: 'none', padding: 0 }} onClick={() => handleStepClick(s.step)}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: isActive ? '#4F46E5' : '#F1F5F9', border: `2px solid ${isActive ? '#4F46E5' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'white' : '#64748B', transition: 'all 0.2s' }}>
                <s.icon size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#0F172A' : '#64748B' }}>{s.label}</span>
            </button>
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
                    <label htmlFor="semester-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Kỳ học (Semester)</label>
                    <select
                      id="semester-select"
                      className="form-select"
                      value={formData.semesterId}
                      onChange={(e) => {
                        const semId = Number(e.target.value);
                        // Clear the previous semester's round before changing semester so
                        // the board effect never requests an old round with the new semester id.
                        setSelectedRound(null);
                        setFormData({ ...formData, semesterId: semId });
                        fetchRounds(semId);
                      }}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', fontWeight: 600 }}
                    >
                      {semesters.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code}) {s.isActive ? '• [Hiện tại]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="review-type-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Loại Review</label>
                    <select id="review-type-select" className="form-select" value={formData.reviewType} onChange={e => setFormData({ ...formData, reviewType: e.target.value })} disabled={availableReviewTypes.length === 0} style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }}>
                      {REVIEW_TYPES.map((type) => (
                        <option key={type} value={type} disabled={existingReviewTypes.has(type)}>
                          {formatReviewType(type)}{existingReviewTypes.has(type) ? ' (đã tồn tại)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="registration-end-date" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Ngày cuối đăng ký (Thứ 4)</label>
                    <input id="registration-end-date" required type="date" className="form-input" value={formData.registrationEndDate} onChange={handleRegistrationEndDateChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label htmlFor="start-date-round" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Bắt đầu chấm (Thứ 2)</label>
                      <input id="start-date-round" required readOnly type="date" className="form-input" value={formData.startDate} style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC' }} />
                    </div>
                    <div>
                      <label htmlFor="end-date-round" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Kết thúc chấm (Thứ 7)</label>
                      <input id="end-date-round" required readOnly type="date" className="form-input" value={formData.endDate} style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#F8FAFC' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} color="#F26522" />
                    <span>* Lịch chấm bắt đầu sau ngày cuối đăng ký đúng 5 ngày và kéo dài từ Thứ 2 đến Thứ 7.</span>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={availableReviewTypes.length === 0} style={{ width: '100%' }}>Tạo Đợt Review & Tiếp tục <ArrowRight size={16} /></button>
                </form>
              </div>
              <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#475569' }}>Các đợt đã tạo cho học kỳ này</h3>
                {rounds.length === 0 ? <p style={{ color: '#94A3B8' }}>Chưa có đợt nào</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {rounds.map(r => {
                      const isSelected = selectedRound?.id === r.id;
                      const statusMeta = getRoundStatusMeta(r.status);
                      const isOpen = statusMeta.isOpen;
                      const canOpenRegistration = canOpenRoundRegistration(r.status);
                      return (
                        <div key={r.id} style={{ padding: '1rem', background: isSelected ? '#EEF2FF' : '#F8FAFC', borderRadius: '12px', border: isSelected ? '2px solid #4F46E5' : '1px solid #E2E8F0', transition: 'all 0.2s' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                            <div>
                              <p style={{ fontWeight: 750, fontSize: '1rem', color: isSelected ? '#4F46E5' : '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                Đợt {formatReviewType(r.type)}
                              </p>
                              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0' }}>Đăng ký đến {getRegistrationEndDate(r)}</p>
                              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.15rem 0 0' }}>Lịch chấm: {r.weekStartDate} đến {r.weekEndDate}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                              <span className="badge" style={{
                                background: statusMeta.badgeBackground,
                                color: statusMeta.badgeColor,
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '12px'
                              }}>
                                {statusMeta.badgeLabel}
                              </span>
                              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>{r.registrationCount || 0} nhóm</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #CBD5E1', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setSelectedRound(r)} disabled={isSelected}>
                              {isSelected ? 'Đang chọn' : 'Chọn đợt'}
                            </button>
                            {canOpenRegistration && (
                              <button
                                type="button"
                                className="btn"
                                onClick={(e) => handleToggleRoundStatus(r, 1, e)}
                                disabled={loading}
                                style={{ background: '#10B981', color: 'white', padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 750, borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              >
                                <Unlock size={14} /> Mở Khóa Đăng Ký
                              </button>
                            )}
                            {isOpen && (
                              <button
                                type="button"
                                className="btn"
                                onClick={(e) => handleToggleRoundStatus(r, 2, e)}
                                disabled={loading}
                                style={{ background: '#EF4444', color: 'white', padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 750, borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                              >
                                <Lock size={14} /> Khóa Đăng Ký
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {selectedRound && (
                      <button type="button" className="btn btn-secondary" onClick={() => handleStepClick(2)} style={{ marginTop: '0.5rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700 }}>
                        <span>Sang Bước 2 với đợt đang chọn: {formatReviewType(selectedRound.type)}</span>
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Lecturers & Students */}
        {activeStep === 2 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            {(!selectedRound || rounds.length === 0) && (
              <div style={{ padding: '3rem' }}>
                <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', color: '#0F172A', marginBottom: '0.5rem' }}>Chưa tạo hoặc chưa chọn đợt review nào</h3>
                <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>Vui lòng quay lại Bước 1 để thiết lập đợt review trước khi mở đăng ký.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActiveStep(1)}>Quay lại Bước 1: Tạo đợt</button>
              </div>
            )}
            {selectedRound && rounds.length > 0 && (
              <>
                <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Đang xử lý đợt: {selectedRound.type} ({selectedRound.weekStartDate} đến {selectedRound.weekEndDate})
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>Bước 2: Mở / Khóa Đăng ký cho Giảng viên & Sinh viên</h2>
                
                {/* Status Alert Box */}
                <RoundStatusPanel status={selectedRound.status} />

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
                  <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', width: '220px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <Users size={32} color="#4F46E5" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>{boardData.registeredLecturersCount} / {boardData.lecturersCount}</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 650 }}>Giảng viên đã nộp chính thức</p>
                    {boardData.draftLecturersCount > 0 && (
                      <p style={{ fontSize: '0.78rem', color: '#D97706', margin: '0.35rem 0 0', fontWeight: 650 }}>{boardData.draftLecturersCount} giảng viên mới lưu nháp</p>
                    )}
                  </div>
                  <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', width: '220px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                    <Users size={32} color="#F26522" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>{boardData.registeredGroupsCount}</p>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 650 }}>Nhóm đã đăng ký</p>
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {canOpenRoundRegistration(selectedRound.status) && (
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => handleToggleRoundStatus(selectedRound, 1, e)}
                      disabled={loading}
                      style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', fontWeight: 800, borderRadius: '12px', background: '#10B981', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', cursor: 'pointer' }}
                    >
                      <Unlock size={18} />
                      <span>Mở Khóa Đăng Ký (Open)</span>
                    </button>
                  )}

                  {(selectedRound.status === 'Open' || selectedRound.status === 1) && (
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => handleToggleRoundStatus(selectedRound, 2, e)}
                      disabled={loading}
                      style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', fontWeight: 800, borderRadius: '12px', background: '#EF4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', cursor: 'pointer' }}
                    >
                      <Lock size={18} />
                      <span>Khóa Đăng Ký (Closed)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleLockRegistrationAndProceed}
                    disabled={loading}
                    style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                  >
                    <span>{isRoundPublished(selectedRound.status) ? 'Xem Phân công' : 'Khóa & Chuyển sang Phân công'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: Matching */}
        {activeStep === 3 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            {(!selectedRound || rounds.length === 0) && (
              <div style={{ padding: '3rem' }}>
                <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', color: '#0F172A', marginBottom: '0.5rem' }}>Chưa có đợt review nào được chọn</h3>
                <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>Vui lòng thiết lập đợt review ở Bước 1 trước khi chạy thuật toán phân công.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActiveStep(1)}>Quay lại Bước 1</button>
              </div>
            )}
            {selectedRound && rounds.length > 0 && (
              <>
                <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Đang xử lý đợt: {selectedRound.type} ({selectedRound.weekStartDate} đến {selectedRound.weekEndDate})
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0F172A' }}>Bước 3: Thuật toán Phân công Lịch Review</h2>
                {isRoundPublished(selectedRound.status) ? (
                  <div style={{ background: '#EFF6FF', borderRadius: '12px', border: '1px solid #7DD3FC', padding: '2.5rem', maxWidth: '540px', margin: '0 auto 2rem' }}>
                    <CheckCircle2 size={48} color="#0284C7" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ fontSize: '1.1rem', color: '#075985', marginBottom: '0.5rem' }}>Phân công đã được công bố</h3>
                    <p style={{ fontSize: '0.9rem', color: '#0369A1', margin: 0, lineHeight: 1.6 }}>
                      Lịch review đã được công bố chính thức. Không thể chạy lại Auto-Match hoặc thay đổi kết quả phân công.
                    </p>
                  </div>
                ) : (
                  <>
                    <p style={{ color: '#475569', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>Thuật toán sẽ tự động khớp các slot giảng viên và nhóm sinh viên đã đăng ký để tạo lịch tối ưu (tối đa 3 nhóm/slot).</p>

                    <div style={{ background: '#F8FAFC', borderRadius: '12px', border: `1px dashed ${boardData.registeredLecturersCount >= reviewersPerSession ? '#CBD5E1' : '#F59E0B'}`, padding: '2.5rem', maxWidth: '540px', margin: '0 auto 2rem' }}>
                      {boardData.registeredLecturersCount >= reviewersPerSession ? <Zap size={48} color="#D97706" style={{ margin: '0 auto 1rem' }} /> : <AlertCircle size={48} color="#D97706" style={{ margin: '0 auto 1rem' }} />}
                      <h3 style={{ fontSize: '1.1rem', color: '#0F172A', marginBottom: '0.5rem' }}>{boardData.registeredLecturersCount >= reviewersPerSession ? 'Sẵn sàng chạy thuật toán' : 'Chưa đủ đăng ký slot'}</h3>
                      <label style={{ display: 'block', maxWidth: '260px', margin: '1rem auto', textAlign: 'left', color: '#334155', fontSize: '0.85rem', fontWeight: 700 }}>
                        Số giảng viên trong mỗi ca
                        <input
                          type="number"
                          min="2"
                          step="1"
                          value={reviewersPerSession}
                          onChange={(event) => setReviewersPerSession(Math.max(2, Number.parseInt(event.target.value, 10) || 2))}
                          style={{ width: '100%', marginTop: '0.4rem', padding: '0.7rem 0.8rem', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#FFFFFF' }}
                        />
                      </label>
                      <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        {boardData.registeredLecturersCount >= reviewersPerSession
                          ? `Hiện có ${boardData.registeredGroupsCount} nhóm chờ phân công và ${boardData.registeredLecturersCount} giảng viên đã nộp đăng ký. Mỗi ca sẽ có ${reviewersPerSession} giảng viên.`
                          : `Cần ít nhất ${reviewersPerSession} giảng viên nộp đăng ký slot chính thức. Hiện có ${boardData.registeredLecturersCount} giảng viên đã nộp${boardData.draftLecturersCount > 0 ? `; ${boardData.draftLecturersCount} giảng viên mới lưu nháp` : ''}. Hãy mở lại đăng ký và yêu cầu giảng viên bấm “Nộp chính thức”.`}
                      </p>
                      <button type="button" className="btn btn-primary" onClick={handleMatch} disabled={loading || boardData.registeredLecturersCount < reviewersPerSession} style={{ padding: '0.75rem 2rem', fontSize: '1rem', background: '#4F46E5', opacity: boardData.registeredLecturersCount < reviewersPerSession ? 0.5 : 1, cursor: boardData.registeredLecturersCount < reviewersPerSession ? 'not-allowed' : 'pointer' }}>
                        <Play size={18} fill="white" /> {loading ? 'Đang chạy Auto-Match...' : boardData.registeredLecturersCount < reviewersPerSession ? 'Chưa thể Auto-Match' : 'Chạy Auto-Match'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 4: Publish */}
        {activeStep === 4 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            {(!selectedRound || rounds.length === 0) && (
              <div style={{ padding: '3rem' }}>
                <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', color: '#0F172A', marginBottom: '0.5rem' }}>Chưa chọn đợt review</h3>
                <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>Vui lòng thực hiện từ Bước 1.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActiveStep(1)}>Quay lại Bước 1</button>
              </div>
            )}
            {selectedRound && rounds.length > 0 && boardData.sessions.length === 0 && (
              <div style={{ padding: '3rem' }}>
                <AlertCircle size={48} color="#F59E0B" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', color: '#0F172A', marginBottom: '0.5rem' }}>Chưa có ca review nào được phân công</h3>
                <p style={{ color: '#64748B', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                  Đợt {selectedRound.type} hiện chưa có dữ liệu ca review. Vui lòng quay lại Bước 3 và bấm "Chạy Auto-Match" trước khi công bố lịch.
                </p>
                <button type="button" className="btn btn-primary" onClick={() => setActiveStep(3)}>Quay lại Bước 3: Phân công</button>
              </div>
            )}
            {selectedRound && rounds.length > 0 && boardData.sessions.length > 0 && (
              <>
                <div style={{ display: 'inline-block', background: '#EEF2FF', color: '#4F46E5', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Đang xử lý đợt: {selectedRound.type} ({selectedRound.weekStartDate} đến {selectedRound.weekEndDate})
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: '#0F172A' }}>Bước 4: Publish Lịch & Công bố</h2>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '2rem', maxWidth: '540px', margin: '0 auto 2rem' }}>
                  <CheckCircle2 size={48} color="#10B981" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#065F46', marginBottom: '0.5rem' }}>Phân công hoàn tất</h3>
                  {(() => {
                    const sessionsCount = boardData.sessions.length;
                    const assignedGroupsCount = new Set(boardData.sessions.filter(s => s.groupId).map(s => s.groupId)).size;
                    const assignedLecturersCount = new Set(boardData.sessions.flatMap(s => s.reviewerIds || [])).size;
                    return (
                      <p style={{ color: '#047857', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                        Đã phân {assignedGroupsCount} nhóm vào {sessionsCount} ca review với {assignedLecturersCount} giảng viên tham gia nhận xét.
                      </p>
                    );
                  })()}
                </div>

                <button type="button" className="btn btn-success" onClick={handlePublish} disabled={loading} style={{ padding: '0.75rem 2rem', fontSize: '1rem', background: '#10B981', color: 'white' }}>
                  <CheckSquare size={18} /> {loading ? 'Đang công bố...' : 'Công bố Lịch Chính thức'}
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ReviewManagementPage;

