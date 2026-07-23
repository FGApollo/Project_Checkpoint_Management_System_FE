import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContextValue.js';
import { Award, Lock, User, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '675096303664-kghujhgk2d7og8s85e0f3kioknh4ip2o.apps.googleusercontent.com';
const googleIdentityState = {
  initialized: false,
  credentialHandler: null,
};

const getDashboardPath = (role) => {
  if (role === 'SystemAdministrator' || role === 'TrainingDepartment' || role === 'Moderator') return '/admin/dashboard';
  if (role === 'Lecturer') return '/lecturer/dashboard';
  if (role === 'Student') return '/student/dashboard';
  return '/';
};

const LoginPage = () => {
  const { login, googleLogin, error: authError } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const [username, setUsername] = useState('pdt.dieuphoi@fpt.edu.vn');
  const [password, setPassword] = useState('Test@123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleCredential = useCallback(async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setErrorMsg('Google không trả về thông tin xác thực hợp lệ.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await googleLogin(credentialResponse.credential);
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setErrorMsg(err.message || 'Đăng nhập Google thất bại.');
    } finally {
      setLoading(false);
    }
  }, [googleLogin, navigate]);

  useEffect(() => {
    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      googleIdentityState.credentialHandler = handleGoogleCredential;
      if (!googleIdentityState.initialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (credentialResponse) => googleIdentityState.credentialHandler?.(credentialResponse),
        });
        googleIdentityState.initialized = true;
      }
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 400,
        locale: 'vi',
      });
    };
    const handleScriptError = () => setErrorMsg('Không thể tải dịch vụ đăng nhập Google.');

    let script = document.querySelector(`script[src="${GOOGLE_SCRIPT_URL}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderGoogleButton);
    script.addEventListener('error', handleScriptError);
    if (window.google?.accounts?.id) renderGoogleButton();

    return () => {
      script.removeEventListener('load', renderGoogleButton);
      script.removeEventListener('error', handleScriptError);
      if (googleIdentityState.credentialHandler === handleGoogleCredential) {
        googleIdentityState.credentialHandler = null;
      }
    };
  }, [handleGoogleCredential]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(getDashboardPath(user.role));
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
              Hệ thống Quản lý & Review Checkpoint - Đại học FPT
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

          <form onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-username" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Tên đăng nhập / Mã GV / Email</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="#64748B" style={{ position: 'absolute', left: '0.875rem' }} />
                  <input
                    id="login-username"
                    type="text"
                    className="form-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: pdt.dieuphoi@fpt.edu.vn hoặc DuyDTTSE194673"
                    style={{ width: '100%', paddingLeft: '2.5rem', background: '#F8FAFC', color: '#0F172A', border: '1px solid #CBD5E1' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password" className="form-label" style={{ color: '#334155', fontWeight: 600 }}>Mật khẩu</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '0.875rem' }} />
                  <input
                    id="login-password"
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

          <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                <span style={{ height: '1px', background: '#E2E8F0', flex: 1 }} />
                <span>hoặc</span>
                <span style={{ height: '1px', background: '#E2E8F0', flex: 1 }} />
              </div>
              <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }} />
              <p style={{ color: '#64748B', fontSize: '0.72rem', textAlign: 'center', marginTop: '0.65rem', lineHeight: 1.4 }}>
                Email Google phải trùng với email của tài khoản CPMS đã được tạo.
              </p>
            </div>

          {/* Quick Local Test Switcher */}
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
                  onClick={() => handleQuickSelect('pdt.dieuphoi@fpt.edu.vn', 'Test@123456')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.6rem', justifyContent: 'flex-start', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                >
                  <span className="badge" style={{ background: 'rgba(242,101,34,0.15)', color: '#F26522', fontSize: '0.65rem' }}>Admin</span>
                  <span style={{ fontWeight: 600 }}>Phòng Đào Tạo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('minhnd.gv24001@fpt.edu.vn', 'Test@123456')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.6rem', justifyContent: 'flex-start', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                >
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>GV</span>
                  <span style={{ fontWeight: 600 }}>Giảng viên / HĐ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickSelect('duongduy12314@gmail.com', 'Test@123456')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.6rem', justifyContent: 'flex-start', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
                >
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>SV</span>
                  <span style={{ fontWeight: 600 }}>Dương Thành Thanh Duy / Nhóm</span>
                </button>

              </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
