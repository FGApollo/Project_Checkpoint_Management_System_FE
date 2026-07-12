import React, { useState } from 'react';
import api from '../../services/api';
import { FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle, Layers, Users, BookOpen, Mail, ArrowRight, ShieldAlert } from 'lucide-react';

const ExcelImportPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith('.xlsx')) {
        setFile(dropped);
        setError('');
      } else {
        setError('Only .xlsx Excel format is accepted.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.endsWith('.xlsx')) {
        setFile(selected);
        setError('');
      } else {
        setError('Only .xlsx Excel format is accepted.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop an Excel (.xlsx) file first.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/import/groups', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed due to strict Excel validation rules (malformed rows, formula errors, or duplicate identity codes).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#0F172A' }}>Nhập dữ liệu Học kỳ từ Excel (.xlsx)</h1>
          <p className="page-subtitle" style={{ color: '#475569' }}>Nhập hàng loạt danh sách đề tài, nhóm checkpoint, sinh viên và giảng viên hướng dẫn SEP490.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <ShieldAlert size={22} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <span style={{ fontWeight: 700 }}>Lỗi Kiểm tra tính Toàn vẹn Dữ liệu:</span>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), #FFFFFF 70%)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>Nhập liệu Excel Thành công!</h2>
              <p style={{ color: '#475569', fontSize: '0.875rem' }}>Tất cả dữ liệu đã vượt qua kiểm tra toàn vẹn và được lưu vào hệ thống cơ sở dữ liệu.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1.25rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <Layers size={22} color="#F26522" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{result.groupsCreated}</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Nhóm Checkpoint được tạo</span>
            </div>

            <div style={{ padding: '1.25rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <BookOpen size={22} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{result.topicsCreated}</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Đề tài được đăng ký</span>
            </div>

            <div style={{ padding: '1.25rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <Users size={22} color="#0EA5E9" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{result.studentsCreated}</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Sinh viên được thêm</span>
            </div>

            <div style={{ padding: '1.25rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <Users size={22} color="#F59E0B" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{result.studentAccountsCreated}</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Tài khoản được cấp mới</span>
            </div>

            <div style={{ padding: '1.25rem', textAlign: 'center', background: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0' }}>
              <Mail size={22} color="#F26522" style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>{result.emailsSent}</h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Email thông báo được gửi</span>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <form onSubmit={handleSubmit}>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? '#F26522' : '#CBD5E1'}`,
              borderRadius: 'var(--radius-xl)',
              padding: '3.5rem 2rem',
              background: dragActive ? 'rgba(242, 101, 34, 0.08)' : '#F8FAFC',
              transition: 'all var(--transition-normal)',
              cursor: 'pointer',
              marginBottom: '1.5rem'
            }}
            onClick={() => document.getElementById('fileUploadInput').click()}
          >
            <input
              id="fileUploadInput"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              border: '1px solid #E2E8F0'
            }}>
              <UploadCloud size={32} color="#F26522" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
              {file ? file.name : 'Kéo & Thả tệp Excel (.xlsx) vào đây'}
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {file ? `Dung lượng: ${(file.size / 1024).toFixed(1)} KB — Sẵn sàng xử lý` : 'hoặc nhấp chuột vào khung này để chọn tệp từ máy tính'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {file && (
              <button type="button" className="btn btn-secondary" onClick={() => setFile(null)} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1' }}>
                Hủy chọn tệp
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !file}
              style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}
            >
              <span>{loading ? 'Đang kiểm tra & Nhập liệu...' : 'Thực hiện Nhập liệu Excel'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: 'var(--radius-lg)', border: '1px solid #E2E8F0' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0F172A' }}>
          <FileSpreadsheet size={18} color="#F26522" />
          <span>Quy tắc & Chuẩn cấu trúc bảng tính Excel (.xlsx)</span>
        </h4>
        <ul style={{ fontSize: '0.85rem', color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem', paddingLeft: '1.25rem' }}>
          <li>Tự động từ chối các hàng thiếu dữ liệu bắt buộc hoặc sai định dạng.</li>
          <li>Ngăn chặn trùng lặp mã số sinh viên (MSSV) giữa các nhóm checkpoint.</li>
          <li>Kiểm tra và loại bỏ các ô chứa lỗi công thức Excel (#REF!, #DIV/0!, #VALUE!).</li>
          <li>Tự động liên kết giảng viên hướng dẫn dựa theo chính xác mã số giảng viên.</li>
          <li>Tạo cấu trúc nhóm checkpoint thuộc học kỳ đang được tra cứu trong hệ thống.</li>
        </ul>
      </div>
    </div>
  );
};

export default ExcelImportPage;
