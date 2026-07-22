import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { listProjectDocuments, downloadProjectDocument } from '../../services/documents';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Download,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { TableSkeletonRows } from '../../components/common/Skeleton';

const getReviewRoundLabels = (type, id) => {
  if (typeof type === 'number') {
    return {
      type: ['Review1', 'Review2', 'Review3'][type] || `Review ${type}`,
      display: ['Review 1', 'Review 2', 'Review 3'][type] || `Review ${type}`
    };
  }
  if (typeof type === 'string') {
    return { type, display: type.replace('Review', 'Review ') };
  }
  return { type: `Review #${id}`, display: `Review #${id}` };
};

const getRoundBadgeColors = (isSelected, status) => {
  if (isSelected) return { background: 'rgba(255, 255, 255, 0.22)', color: '#FFF' };
  if (status === 'Open' || status === 'Published') return { background: '#DCFCE7', color: '#15803D' };
  return { background: '#F1F5F9', color: '#64748B' };
};

const formatFileSize = (size) => {
  const bytes = Number(size || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FeedbackStatus = ({ item }) => {
  if (item.feedbackStatus === 'COMPLETED') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10B981', fontWeight: 700, fontSize: '0.825rem' }}>
          <CheckCircle2 size={15} />
          Đã hoàn thành Review
        </span>
        <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Đã ghi nhận nhận xét của giảng viên</span>
      </div>
    );
  }
  if (item.feedbackStatus === 'OVERDUE_SUBMISSION') {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#EF4444', fontWeight: 600, fontSize: '0.8rem' }}><ShieldAlert size={15} />Chờ SV nộp bài</span>;
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#F59E0B', fontWeight: 600, fontSize: '0.8rem' }}><Clock size={15} />Đang chờ giảng viên nhận xét</span>;
};

const ReviewTrackingPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  
  const [roundsList, setRoundsList] = useState([]);
  const [selectedRound, setSelectedRound] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [trackingData, setTrackingData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailDocuments, setDetailDocuments] = useState([]);
  const [detailDocumentsLoading, setDetailDocumentsLoading] = useState(false);
  const [detailDocumentsError, setDetailDocumentsError] = useState('');
  const [downloadingDocumentId, setDownloadingDocumentId] = useState(null);

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  const openDetailModal = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleDownloadDocument = async (projectDocument) => {
    setDetailDocumentsError('');
    setDownloadingDocumentId(projectDocument.id);
    try {
      const response = await downloadProjectDocument(projectDocument.id);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = projectDocument.fileName || `tai-lieu-${projectDocument.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDetailDocumentsError(err.response?.data?.error || 'Không thể tải tài liệu sinh viên đã nộp.');
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  useEffect(() => {
    if (!showDetailModal || !selectedItem?.groupId) return undefined;

    let cancelled = false;
    setDetailDocuments([]);
    setDetailDocumentsError('');
    setDetailDocumentsLoading(true);
    listProjectDocuments(selectedItem.groupId)
      .then(({ data }) => {
        if (!cancelled) setDetailDocuments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetailDocumentsError(err.response?.data?.error || 'Không thể tải danh sách tài liệu của nhóm.');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailDocumentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showDetailModal, selectedItem?.groupId]);

  useEffect(() => {
    if (!showDetailModal) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeDetailModal();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [showDetailModal]);

  const handleExportAllReports = async () => {
    setError('');
    try {
      const response = await api.get('/review-submissions/export.zip', {
        params: selectedSemesterId ? { semesterId: selectedSemesterId } : undefined,
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-review-${selectedSemesterId || 'tat-ca'}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể xuất bộ báo cáo review.');
    }
  };

  // Fetch semesters on mount
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const semRes = await api.get('/semesters?pageSize=100');
        const sems = Array.isArray(semRes.data) ? semRes.data : (semRes.data?.items || []);
        setSemesters(sems);
        if (sems.length > 0) {
          const activeSem = sems.find(s => s.isActive) || sems[0];
          setSelectedSemesterId(activeSem.id);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách kỳ học:', err);
      }
    };
    fetchSemesters();
  }, []);

  // Fetch rounds when selectedSemesterId changes
  useEffect(() => {
    if (!selectedSemesterId) return;
    const fetchRoundsForSemester = async () => {
      setLoading(true);
      try {
        const revRoundsRes = await api.get(`/review-scheduling/rounds?semesterId=${selectedSemesterId}`);
        
        const revRounds = Array.isArray(revRoundsRes.data) ? revRoundsRes.data : [];
        
        const mappedRevRounds = revRounds.map(r => {
          const weekStart = r.weekStartDate || r.startDate;
          if (!weekStart) throw new Error(`Đợt review #${r.id} thiếu ngày bắt đầu tuần.`);
          const labels = getReviewRoundLabels(r.type, r.id);
            
          return {
            id: `rev_${r.id}`,
            rawId: r.id,
            category: 'REVIEW',
            type: labels.type,
            name: r.name || `Đợt ${labels.display}`,
            weekStart,
            weekEnd: r.weekEndDate || r.endDate || '',
            status: r.status || 'Open',
            groupCount: r.registeredGroupCount || 0
          };
        });

        setRoundsList(mappedRevRounds);
        setSelectedRound('ALL');
      } catch (err) {
        console.error('Lỗi tải danh sách đợt:', err);
        setRoundsList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoundsForSemester();
  }, [selectedSemesterId]);

  const mapBoardItem = (item, roundName, lecturers = []) => ({
    id: item.id,
    groupId: item.groupId,
    key: `${item.id}-${item.groupId}`,
    round: roundName,
    groupCode: item.groupCode || `Group #${item.groupId}`,
    projectTitle: item.projectTitle || 'Báo cáo Review Checkpoint Tiến trình',
    sessionDate: item.sessionDate ? item.sessionDate.split('T')[0] : 'N/A',
    slot: item.slot || 1,
    slotTime: getSlotTime(item.slot || 1),
    room: item.room || 'BE-401',
    reviewers: item.reviewerIds ? item.reviewerIds.map((id) => {
      const lecturer = lecturers.find(candidate => Number(candidate.id) === Number(id));
      return lecturer
        ? `${lecturer.fullName} (${lecturer.code})`
        : `Giảng viên #${id}`;
    }) : [],
    studentSubmitted: false,
    submissionTime: 'N/A',
    documentCount: 0,
    feedbackStatus: item.status === 'Completed' ? 'COMPLETED' : 'PENDING',
    comments: item.notes || ''
  });

  const fetchTrackingData = async () => {
    if (!selectedSemesterId) return;
    setLoading(true);
    setError('');
    try {
      let mappedSessions = [];

      if (selectedRound === 'ALL' || typeof selectedRound !== 'object') {
        const reviewRoundsToFetch = roundsList;
        if (reviewRoundsToFetch.length === 0) {
          setTrackingData([]);
          setLoading(false);
          return;
        }

        const boardPromises = reviewRoundsToFetch.map(r =>
          api.get(`/review-scheduling/board?semesterId=${selectedSemesterId}&reviewType=${r.type}&weekStart=${r.weekStart}`)
        );

        const results = await Promise.all(boardPromises);
        
        for (let i = 0; i < reviewRoundsToFetch.length; i++) {
          const boardSessions = Array.isArray(results[i].data?.sessions) ? results[i].data.sessions : [];
          const roundName = reviewRoundsToFetch[i].name || reviewRoundsToFetch[i].type;
          const boardLecturers = Array.isArray(results[i].data?.lecturers) ? results[i].data.lecturers : [];
          mappedSessions.push(...boardSessions.map(item => mapBoardItem(item, roundName, boardLecturers)));
        }
      } else {
        if (!selectedRound.weekStart) throw new Error('Đợt review đã chọn thiếu ngày bắt đầu tuần.');
        const boardRes = await api.get(`/review-scheduling/board?semesterId=${selectedSemesterId}&reviewType=${selectedRound.type}&weekStart=${selectedRound.weekStart}`);
        const boardSessions = Array.isArray(boardRes.data?.sessions) ? boardRes.data.sessions : [];
        const boardLecturers = Array.isArray(boardRes.data?.lecturers) ? boardRes.data.lecturers : [];
        mappedSessions = boardSessions.map(item => mapBoardItem(item, selectedRound.name, boardLecturers));
      }

      const groupIds = [...new Set(mappedSessions.map(item => Number(item.groupId)).filter(Number.isFinite))];
      const documentEntries = await Promise.all(groupIds.map(async (groupId) => {
        const { data } = await listProjectDocuments(groupId);
        return [groupId, Array.isArray(data) ? data : []];
      }));
      const documentsByGroup = new Map(documentEntries);

      mappedSessions = mappedSessions.map((item) => {
        const documents = documentsByGroup.get(Number(item.groupId)) || [];
        const latestDocument = documents.reduce((latest, document) => {
          if (!latest) return document;
          return new Date(document.uploadedAt) > new Date(latest.uploadedAt) ? document : latest;
        }, null);

        return {
          ...item,
          studentSubmitted: documents.length > 0,
          documentCount: documents.length,
          submissionTime: latestDocument?.uploadedAt
            ? latestDocument.uploadedAt.split('T')[0]
            : 'N/A'
        };
      });

      setTrackingData(mappedSessions);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Không thể tải dữ liệu theo dõi từ Database.');
      setTrackingData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSemesterId) {
      fetchTrackingData();
    }
  }, [selectedSemesterId, selectedRound, roundsList]);

  const getSlotTime = (slotNum) => {
    switch (slotNum) {
      case 1: return '07:30 – 09:00';
      case 2: return '09:10 – 10:40';
      case 3: return '10:50 – 12:20';
      case 4: return '12:50 – 14:20';
      case 5: return '14:30 – 16:00';
      default: return '07:30 – 09:00';
    }
  };

  const filteredList = trackingData.filter(item => {
    const matchesRound = selectedRound === 'ALL' || typeof selectedRound !== 'object'
      ? true 
      : (item.round === selectedRound.name || item.round === selectedRound.type || item.round?.includes(selectedRound.type));
    const matchesStatus = statusFilter === 'ALL' || item.feedbackStatus === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      item.groupCode?.toLowerCase().includes(searchLower) ||
      item.projectTitle?.toLowerCase().includes(searchLower) ||
      item.room?.toLowerCase().includes(searchLower) ||
      item.reviewers?.some(r => r.toLowerCase().includes(searchLower));
    return matchesRound && matchesStatus && matchesSearch;
  });

  // Calculate stats
  const totalCount = filteredList.length;
  const submittedCount = filteredList.filter(i => i.studentSubmitted).length;
  const completedFeedbackCount = filteredList.filter(i => i.feedbackStatus === 'COMPLETED').length;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #4F46E5, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>
              <ClipboardCheck size={20} />
            </div>
            <h1 className="page-title" style={{ color: '#0F172A', margin: 0 }}>Theo dõi Review & Phản biện</h1>
          </div>
          <p className="page-subtitle" style={{ color: '#475569', margin: 0 }}>
            Giám sát việc nộp báo cáo checkpoint và trạng thái nhận xét của giảng viên sau từng buổi Review.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={handleExportAllReports} disabled={loading}>
            <FileText size={16} />
            <span>Xuất tất cả (.zip)</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchTrackingData}
            disabled={loading}
            style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Tổng ca phản biện</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>{totalCount}</div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Đang lọc theo: <strong style={{ color: '#0F172A' }}>{selectedRound === 'ALL' || typeof selectedRound !== 'object' ? 'Tất cả các đợt' : selectedRound.name}</strong>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>SV đã nộp báo cáo</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>
                {submittedCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>/ {totalCount}</span>
              </div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <FileText size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
            Tỷ lệ nộp đúng hạn: {totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0}%
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Review đã có nhận xét</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: completedFeedbackCount === totalCount && totalCount > 0 ? '#10B981' : '#F59E0B', marginTop: '0.25rem' }}>
                {completedFeedbackCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>/ {totalCount}</span>
              </div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Đang chờ nhận xét: <strong style={{ color: '#F59E0B' }}>{totalCount - completedFeedbackCount} ca</strong>
          </div>
        </div>
      </div>

      {/* Semester Selection & Dynamic Rounds List Section */}
      {(() => { return (
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', borderBottom: roundsList.length > 0 ? '1px solid #F1F5F9' : 'none', paddingBottom: roundsList.length > 0 ? '1rem' : '0', marginBottom: roundsList.length > 0 ? '1rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label htmlFor="tracking-semester-select" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Kỳ học:
              </label>
              <select
                id="tracking-semester-select"
                className="form-select"
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(Number(e.target.value))}
                style={{
                  background: '#F8FAFC',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  padding: '0.45rem 2rem 0.45rem 0.75rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  minWidth: '220px'
                }}
              >
                {semesters.map((s) => {
                  const label = `${s.name} (${s.code}) ${s.isActive ? '• [Kỳ hiện tại]' : ''}`;
                  return (
                    <option key={s.id} value={s.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <span className="badge" style={{ background: roundsList.length > 0 ? '#EEF2FF' : '#F1F5F9', color: roundsList.length > 0 ? '#4F46E5' : '#64748B', fontWeight: 700, padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
              {roundsList.length} đợt review trong kỳ
            </span>
          </div>
        </div>

        {/* Dynamic Rounds List / Selector */}
        {roundsList.length === 0 && !loading ? (
          <div style={{ padding: '1rem 1.25rem', background: '#F8FAFC', borderRadius: '10px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', flexShrink: 0 }}>
                <Calendar size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1E293B' }}>Chưa có đợt review phản biện nào được tạo cho kỳ học này</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.15rem' }}>Vui lòng chọn kỳ học khác ở danh sách trên hoặc chuyển sang trang Quản lý Đợt & Xếp lịch Review để thiết lập đợt mới.</div>
              </div>
            </div>
            <a 
              href="/admin/reviews"
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#4F46E5', 
                color: '#FFFFFF', 
                borderRadius: '8px', 
                fontWeight: 600, 
                fontSize: '0.825rem', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>Thiết lập đợt review</span>
              <ArrowRight size={14} />
            </a>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginRight: '0.25rem' }}>
                Lọc theo đợt:
              </span>
              <button
                type="button"
                onClick={() => setSelectedRound('ALL')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  border: selectedRound === 'ALL' ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                  background: selectedRound === 'ALL' ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : '#F8FAFC',
                  color: selectedRound === 'ALL' ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: selectedRound === 'ALL' ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Tất cả các đợt ({roundsList.length})</span>
              </button>

              {roundsList.map((round) => {
                const isSelected = selectedRound?.id === round.id;
                const badgeColors = getRoundBadgeColors(isSelected, round.status);
                return (
                  <button
                    type="button"
                    key={round.id}
                    onClick={() => setSelectedRound(round)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      border: isSelected ? '1.5px solid #4F46E5' : '1px solid #CBD5E1',
                      background: isSelected ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#0F172A',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{round.name}</span>
                    <span style={{
                      background: badgeColors.background,
                      color: badgeColors.color,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}>
                      {round.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      ); })()}

      {/* Search & Status Filter Section */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '240px', flex: 1, maxWidth: '400px' }}>
            <Search size={18} color="#64748B" />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm mã nhóm, đề tài, giảng viên, phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '0.5rem 0.85rem', borderRadius: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="#64748B" />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '0.5rem 0.85rem', fontWeight: 600, borderRadius: '8px' }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="COMPLETED">Đã hoàn thành và có nhận xét</option>
              <option value="PENDING">Đang chờ nhận xét</option>
              <option value="OVERDUE_SUBMISSION">SV chưa nộp bài</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>KHUNG GIỜ / PHÒNG</th>
                <th>NHÓM SINH VIÊN</th>
                <th>GIẢNG VIÊN PHẢN BIỆN</th>
                <th>BÁO CÁO CHECKPOINT</th>
                <th>TRẠNG THÁI NHẬN XÉT</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {(() => { return (<>
              {loading && <TableSkeletonRows rows={6} columns={6} />}
              {!loading && filteredList.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={32} color="#94A3B8" />
                      <span style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>Không tìm thấy ca phản biện nào</span>
                      <span style={{ fontSize: '0.85rem' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filteredList.length > 0 && (
                filteredList.map((item) => (
                  <tr key={item.key} style={{ transition: 'background 0.15s' }}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.875rem' }}>
                          Slot {item.slot} <span style={{ fontWeight: 500, color: '#64748B' }}>({item.slotTime})</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#475569' }}>
                          <span style={{ background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>Phòng {item.room}</span>
                          <span>{item.sessionDate}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 800, color: '#4F46E5', background: 'rgba(79, 70, 229, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                            {item.groupCode}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: 600 }}>({item.round})</span>
                        </div>
                        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.85rem' }}>
                          {item.projectTitle}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem' }}>
                        {item.reviewers.map((rev) => (
                          <div key={`reviewer-${rev}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366F1' }} />
                            <span>{rev}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td>
                      {item.studentSubmitted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10B981', fontWeight: 700, fontSize: '0.8rem' }}>
                            <CheckCircle2 size={15} />
                            Đã nộp {item.documentCount} tài liệu
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Lúc: {item.submissionTime}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#EF4444', fontWeight: 700, fontSize: '0.8rem' }}>
                            <AlertCircle size={15} />
                            Chưa nộp tài liệu
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>Sinh viên chưa upload file</span>
                        </div>
                      )}
                    </td>

                    <td>
                      <FeedbackStatus item={item} />
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => openDetailModal(item)}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Xem chi tiết phiếu phản biện"
                        >
                          <Eye size={14} />
                          <span>Chi tiết</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
              </>); })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && createPortal((
        <div
          className="modal-overlay animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-detail-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDetailModal();
          }}
          style={{ alignItems: 'flex-start', overflowY: 'auto', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}
        >
          <div className="modal-content" style={{ maxWidth: '720px', maxHeight: 'calc(100vh - 3rem)', padding: '1.75rem', borderRadius: '16px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', background: 'rgba(79, 70, 229, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  PHIẾU PHẢN BIỆN - {selectedItem.round}
                </span>
                <h3 id="review-detail-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.2rem' }}>
                  {selectedItem.groupCode} - {selectedItem.projectTitle}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Khung giờ: Slot {selectedItem.slot} ({selectedItem.slotTime}) - Phòng {selectedItem.room}
                </span>
              </div>
              <button 
                type="button"
                onClick={closeDetailModal}
                aria-label="Đóng chi tiết"
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Reviewer breakdown */}
              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', margin: '0 0 0.75rem' }}>HỘI ĐỒNG PHẢN BIỆN</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Giảng viên Phản biện 1:</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedItem.reviewers[0] || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Giảng viên Phản biện 2:</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedItem.reviewers[1] || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Submitted documents */}
              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', margin: '0 0 0.75rem' }}>TÀI LIỆU SINH VIÊN ĐÃ NỘP</h4>
                {detailDocumentsLoading && (
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Đang tải danh sách tài liệu...</p>
                )}
                {!detailDocumentsLoading && detailDocumentsError && (
                  <p style={{ margin: 0, color: '#EF4444', fontSize: '0.85rem', fontWeight: 600 }}>{detailDocumentsError}</p>
                )}
                {!detailDocumentsLoading && !detailDocumentsError && detailDocuments.length === 0 && (
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem', fontStyle: 'italic' }}>Nhóm chưa tải tài liệu lên hệ thống.</p>
                )}
                {!detailDocumentsLoading && detailDocuments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {detailDocuments.map((projectDocument) => (
                      <div key={projectDocument.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0F172A', overflowWrap: 'anywhere' }}>{projectDocument.fileName}</div>
                          <div style={{ marginTop: '0.2rem', fontSize: '0.75rem', color: '#64748B' }}>
                            {projectDocument.docType} · Phiên bản {projectDocument.versionNo} · {formatFileSize(projectDocument.fileSize)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleDownloadDocument(projectDocument)}
                          disabled={downloadingDocumentId === projectDocument.id}
                          style={{ flexShrink: 0, padding: '0.45rem 0.75rem', background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 700 }}
                        >
                          <Download size={15} />
                          {downloadingDocumentId === projectDocument.id ? 'Đang tải...' : 'Tải về'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', margin: '0 0 0.5rem' }}>NHẬN XÉT CỦA HỘI ĐỒNG</h4>
                <p style={{ fontSize: '0.875rem', color: '#0F172A', lineHeight: 1.5, margin: 0, fontStyle: selectedItem.comments ? 'normal' : 'italic' }}>
                  "{selectedItem.comments || 'Chưa có nhận xét nào được ghi lại.'}"
                </p>
              </div>

              {/* Status footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Trạng thái nộp bài:</span>
                  <span style={{ fontWeight: 700, color: selectedItem.studentSubmitted ? '#10B981' : '#EF4444' }}>
                    {selectedItem.studentSubmitted ? `Đã nộp (${selectedItem.submissionTime})` : 'Chưa nộp bài'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedItem.feedbackStatus === 'COMPLETED' ? '#10B981' : '#F59E0B' }}>
                  {selectedItem.feedbackStatus === 'COMPLETED' ? 'Review đã hoàn thành' : 'Đang chờ giảng viên nhận xét'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <button 
                type="button"
                className="btn btn-primary"
                onClick={closeDetailModal}
                style={{ padding: '0.6rem 1.5rem', fontWeight: 600, background: '#4F46E5', color: '#FFF' }}
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

export default ReviewTrackingPage;
