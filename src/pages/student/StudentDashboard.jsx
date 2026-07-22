import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BookOpen, User, Calendar, CheckSquare, Award, ArrowRight, Layers, Upload, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listProjectDocuments, uploadProjectDocument, downloadProjectDocument } from '../../services/documents';
import { PageSkeleton } from '../../components/common/Skeleton';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [activeSemester, setActiveSemester] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [mySchedules, setMySchedules] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const groupId = user?.groupId || user?.group?.id || groupInfo?.groupId || mySchedules[0]?.groupId;
  const groupCode = user?.groupCode || user?.group?.code || groupInfo?.groupCode || mySchedules[0]?.groupCode || '';
  const [documents, setDocuments] = useState([]);
  const [documentType, setDocumentType] = useState('Final');
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentMessage, setDocumentMessage] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const semRes = await api.get('/semesters?pageSize=100').catch(() => ({ data: [] }));
        const semesters = Array.isArray(semRes.data) ? semRes.data : semRes.data?.items || [];
        const semester = semesters.find((item) => item.isActive) || semesters[0] || null;
        setActiveSemester(semester);

        if (semester?.id) {
          const roundsRes = await api.get(`/student-review/rounds?semesterId=${semester.id}`).catch(() => ({ data: [] }));
          const rounds = Array.isArray(roundsRes.data) ? roundsRes.data : [];
          setGroupInfo(rounds.find((round) => round.groupId) || null);
        }

        const schedRes = await api.get('/student-review/schedule').catch(() => ({ data: [] }));
        setMySchedules(Array.isArray(schedRes.data) ? schedRes.data : []);

        const subRes = await api.get('/review-submissions/my').catch(() => ({ data: [] }));
        setMySubmissions(Array.isArray(subRes.data) ? subRes.data : []);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    listProjectDocuments(groupId).then(({ data }) => setDocuments(Array.isArray(data) ? data : [])).catch(() => setDocuments([]));
  }, [groupId]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile || !groupId) return;
    setDocumentBusy(true); setUploadProgress(0); setDocumentMessage('');
    try {
      await uploadProjectDocument(groupId, documentType, selectedFile, (progressEvent) => {
        if (progressEvent.total) setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      });
      const { data } = await listProjectDocuments(groupId);
      setDocuments(Array.isArray(data) ? data : []); setSelectedFile(null); event.target.reset(); setDocumentMessage('Đã tải tài liệu lên thành công.');
    } catch (error) { setDocumentMessage(error.response?.data?.error || 'Không thể tải tài liệu lên.'); }
    finally { setDocumentBusy(false); }
  };

  const handleDownload = async (document) => {
    const response = await downloadProjectDocument(document.id);
    const url = URL.createObjectURL(response.data); const anchor = window.document.createElement('a');
    anchor.href = url; anchor.download = document.fileName; anchor.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <PageSkeleton cards={3} rows={5} />;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Khu vực Làm việc Sinh viên & Nhóm Checkpoint</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Xin chào, {user?.fullName || user?.username}. Theo dõi lịch review, đăng ký ca checkpoint và xem nhận xét từ giảng viên.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/student/review-schedule" className="btn btn-secondary" style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <BookOpen size={16} color="#F26522" />
            <span style={{ fontWeight: 600 }}>Đăng ký Lịch Review</span>
          </Link>
          <Link to="/student/results" className="btn btn-primary">
            <CheckSquare size={16} />
            <span>Nhận xét Review</span>
          </Link>
        </div>
      </div>

      {/* Capstone Group Overview Card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'radial-gradient(circle at top right, rgba(242, 101, 34, 0.12), #FFFFFF 80%)', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #F26522, #FF7A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(242, 101, 34, 0.3)' }}>
              <Award size={30} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontSize: '0.8rem', fontWeight: 700 }}>{groupCode || 'Nhóm Checkpoint Đăng ký'}</span>
                {activeSemester && (
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>
                    {activeSemester.code || 'Học kỳ Hiện tại'}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>Review Checkpoint SEP490 - Đại học FPT</h2>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
                Quy trình kiểm tra tiến độ theo chuẩn đề cương: Review 1 (Báo cáo đề cương), Review 2 (Giữa kỳ), Review 3 (Bảo vệ thử).
              </p>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', minWidth: '240px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Thông tin Sinh viên</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <User size={18} color="#F26522" />
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>{user?.username || 'SE194673'}</span>
            </div>
            <span className="badge" style={{ marginTop: '0.5rem', display: 'inline-block', background: 'rgba(14, 165, 233, 0.15)', color: '#0EA5E9' }}>Kỹ thuật Phần mềm (SWD)</span>
          </div>
        </div>
      </div>

      {/* Quick Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(242,101,34,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#F26522" />
            </div>
            <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>{mySchedules.length} Đã xếp lịch</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0F172A' }}>Đăng ký Ca & Lịch Review</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', flex: 1, lineHeight: 1.5 }}>
            Đăng ký ca và ngày review theo nguyện vọng của nhóm. Xem lịch review chính thức ngay khi Phòng Đào tạo chốt và công bố.
          </p>
          <Link to="/student/review-schedule" className="btn btn-secondary" style={{ justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #CBD5E1', color: '#0F172A' }}>
            <span style={{ fontWeight: 600 }}>Quản lý Đăng ký Review</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={20} color="#10B981" />
            </div>
            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>{mySubmissions.length} Nhận xét</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0F172A' }}>Nhận xét Review từ Giảng viên</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', flex: 1, lineHeight: 1.5 }}>
            Xem tình trạng điểm danh, nhận xét chi tiết từ giảng viên review qua các vòng Review 1, 2, 3 và tải về phiếu đánh giá chính thức.
          </p>
          <Link to="/student/results" className="btn btn-primary" style={{ justifyContent: 'space-between' }}>
            <span>Xem Nhận xét Review</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#0F172A' }}><FileText size={20} color="#F26522" /> Tài liệu đồ án</h3>
        <p style={{ color: '#64748B', fontSize: '0.85rem' }}>Tải bản PDF/DOCX/ZIP/TXT để giảng viên xem trước buổi review. Tối đa 50 MB mỗi tệp.</p>
        {groupId ? <form onSubmit={handleUpload} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', margin: '1rem 0' }}>
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="form-input" style={{ width: 'auto' }}><option value="Proposal">Đề cương</option><option value="Progress">Giữa kỳ</option><option value="Final">Bản cuối</option></select>
          <input type="file" accept=".pdf,.docx,.zip,.txt" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} />
          <button className="btn btn-primary" type="submit" disabled={!selectedFile || documentBusy}><Upload size={16} /> {documentBusy ? 'Đang tải...' : 'Tải tài liệu'}</button>
        </form> : <p style={{ color: '#B45309' }}>Tài khoản chưa được gán vào nhóm.</p>}
        {documentBusy && <div aria-live="polite" style={{ color: '#475569', fontSize: '0.85rem' }}>Đã tải {uploadProgress}%</div>}
        {documentMessage && <p style={{ color: documentMessage.startsWith('Đã') ? '#059669' : '#DC2626', fontSize: '0.9rem' }}>{documentMessage}</p>}
        {documents.length === 0 ? <p style={{ color: '#64748B', padding: '1rem 0' }}>Chưa có tài liệu nào.</p> : documents.map((document) => <div key={document.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', padding: '0.75rem 0' }}><span><strong>{document.fileName}</strong><small style={{ display: 'block', color: '#64748B' }}>{document.docType} · phiên bản {document.versionNo}</small></span><button className="btn btn-secondary" type="button" onClick={() => handleDownload(document)}><Download size={15} /> Xem/Tải</button></div>)}
      </div>

      {/* Published Schedules Table */}
      <div className="glass-card" style={{ padding: '1.75rem', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
          <Layers size={20} color="#F26522" />
          <span>Lịch Review Chính thức của Nhóm</span>
        </h3>


        {!loading && mySchedules.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
            Nhóm chưa có lịch review chính thức nào được công bố. Nếu bạn đã đăng ký ca rảnh, vui lòng chờ Phòng Đào tạo xếp lịch và thông báo.
          </div>
        )}
        {!loading && mySchedules.length > 0 && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID Phiên</th>
                  <th>Mã Nhóm</th>
                  <th>Ngày & Ca học</th>
                  <th>Phòng</th>
                  <th>Vòng Review</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {mySchedules.map((sc) => (
                  <tr key={sc.sessionId ?? sc.id ?? `${sc.sessionDate}-${sc.slot}`}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>#{sc.sessionId || sc.id || 'N/A'}</td>
                    <td><span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522' }}>{sc.groupCode || groupCode || groupInfo?.groupCode || 'Nhóm của bạn'}</span></td>
                    <td style={{ color: '#475569' }}>{sc.sessionDate ? new Date(sc.sessionDate).toLocaleDateString('vi-VN') : (sc.dayOfWeek || '—')} — Ca {sc.slot}</td>
                    <td style={{ fontWeight: 700, color: '#0F172A' }}>{sc.room || 'TBD'}</td>
                    <td style={{ color: '#475569' }}>{sc.type || 'Chấm Checkpoint'}</td>
                    <td><span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>{sc.status || sc.groupStatus || 'Đã công bố'}</span></td>
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

export default StudentDashboard;
