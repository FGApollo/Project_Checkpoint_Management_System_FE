import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Gavel, Plus, Users, ShieldAlert, CheckCircle, AlertCircle, Calendar, ArrowRight, Layers } from 'lucide-react';
import { PageSkeleton, TableSkeletonRows } from '../../components/common/Skeleton';
import { listDefenseBoards, loadDefenseManagementWorkspace } from '../../services/defenseManagement';

const DefenseManagementPage = () => {
  const [activeTab, setActiveTab] = useState('rounds');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Defense Rounds State
  const [rounds, setRounds] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [boards, setBoards] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [groups, setGroups] = useState([]);
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
  const [memberIds, setMemberIds] = useState([]);

  // Add Board Member State
  const [targetCouncilId, setTargetCouncilId] = useState('');
  const [addLecturerId, setAddLecturerId] = useState(3);
  const [addMemberRole, setAddMemberRole] = useState(2); // CouncilMemberRole enum: 0=Chairman, 1=Secretary, 2=Member

  // Assign Session State
  const [sessCouncilId, setSessCouncilId] = useState('');
  const [sessRoundId, setSessRoundId] = useState('');
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
      console.error(err);
      setError('Failed to fetch defense rounds.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get('/defense-sessions');
      setSessions(Array.isArray(response.data) ? response.data : (response.data?.items || []));
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể tải danh sách lịch bảo vệ.');
    }
  };

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const workspace = await loadDefenseManagementWorkspace();
        setRounds(workspace.rounds);
        setBoards(workspace.boards);
        setSessions(workspace.sessions);
        setLecturers(workspace.lecturers);
        setGroups(workspace.groups);
        if (workspace.semester?.id) {
          setRoundSemesterId(workspace.semester.id);
          setBoardSemesterId(workspace.semester.id);
        }
        if (workspace.rounds.length > 0) setSessRoundId(workspace.rounds[0].id);
        if (workspace.boards.length > 0) {
          setTargetCouncilId(workspace.boards[0].id);
          setSessCouncilId(workspace.boards[0].id);
        }
        if (workspace.lecturers.length >= 3) {
          setChairmanId(workspace.lecturers[0].id);
          setSecretaryId(workspace.lecturers[1].id);
          setMemberIds([workspace.lecturers[2].id]);
          setAddLecturerId(workspace.lecturers[2].id);
        }
        if (workspace.groups.length > 0) setSessGroupId(workspace.groups[0].id);
      } catch (err) {
        setError(err.response?.data?.error || 'Không thể tải dữ liệu quản lý hội đồng và lịch bảo vệ.');
      } finally {
        setInitialLoading(false);
      }
    };
    loadWorkspace();
  }, []);

  const refreshBoards = async () => {
    const nextBoards = await listDefenseBoards(Number(boardSemesterId));
    setBoards(nextBoards);
    if (nextBoards.length > 0) {
      setTargetCouncilId((current) => current || nextBoards[0].id);
      setSessCouncilId((current) => current || nextBoards[0].id);
    }
  };

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
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create defense round.');
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await api.post('/defense-management/boards', {
        code: boardCode,
        semesterId: Number(boardSemesterId),
        type: Number(boardType),
        chairmanId: Number(chairmanId),
        secretaryId: Number(secretaryId),
        memberLecturerIds: memberIds.map(Number)
      });
      setSuccess(`Defense Council / Board '${boardCode}' (ID: #${response.data.id || 'new'}) established successfully!`);
      await refreshBoards();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create defense board. Check that all Lecturer IDs exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const councilId = Number(targetCouncilId);
    if (!Number.isSafeInteger(councilId) || councilId <= 0) {
      setError('Council ID must be a positive integer.');
      return;
    }
    try {
      await api.post(`/defense-management/boards/${encodeURIComponent(councilId)}/members`, {
        lecturerId: Number(addLecturerId),
        role: Number(addMemberRole)
      });
      setSuccess(`Lecturer #${addLecturerId} successfully added to Council #${targetCouncilId}!`);
      await refreshBoards();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add member to council.');
    }
  };

  const handleAssignSession = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!sessRoundId || !sessCouncilId || !sessGroupId) {
      setError('Vui lòng chọn đầy đủ đợt bảo vệ, hội đồng và nhóm.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/defense-management/sessions', {
        code: `DEF_${sessGroupId}_${sessSlot}_${Date.now()}`,
        defenseRoundId: Number(sessRoundId),
        councilId: Number(sessCouncilId),
        groupId: Number(sessGroupId),
        sessionDate: sessDate,
        slot: Number(sessSlot),
        room: sessRoom
      });
      setSuccess(`Project Group #${sessGroupId} successfully assigned to Council #${sessCouncilId} in Room ${sessRoom}!`);
      await fetchSessions();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Assignment rejected due to non-negotiable supervisor conflict rules or council capacity restrictions!');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <PageSkeleton cards={3} rows={6} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Quản lý Hội đồng & Lịch Bảo vệ Checkpoint</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Thiết lập các đợt bảo vệ, thành lập hội đồng 5 thành viên hoặc 3 thành viên, và phân công ca bảo vệ checkpoint.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'rounds' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('rounds')}
            style={activeTab !== 'rounds' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Calendar size={16} />
            <span>Các đợt bảo vệ</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'boards' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('boards')}
            style={activeTab !== 'boards' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Gavel size={16} />
            <span>Thành lập Hội đồng</span>
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'members' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('members')}
            style={activeTab !== 'members' ? { background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' } : {}}
          >
            <Users size={16} />
            <span>Thêm Thành viên</span>
          </button>
          <button
            type="button"
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
            <button type="button" className="btn btn-primary" onClick={() => setShowCreateRound(true)}>
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
                {loading ? <TableSkeletonRows rows={5} columns={6} /> : rounds.length === 0 ? (
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
            <span>Thành lập Hội đồng Bảo vệ</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            Hội đồng tiêu chuẩn gồm 5 thành viên (Chủ tịch, Thư ký và 3 Ủy viên). Hội đồng rút gọn gồm 3 thành viên (Chủ tịch, Thư ký và 1 Ủy viên).
          </p>

          <form onSubmit={handleCreateBoard}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="def-boardCode" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mã Hội đồng</label>
                <input id="def-boardCode" type="text" className="form-input" value={boardCode} onChange={(e) => setBoardCode(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label htmlFor="def-boardSem" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Học kỳ</label>
                <input id="def-boardSem" type="number" className="form-input" value={boardSemesterId} onChange={(e) => setBoardSemesterId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="def-boardType" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Cơ cấu Số lượng Thành viên</label>
              <select id="def-boardType" className="form-select" value={boardType} onChange={(e) => setBoardType(Number(e.target.value))} style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}>
                <option value={0}>Hội đồng Tiêu chuẩn (5 Thành viên: Chủ tịch, Thư ký + 3 Ủy viên)</option>
                <option value={1}>Hội đồng Rút gọn (3 Thành viên: Chủ tịch, Thư ký + 1 Ủy viên)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="def-chairman" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Giảng viên (Chủ tịch)</label>
                <select id="def-chairman" className="form-select" value={chairmanId} onChange={(e) => setChairmanId(e.target.value)} required>
                  {lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.code} — {lecturer.fullName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="def-secretary" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Giảng viên (Thư ký)</label>
                <select id="def-secretary" className="form-select" value={secretaryId} onChange={(e) => setSecretaryId(e.target.value)} required>
                  {lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.code} — {lecturer.fullName}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="def-members" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ủy viên hội đồng</label>
              <select
                id="def-members"
                multiple
                className="form-select"
                value={memberIds.map(String)}
                onChange={(event) => setMemberIds(
                  Array.from(event.target.selectedOptions, (option) => Number(option.value)),
                )}
                required
                size={Math.min(Math.max(lecturers.length, 3), 7)}
                style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
              >
                {lecturers
                  .filter((lecturer) => Number(lecturer.id) !== Number(chairmanId) && Number(lecturer.id) !== Number(secretaryId))
                  .map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>{lecturer.code} — {lecturer.fullName}</option>
                  ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', display: 'block' }}>
                Giữ Ctrl (Windows) hoặc Cmd (macOS) để chọn nhiều giảng viên.
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
            Chọn hội đồng đã thành lập và bổ sung giảng viên theo vai trò phù hợp.
          </p>

          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label htmlFor="def-targetCouncil" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Hội đồng</label>
              <select id="def-targetCouncil" className="form-select" value={targetCouncilId} onChange={(e) => setTargetCouncilId(e.target.value)} required>
                <option value="">Chọn hội đồng</option>
                {boards.map((board) => <option key={board.id} value={board.id}>{board.code} — {board.memberLecturerIds?.length || 0} thành viên</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="def-addLec" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Giảng viên</label>
              <select id="def-addLec" className="form-select" value={addLecturerId} onChange={(e) => setAddLecturerId(e.target.value)} required>
                {lecturers.map((lecturer) => <option key={lecturer.id} value={lecturer.id}>{lecturer.code} — {lecturer.fullName}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="def-addRole" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Vai trò trong Hội đồng</label>
              <select id="def-addRole" className="form-select" value={addMemberRole} onChange={(e) => setAddMemberRole(Number(e.target.value))} style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}>
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
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} color="#EF4444" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>Phân công Lịch Bảo vệ cho Nhóm Checkpoint</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', lineHeight: 1.4 }}>
            Phân công nhóm checkpoint vào hội đồng. Hệ thống tự kiểm tra học kỳ, loại hội đồng, thời gian và xung đột giảng viên.
          </p>

          <form onSubmit={handleAssignSession}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="def-sessRound" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Đợt bảo vệ</label>
                <select id="def-sessRound" className="form-select" value={sessRoundId} onChange={(e) => setSessRoundId(e.target.value)} required>
                  <option value="">Chọn đợt bảo vệ</option>
                  {rounds.map((round) => <option key={round.id} value={round.id}>{round.code} — {round.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="def-sessCouncil" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Hội đồng</label>
                <select id="def-sessCouncil" className="form-select" value={sessCouncilId} onChange={(e) => setSessCouncilId(e.target.value)} required>
                  <option value="">Chọn hội đồng</option>
                  {boards.map((board) => <option key={board.id} value={board.id}>{board.code}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="def-sessGroup" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Nhóm Checkpoint</label>
                <select id="def-sessGroup" className="form-select" value={sessGroupId} onChange={(e) => setSessGroupId(e.target.value)} required>
                  {groups.map((group) => <option key={group.id} value={group.id}>{group.code} — {group.projectName}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="def-sessDate" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày Bảo vệ</label>
                <input id="def-sessDate" type="date" className="form-input" value={sessDate} onChange={(e) => setSessDate(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label htmlFor="def-sessSlot" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ca học (1-8)</label>
                <input id="def-sessSlot" type="number" className="form-input" value={sessSlot} onChange={(e) => setSessSlot(e.target.value)} min="1" max="8" required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label htmlFor="def-sessRoom" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Phòng bảo vệ</label>
                <input id="def-sessRoom" type="text" className="form-input" value={sessRoom} onChange={(e) => setSessRoom(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem', marginTop: '0.75rem', fontSize: '1rem' }}>
              <span>Phân công Lịch Bảo vệ & Kiểm tra Xung đột</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="table-container" style={{ marginTop: '2rem' }}>
            <table className="table">
              <thead><tr><th>Mã phiên</th><th>Nhóm / Đề tài</th><th>Thời gian</th><th>Phòng</th><th>Hội đồng</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td style={{ fontWeight: 700 }}>{session.code}</td>
                    <td>{session.groupCode}<br /><small>{session.projectTitle}</small></td>
                    <td>{session.sessionDate} — Ca {session.slot}</td>
                    <td>{session.room}</td>
                    <td>{Array.isArray(session.reviewers) ? session.reviewers.join(', ') : 'Chưa có dữ liệu'}</td>
                    <td>{session.status}</td>
                  </tr>
                ))}
                {sessions.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có lịch bảo vệ.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Round Modal */}
      {showCreateRound && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0F172A' }}>Khởi tạo Đợt Bảo vệ Mới</h3>
            <form onSubmit={handleCreateRound}>
              <div className="form-group">
                <label htmlFor="def-roundCode" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mã Đợt</label>
                <input id="def-roundCode" type="text" className="form-input" value={roundCode} onChange={(e) => setRoundCode(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div className="form-group">
                <label htmlFor="def-roundName" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Tên Đợt Bảo vệ</label>
                <input id="def-roundName" type="text" className="form-input" value={roundName} onChange={(e) => setRoundName(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="def-roundSem" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>ID Học kỳ</label>
                  <input id="def-roundSem" type="number" className="form-input" value={roundSemesterId} onChange={(e) => setRoundSemesterId(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="def-roundType" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Cơ cấu Hội đồng</label>
                  <select id="def-roundType" className="form-select" value={roundType} onChange={(e) => setRoundType(Number(e.target.value))} style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}>
                    <option value={0}>Tiêu chuẩn (5 Thành viên)</option>
                    <option value={1}>Rút gọn (3 Thành viên)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="def-roundStart" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày bắt đầu</label>
                  <input id="def-roundStart" type="date" className="form-input" value={roundStart} onChange={handleRoundStartChange} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
                </div>
                <div className="form-group">
                  <label htmlFor="def-roundEnd" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Ngày kết thúc</label>
                  <input id="def-roundEnd" type="date" className="form-input" value={roundEnd} onChange={(e) => setRoundEnd(e.target.value)} required style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }} />
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
