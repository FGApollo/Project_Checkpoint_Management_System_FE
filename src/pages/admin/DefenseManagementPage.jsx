import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Gavel, Plus, Users, ShieldAlert, CheckCircle, AlertCircle, RefreshCw, Calendar, ArrowRight, Layers } from 'lucide-react';

const DefenseManagementPage = () => {
  const [activeTab, setActiveTab] = useState('rounds');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Defense Rounds State
  const [rounds, setRounds] = useState([]);
  const [showCreateRound, setShowCreateRound] = useState(false);
  const [roundCode, setRoundCode] = useState('Def1-Su26');
  const [roundName, setRoundName] = useState('First Defense Round Summer 2026');
  const [roundSemesterId, setRoundSemesterId] = useState(1);
  const [roundType, setRoundType] = useState(0); // CouncilType enum (0=Standard 5 members, 1=Reduced 3 members)
  const [roundStart, setRoundStart] = useState('2026-07-01');
  const [roundEnd, setRoundEnd] = useState('2026-07-15');

  // Defense Board / Council State
  const [boardCode, setBoardCode] = useState('Council-01');
  const [boardSemesterId, setBoardSemesterId] = useState(1);
  const [boardType, setBoardType] = useState(0); // 0=Standard, 1=Reduced
  const [chairmanId, setChairmanId] = useState(1);
  const [secretaryId, setSecretaryId] = useState(2);
  const [memberIdsStr, setMemberIdsStr] = useState('3, 4, 5');

  // Add Board Member State
  const [targetCouncilId, setTargetCouncilId] = useState(1);
  const [addLecturerId, setAddLecturerId] = useState(3);
  const [addMemberRole, setAddMemberRole] = useState(2); // CouncilMemberRole enum: 0=Chairman, 1=Secretary, 2=Member

  // Assign Session State
  const [sessCouncilId, setSessCouncilId] = useState(1);
  const [sessGroupId, setSessGroupId] = useState(1);
  const [sessDate, setSessDate] = useState('2026-07-10');
  const [sessSlot, setSessSlot] = useState(1);
  const [sessRoom, setSessRoom] = useState('BE-401');

  const fetchRounds = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/defense-management/rounds');
      setRounds(Array.isArray(response.data) ? response.data : (response.data?.items || []));
    } catch (err) {
      setError('Failed to fetch defense rounds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rounds') fetchRounds();
  }, [activeTab]);

  const handleRoundStartChange = (e) => {
    const val = e.target.value;
    setRoundStart(val);
    if (val) {
      const d = new Date(val);
      d.setDate(d.getDate() + 6);
      setRoundEnd(d.toISOString().split('T')[0]);
    }
  };

  const handleCreateRound = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!roundStart || !roundEnd) {
      setError('Vui lòng chọn đầy đủ Ngày bắt đầu và Ngày kết thúc.');
      return;
    }
    const start = new Date(roundStart);
    const end = new Date(roundEnd);
    if (end < start) {
      setError('Ngày kết thúc không được nhỏ hơn Ngày bắt đầu.');
      return;
    }
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays !== 6) {
      setError(`Ràng buộc: 1 đợt có độ dài đúng 6 ngày (Hiện tại từ ${roundStart} đến ${roundEnd} là ${diffDays} ngày).`);
      return;
    }
    try {
      await api.post('/defense-management/rounds', {
        code: roundCode,
        name: roundName,
        semesterId: Number(roundSemesterId),
        type: Number(roundType),
        startDate: roundStart,
        endDate: roundEnd
      });
      setSuccess('Defense round created successfully.');
      setShowCreateRound(false);
      fetchRounds();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create defense round.');
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const memberIds = memberIdsStr.split(',').map((id) => Number(id.trim())).filter((id) => !isNaN(id) && id > 0);
      const response = await api.post('/defense-management/boards', {
        code: boardCode,
        semesterId: Number(boardSemesterId),
        type: Number(boardType),
        chairmanId: Number(chairmanId),
        secretaryId: Number(secretaryId),
        memberLecturerIds: memberIds
      });
      setSuccess(`Defense Council / Board '${boardCode}' (ID: #${response.data.id || 'new'}) established successfully!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create defense board. Check that all Lecturer IDs exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post(`/defense-management/boards/${targetCouncilId}/members`, {
        lecturerId: Number(addLecturerId),
        role: Number(addMemberRole)
      });
      setSuccess(`Lecturer #${addLecturerId} successfully added to Council #${targetCouncilId}!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member to council.');
    }
  };

  const handleAssignSession = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/defense-management/sessions', {
        code: `DEF_${sessGroupId}_${sessSlot}_${Date.now()}`,
        defenseRoundId: Number(rounds[0]?.id || 1),
        councilId: Number(sessCouncilId),
        groupId: Number(sessGroupId),
        sessionDate: sessDate,
        slot: Number(sessSlot),
        room: sessRoom
      });
      setSuccess(`Project Group #${sessGroupId} successfully assigned to Council #${sessCouncilId} in Room ${sessRoom}!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Assignment rejected due to non-negotiable supervisor conflict rules or council capacity restrictions!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Quản lý Hội đồng & Lịch Bảo vệ Checkpoint</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Thiết lập các đợt bảo vệ, thành lập hội đồng 5 thành viên hoặc 3 thành viên, và phân công ca bảo vệ checkpoint.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'rounds' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('rounds')}
            style={activeTab !== 'rounds' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Calendar size={16} />
            <span>Các đợt bảo vệ</span>
          </button>
          <button
            className={`btn ${activeTab === 'boards' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('boards')}
            style={activeTab !== 'boards' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Gavel size={16} />
            <span>Thành lập Hội đồng</span>
          </button>
          <button
            className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('members')}
            style={activeTab !== 'members' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Users size={16} />
            <span>Thêm Thành viên</span>
          </button>
          <button
            className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('sessions')}
            style={activeTab !== 'sessions' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Layers size={16} />
            <span>Phân công Lịch bảo vệ</span>
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
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* DEFENSE ROUNDS TAB */}
      {activeTab === 'rounds' && (
        <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>Danh sách Các đợt Bảo vệ</h3>
            <button className="btn btn-primary" onClick={() => setShowCreateRound(true)}>
              <Plus size={16} />
              <span>Tạo Đợt Bảo vệ</span>
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Đợt</th>
                  <th>Mã Đợt</th>
                  <th>Tên Đợt Bảo vệ</th>
                  <th>Cơ cấu Hội đồng</th>
                  <th>Thời gian diễn ra</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748B' }}>Chưa có đợt bảo vệ nào được thiết lập. Vui lòng bấm 'Tạo Đợt Bảo vệ'.</td></tr>
                ) : (
                  rounds.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: '#0F172A' }}>#{r.id}</td>
                      <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>{r.code}</span></td>
                      <td style={{ fontWeight: 700, color: '#0F172A' }}>{r.name}</td>
                      <td style={{ color: '#475569' }}>{r.type === 0 || r.type === 'Standard' ? 'Hội đồng 5 thành viên (Tiêu chuẩn)' : 'Hội đồng 3 thành viên (Rút gọn)'}</td>
                      <td style={{ color: '#64748B' }}>{r.startDate} &rarr; {r.endDate}</td>
                      <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>{r.status || 'Đã lên lịch'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ESTABLISH COUNCILS TAB */}
      {activeTab === 'boards' && (
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
            <Gavel size={22} color="#F26522" />
            <span>Thành lập Hội đồng Bảo vệ (`POST /boards`)</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            Hội đồng tiêu chuẩn gồm 5 thành viên (Chủ tịch, Thư ký và 3 Ủy viên). Hội đồng rút gọn gồm 3 thành viên (Chủ tịch, Thư ký và 1 Ủy viên).
          </p>

          <form onSubmit={handleCreateBoard}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mã Hội đồng</label>
                <input type="text" className="form-input" value={boardCode} onChange={(e) => setBoardCode(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Học kỳ</label>
                <input type="number" className="form-input" value={boardSemesterId} onChange={(e) => setBoardSemesterId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Cơ cấu Số lượng Thành viên</label>
              <select className="form-select" value={boardType} onChange={(e) => setBoardType(Number(e.target.value))} style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}>
                <option value={0}>Hội đồng Tiêu chuẩn (5 Thành viên: Chủ tịch, Thư ký + 3 Ủy viên)</option>
                <option value={1}>Hội đồng Rút gọn (3 Thành viên: Chủ tịch, Thư ký + 1 Ủy viên)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Giảng viên (Chủ tịch)</label>
                <input type="number" className="form-input" value={chairmanId} onChange={(e) => setChairmanId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Giảng viên (Thư ký)</label>
                <input type="number" className="form-input" value={secretaryId} onChange={(e) => setSecretaryId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Danh sách ID Ủy viên (cách nhau bởi dấu phẩy)</label>
              <input
                type="text"
                className="form-input"
                value={memberIdsStr}
                onChange={(e) => setMemberIdsStr(e.target.value)}
                placeholder="3, 4, 5"
                required
                style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', display: 'block' }}>
                Với hội đồng 5 thành viên, nhập 3 ID giảng viên ủy viên (ví dụ: 3, 4, 5).
              </span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem', marginTop: '0.75rem', fontSize: '1rem' }}>
              <span>Chính thức Thành lập Hội đồng</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      )}

      {/* ADD MEMBER TAB */}
      {activeTab === 'members' && (
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '560px', margin: '0 auto', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0F172A' }}>Thêm / Cập nhật Thành viên Hội đồng</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            Thêm trực tiếp một giảng viên vào hội đồng đã thành lập kèm vai trò cụ thể (`POST /boards/{councilId}/members`).
          </p>

          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Hội đồng mục tiêu</label>
              <input type="number" className="form-input" value={targetCouncilId} onChange={(e) => setTargetCouncilId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Giảng viên</label>
              <input type="number" className="form-input" value={addLecturerId} onChange={(e) => setAddLecturerId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Vai trò trong Hội đồng</label>
              <select className="form-select" value={addMemberRole} onChange={(e) => setAddMemberRole(Number(e.target.value))} style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}>
                <option value={0}>Chủ tịch Hội đồng (Quyền mở/đóng ca chấm)</option>
                <option value={1}>Thư ký Hội đồng (Tổng hợp hồ sơ)</option>
                <option value={2}>Ủy viên Hội đồng (Chấm điểm)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem' }}>
              <span>Thêm Thành viên vào Hội đồng</span>
            </button>
          </form>
        </div>
      )}

      {/* ASSIGN SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} color="#EF4444" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>Phân công Lịch Bảo vệ cho Nhóm Checkpoint</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            Phân công nhóm checkpoint vào hội đồng bảo vệ (`POST /defense-management/sessions`). Hệ thống tự động kiểm tra và ngăn chặn tuyệt đối xung đột giảng viên hướng dẫn (GVHD không được tham gia hội đồng chấm nhóm của mình).
          </p>

          <form onSubmit={handleAssignSession}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Hội đồng</label>
                <input type="number" className="form-input" value={sessCouncilId} onChange={(e) => setSessCouncilId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Nhóm Checkpoint</label>
                <input type="number" className="form-input" value={sessGroupId} onChange={(e) => setSessGroupId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày Bảo vệ</label>
                <input type="date" className="form-input" value={sessDate} onChange={(e) => setSessDate(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ca học (1-8)</label>
                <input type="number" className="form-input" value={sessSlot} onChange={(e) => setSessSlot(e.target.value)} min="1" max="8" required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Phòng bảo vệ</label>
                <input type="text" className="form-input" value={sessRoom} onChange={(e) => setSessRoom(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem', marginTop: '0.75rem', fontSize: '1rem' }}>
              <span>Phân công Lịch Bảo vệ & Kiểm tra Xung đột</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Create Round Modal */}
      {showCreateRound && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A' }}>Khởi tạo Đợt Bảo vệ Mới</h3>
            <form onSubmit={handleCreateRound}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mã Đợt</label>
                <input type="text" className="form-input" value={roundCode} onChange={(e) => setRoundCode(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Tên Đợt Bảo vệ</label>
                <input type="text" className="form-input" value={roundName} onChange={(e) => setRoundName(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Học kỳ</label>
                  <input type="number" className="form-input" value={roundSemesterId} onChange={(e) => setRoundSemesterId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Cơ cấu Hội đồng</label>
                  <select className="form-select" value={roundType} onChange={(e) => setRoundType(Number(e.target.value))} style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}>
                    <option value={0}>Tiêu chuẩn (5 Thành viên)</option>
                    <option value={1}>Rút gọn (3 Thành viên)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày bắt đầu</label>
                  <input type="date" className="form-input" value={roundStart} onChange={handleRoundStartChange} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày kết thúc</label>
                  <input type="date" className="form-input" value={roundEnd} onChange={(e) => setRoundEnd(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateRound(false)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>Hủy</button>
                <button type="submit" className="btn btn-primary">Tạo Đợt Bảo vệ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefenseManagementPage;
