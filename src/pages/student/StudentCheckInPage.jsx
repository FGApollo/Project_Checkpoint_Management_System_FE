import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, PenLine, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { PageSkeleton } from '../../components/common/Skeleton';

const formatDateTime = (value) => value
  ? new Date(value).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })
  : '—';

const StudentCheckInPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busySessionId, setBusySessionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCheckIns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/student-review/check-ins');
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể tải danh sách phiên Review cần ký xác nhận.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCheckIns(); }, [fetchCheckIns]);

  const handleConfirm = async (session) => {
    if (session.confirmedAt || !session.canConfirm || busySessionId) return;
    if (!window.confirm(`Bạn xác nhận đã tham dự phiên ${session.sessionCode}? Chữ ký điện tử này không thể thu hồi.`)) return;
    setBusySessionId(session.sessionId);
    setError('');
    setSuccess('');
    try {
      const response = await api.post(`/student-review/check-ins/${session.sessionId}`);
      setSessions((current) => current.map((item) =>
        item.sessionId === session.sessionId ? response.data : item));
      setSuccess(`Đã ký xác nhận tham dự ${session.sessionCode}. Giảng viên có thể xem trạng thái này.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Không thể ký xác nhận phiên Review.');
    } finally {
      setBusySessionId(null);
    }
  };

  if (loading && sessions.length === 0) return <PageSkeleton cards={3} rows={5} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Ký xác nhận tham dự Review</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>
            Mỗi sinh viên tự tích vào ô xác nhận. Hệ thống lưu thời gian ký và hiển thị cho giảng viên phụ trách.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={fetchCheckIns} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Làm mới
        </button>
      </div>

      {error && <div role="alert" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', display: 'flex', gap: '0.5rem' }}><AlertCircle size={18} />{error}</div>}
      {success && <div role="status" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '10px', background: '#ECFDF5', color: '#047857', display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={18} />{success}</div>}

      <div className="glass-card" style={{ padding: '1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: '#0F172A' }}>
          <ShieldCheck size={21} color="#F26522" />
          <strong>Chữ ký tham dự cá nhân</strong>
        </div>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Phiên Review</th><th>Thời gian</th><th>Phòng</th><th>Trạng thái phiên</th><th>Xác nhận của bạn</th></tr></thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Bạn chưa có lịch Review được công bố.</td></tr>
              ) : sessions.map((session) => {
                const confirmed = Boolean(session.confirmedAt);
                const busy = busySessionId === session.sessionId;
                return (
                  <tr key={session.sessionId}>
                    <td><strong>{session.sessionCode}</strong><br /><small>{session.type}</small></td>
                    <td><CalendarCheck size={14} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />{formatDateTime(session.sessionDate)}<br /><small>Ca {session.slot}</small></td>
                    <td>{session.room}</td>
                    <td><span className="badge badge-info">{session.groupStatus}</span></td>
                    <td>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: session.canConfirm && !busy ? 'pointer' : 'default' }}>
                        <input
                          type="checkbox"
                          checked={confirmed}
                          disabled={confirmed || !session.canConfirm || busy}
                          onChange={() => handleConfirm(session)}
                          aria-label={`Ký xác nhận phiên ${session.sessionCode}`}
                          style={{ width: '20px', height: '20px', accentColor: '#10B981' }}
                        />
                        <span>
                          {confirmed ? (
                            <><CheckCircle2 size={15} style={{ verticalAlign: 'middle', marginRight: '0.3rem', color: '#10B981' }} />Đã ký lúc {formatDateTime(session.confirmedAt)}</>
                          ) : (
                            <><PenLine size={15} style={{ verticalAlign: 'middle', marginRight: '0.3rem', color: '#F26522' }} />Tích để ký xác nhận</>
                          )}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentCheckInPage;

