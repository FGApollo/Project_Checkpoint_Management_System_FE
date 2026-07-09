import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Award, Lock, User, KeyRound, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const { login, bootstrapAdmin, error: authError } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('test.training');
  const [password, setPassword] = useState('Test@123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Bootstrap Admin modal states
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bsUsername, setBsUsername] = useState('admin');
  const [bsEmail, setBsEmail] = useState('admin@cpms.local');
  const [bsPassword, setBsPassword] = useState('123456');
  const [bsSuccess, setBsSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(username, password);
      // Navigate to appropriate role dashboard
      if (user.role === 'SystemAdministrator' || user.role === 'TrainingDepartment' || user.role === 'Moderator') {
        navigate('/admin/dashboard');
      } else if (user.role === 'Lecturer') {
        navigate('/lecturer/dashboard');
      } else if (user.role === 'Student') {
        navigate('/student/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg('');
  };

  const handleBootstrapSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setBsSuccess('');
    setLoading(true);
    try {
      const user = await bootstrapAdmin(bsUsername, bsEmail, bsPassword);
      setBsSuccess('Khởi tạo tài khoản Quản trị viên Gốc thành công! Đang tự động đăng nhập...');
      setTimeout(() => navigate('/admin/dashboard'), 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Khởi tạo tài khoản thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 10%, rgba(242, 101, 34, 0.12) 0%, var(--bg-primary) 70%)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        position: 'relative'
      }}>
        {/* Decorative background FPT orange glow */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          background: '#F26522',
          filter: 'blur(100px)',
          opacity: 0.22,
          zIndex: 0
        }} />

        <div className="glass-card" style={{ padding: '2.5rem', position: 'relative', zIndex: 10, background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 10px 35px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #F26522, #FF7A00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 25px rgba(242, 101, 34, 0.3)'
            }}>
              <Award size={32} color="white" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>Cổng thông tin CPMS</h1>
            <p style={{ color: '#475569', fontSize: '0.875rem', marginTop: '0.375rem', fontWeight: 500 }}>
              Hệ thống Quản lý & Đánh giá Đồ án Tốt nghiệp SEP490 - Đại học FPT
            </p>
          </div>

          {(errorMsg || authError) && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#EF4444',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg || authError}</span>
            </div>
          )}

          {bsSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#10B981',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{bsSuccess}</span>
            </div>
          )}

          {!showBootstrap ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Tên đăng nhập / Mã GV / Email</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="#64748B" style={{ position: 'absolute', left: '0.875rem' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: test.training hoặc DuyDTTSE194673"
                    style={{ width: '100%', paddingLeft: '2.5rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mật khẩu</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '0.875rem' }} />
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    style={{ width: '100%', paddingLeft: '2.5rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '0.875rem', marginTop: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleBootstrapSubmit}>
              <div style={{ marginBottom: '1.25rem', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', marginBottom: '0.5rem' }}>Khởi tạo ban đầu</span>
                <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Sử dụng chức năng này để tạo tài khoản Quản trị gốc khi cơ sở dữ liệu trắng.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Tên Quản trị viên</label>
                <input
                  type="text"
                  className="form-input"
                  value={bsUsername}
                  onChange={(e) => setBsUsername(e.target.value)}
                  style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Email Quản trị viên</label>
                <input
                  type="email"
                  className="form-input"
                  value={bsEmail}
                  onChange={(e) => setBsEmail(e.target.value)}
                  style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mật khẩu</label>
                <input
                  type="password"
                  className="form-input"
                  value={bsPassword}
                  onChange={(e) => setBsPassword(e.target.value)}
                  style={{ background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-success"
                disabled={loading}
                style={{ width: '100%', padding: '0.875rem', marginTop: '0.75rem', fontWeight: 700 }}
              >
                <span>Khởi tạo Tài khoản Quản trị</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowBootstrap(false)}
                style={{ width: '100%', marginTop: '0.5rem', background: '#F1F5F9' }}
              >
                Quay lại Đăng nhập tiêu chuẩn
              </button>
            </form>
          )}

          {/* Quick Local Test Switcher */}
          {!showBootstrap && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Chuyển nhanh tài khoản kiểm thử
                </span>
                <Sparkles size={14} color="#F26522" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('test.training', 'Test@123456')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.6rem', justifyContent: 'flex-start', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                >
                  <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontSize: '0.65rem' }}>Admin</span>
                  <span style={{ fontWeight: 600 }}>Phòng Đào Tạo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('test.lecturer', 'Test@123456')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.6rem', justifyContent: 'flex-start', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                >
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>GV</span>
                  <span style={{ fontWeight: 600 }}>Giảng viên / HĐ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('test.student', 'Test@123456')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.6rem', justifyContent: 'flex-start', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                >
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>SV</span>
                  <span style={{ fontWeight: 600 }}>Sinh viên / Nhóm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('admin@gmail.com', '12345')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.6rem', justifyContent: 'flex-start', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                >
                  <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontSize: '0.65rem' }}>Admin</span>
                  <span style={{ fontWeight: 600 }}>Quản trị Gốc</span>
                </button>
              </div>

              <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setShowBootstrap(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Lần đầu chạy? Khởi tạo Quản trị viên Gốc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
