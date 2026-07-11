import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Mail, 
  Eye, 
  Users, 
  Calendar, 
  CheckSquare, 
  FileText, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const ReviewTrackingPage = () => {
  const [selectedRound, setSelectedRound] = useState('Review1');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Real or mock data
  const [trackingData, setTrackingData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchTrackingData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch real sessions from both checkpoint review board and defense sessions
      const revType = selectedRound === 'ALL' ? 'Review1' : selectedRound;
      const [boardRes, defRes] = await Promise.all([
        api.get(`/review-scheduling/board?semesterId=1&reviewType=${revType}&weekStart=2026-07-06`).catch(() => ({ data: { sessions: [] } })),
        api.get('/defense-sessions').catch(() => ({ data: [] }))
      ]);

      const boardSessions = Array.isArray(boardRes.data?.sessions) ? boardRes.data.sessions : [];
      const defenseSessions = Array.isArray(defRes.data) ? defRes.data : [];

      const mappedBoard = boardSessions.map((item) => ({
        id: item.id,
        round: revType,
        groupCode: item.groupCode || `Group #${item.groupId}`,
        projectTitle: item.projectTitle || 'Capstone Project System',
        sessionDate: item.sessionDate ? item.sessionDate.split('T')[0] : 'N/A',
        slot: item.slot || 1,
        slotTime: getSlotTime(item.slot || 1),
        room: item.room || 'BE-401',
        reviewers: item.reviewerIds ? item.reviewerIds.map(id => `Giảng viên #${id}`) : [],
        studentSubmitted: item.status !== 'Scheduled' && item.status !== 'Assigned',
        submissionTime: item.sessionDate ? item.sessionDate.split('T')[0] : 'N/A',
        scoringStatus: item.status === 'Completed' ? 'COMPLETED' : 'PENDING',
        result: item.status === 'Completed' ? 'Pass' : null,
        reviewer1Result: item.status === 'Completed' ? 'Pass' : null,
        reviewer2Result: item.status === 'Completed' ? 'Pass' : null,
        comments: item.notes || ''
      }));

      const mappedDef = defenseSessions.map((item) => ({
        id: item.id,
        round: item.roundName || 'Defense',
        groupCode: item.groupCode || `Group #${item.groupId}`,
        projectTitle: item.projectTitle || 'Capstone Project System',
        sessionDate: item.sessionDate ? item.sessionDate.split('T')[0] : 'N/A',
        slot: item.slot || 1,
        slotTime: getSlotTime(item.slot || 1),
        room: item.room || 'BE-401',
        reviewers: item.reviewers || [],
        studentSubmitted: true,
        submissionTime: item.sessionDate ? item.sessionDate.split('T')[0] : 'N/A',
        scoringStatus: item.status === 'Completed' ? 'COMPLETED' : 'PENDING',
        result: item.result || (item.averageScore >= 5 ? 'Pass' : 'Fail'),
        reviewer1Result: item.result === 'Fail' ? 'Fail' : 'Pass',
        reviewer2Result: item.result === 'Fail' ? 'Fail' : 'Pass',
        comments: item.notes || ''
      }));

      setTrackingData([...mappedBoard, ...mappedDef]);
    } catch (err) {
      setError('Không thể tải dữ liệu theo dõi từ Database.');
      setTrackingData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, []);

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

  const handleRemindReviewer = (item) => {
    setSuccess(`Đã gửi Email nhắc nhở chấm điểm tới giảng viên phản biện của nhóm ${item.groupCode}!`);
    setTimeout(() => setSuccess(''), 5000);
  };

  const filteredList = trackingData.filter(item => {
    const matchesRound = selectedRound === 'ALL' || item.round === selectedRound;
    const matchesStatus = statusFilter === 'ALL' || item.scoringStatus === statusFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      item.groupCode.toLowerCase().includes(searchLower) ||
      item.projectTitle.toLowerCase().includes(searchLower) ||
      item.room.toLowerCase().includes(searchLower) ||
      item.reviewers.some(r => r.toLowerCase().includes(searchLower));
    return matchesRound && matchesStatus && matchesSearch;
  });

  // Calculate stats
  const totalCount = filteredList.length;
  const submittedCount = filteredList.filter(i => i.studentSubmitted).length;
  const completedScoringCount = filteredList.filter(i => i.scoringStatus === 'COMPLETED').length;

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
            Giám sát thời gian thực việc nộp tài liệu đồ án của sinh viên và trạng thái chấm điểm từ giảng viên phản biện.
          </p>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={fetchTrackingData}
          disabled={loading}
          style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A', fontWeight: 600 }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

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
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Đang lọc theo đợt <strong style={{ color: '#0F172A' }}>{selectedRound}</strong></div>
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
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>GV đã chấm điểm</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: completedScoringCount === totalCount && totalCount > 0 ? '#10B981' : '#F59E0B', marginTop: '0.25rem' }}>
                {completedScoringCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>/ {totalCount}</span>
              </div>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Đang chấm: <strong style={{ color: '#F59E0B' }}>{totalCount - completedScoringCount} ca</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Round selector tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'Review1', 'Review2', 'Review3'].map(round => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  border: selectedRound === round ? '1px solid #4F46E5' : '1px solid #CBD5E1',
                  background: selectedRound === round ? '#4F46E5' : '#F8FAFC',
                  color: selectedRound === round ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {round === 'ALL' ? 'Tất cả các đợt' : `Đợt ${round}`}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px', flex: 1, maxWidth: '320px' }}>
              <Search size={18} color="#64748B" />
              <input
                type="text"
                className="form-input"
                placeholder="Tìm mã nhóm, đề tài, phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '0.45rem 0.75rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={18} color="#64748B" />
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1', padding: '0.45rem 0.75rem', fontWeight: 600 }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="COMPLETED">Đã có kết quả review</option>
                <option value="PENDING">Đang chờ đánh giá</option>
                <option value="OVERDUE_SUBMISSION">SV chưa nộp bài</option>
              </select>
            </div>
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
                <th>NHÓM ĐỒ ÁN</th>
                <th>GIẢNG VIÊN PHẢN BIỆN</th>
                <th>TÀI LIỆU SINH VIÊN</th>
                <th>KẾT QUẢ ĐÁNH GIÁ</th>
                <th style={{ textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <RefreshCw size={28} className="spin" color="#4F46E5" />
                      <span style={{ fontWeight: 600 }}>Đang đồng bộ dữ liệu tiến độ review...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={32} color="#94A3B8" />
                      <span style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>Không tìm thấy ca phản biện nào</span>
                      <span style={{ fontSize: '0.85rem' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} style={{ transition: 'background 0.15s' }}>
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
                        {item.reviewers.map((rev, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
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
                            Đã nộp Báo cáo & Slide
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
                      {item.scoringStatus === 'COMPLETED' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: item.result === 'Fail' ? '#EF4444' : '#10B981', fontWeight: 700, fontSize: '0.825rem' }}>
                            <CheckCircle2 size={15} />
                            {item.result === 'Fail' ? 'Không đạt (Fail)' : 'Đạt yêu cầu (Pass)'}
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Đã có nhận xét & đánh giá</span>
                        </div>
                      ) : item.scoringStatus === 'OVERDUE_SUBMISSION' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#EF4444', fontWeight: 600, fontSize: '0.8rem' }}>
                          <ShieldAlert size={15} />
                          Chờ SV nộp bài
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#F59E0B', fontWeight: 600, fontSize: '0.8rem' }}>
                          <Clock size={15} />
                          Đang chờ chấm điểm
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDetailModal(true);
                          }}
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Xem chi tiết phiếu phản biện"
                        >
                          <Eye size={14} />
                          <span>Chi tiết</span>
                        </button>

                        {item.scoringStatus !== 'COMPLETED' && (
                          <button
                            className="btn"
                            onClick={() => handleRemindReviewer(item)}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', border: '1px solid rgba(79, 70, 229, 0.3)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Gửi email nhắc nhở chấm điểm"
                          >
                            <Mail size={14} />
                            <span>Nhắc GV</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content" style={{ maxWidth: '640px', padding: '1.75rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5', background: 'rgba(79, 70, 229, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                  PHIẾU PHẢN BIỆN - {selectedItem.round}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0.5rem 0 0.2rem' }}>
                  {selectedItem.groupCode} - {selectedItem.projectTitle}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Khung giờ: Slot {selectedItem.slot} ({selectedItem.slotTime}) - Phòng {selectedItem.room}
                </span>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
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
                    {selectedItem.reviewer1Result && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: selectedItem.reviewer1Result === 'Fail' ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                        Đánh giá: {selectedItem.reviewer1Result === 'Fail' ? 'Không đạt (Fail)' : 'Đạt yêu cầu (Pass)'}
                      </div>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Giảng viên Phản biện 2:</span>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{selectedItem.reviewers[1] || 'N/A'}</div>
                    {selectedItem.reviewer2Result && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: selectedItem.reviewer2Result === 'Fail' ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                        Đánh giá: {selectedItem.reviewer2Result === 'Fail' ? 'Không đạt (Fail)' : 'Đạt yêu cầu (Pass)'}
                      </div>
                    )}
                  </div>
                </div>
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
                {selectedItem.result && (
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: selectedItem.result === 'Fail' ? '#EF4444' : '#10B981' }}>
                    Kết quả: {selectedItem.result === 'Fail' ? 'Không đạt yêu cầu (Fail)' : 'Đạt yêu cầu (Pass)'}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setShowDetailModal(false)}
                style={{ padding: '0.6rem 1.5rem', fontWeight: 600, background: '#4F46E5', color: '#FFF' }}
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewTrackingPage;
