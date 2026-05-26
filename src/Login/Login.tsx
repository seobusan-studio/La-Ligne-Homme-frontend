// src/Login/Login.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { FindPasswordModal } from './FindPasswordModal'; // 🌟 [추가 수혈] 비밀번호 찾기 모달 컴포넌트 임포트 개통

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [authError, setAuthError] = useState(false);

  // 🌟 [신설] 비밀번호 찾기 카카오 팝업창 오픈 제어용 동적 상태 스위치
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 이미 로그인되어 있으면 홈으로 튕겨냄 (오리지널 로직 그대로)
  useEffect(() => {
    const SESSION_KEY = 'laligne_session';
    if (localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)) {
      navigate('/');
    }
  }, [navigate]);

  // 실시간 유효성 검사 (오리지널 로직 그대로)
  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const isInvalid = !e.target.validity.valid || !email;
    setEmailError(isInvalid);
    setEmailValid(!isInvalid && !!email);
  };

  const handlePasswordBlur = () => {
    const isInvalid = !password;
    setPasswordError(isInvalid);
    setPasswordValid(!isInvalid && !!password);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(false);

    const isEmailInvalid = !email || !email.includes('@');
    const isPasswordInvalid = !password;

    if (isEmailInvalid || isPasswordInvalid) {
      setEmailError(isEmailInvalid);
      setPasswordError(isPasswordInvalid);
      return;
    }

    try {
      // 진짜 스프링부트 백엔드로 요청
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      let result: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        result = { message: text };
      }

      if (response.ok && (result.success || result.data)) {
        const SESSION_KEY = 'laligne_session';
        const userData = result.data;
        const sessionData = JSON.stringify({ 
          id: userData.id,
          email: userData.email, 
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          address: userData.address
        });
        if (rememberMe) localStorage.setItem(SESSION_KEY, sessionData);
        else sessionStorage.setItem(SESSION_KEY, sessionData);
        navigate('/');
      } else {
        console.error('Login failed:', response.status, result);
        setAuthError(true);
        setEmailError(true);
        setPasswordError(true);
      }
    } catch (err) {
      console.error('Login request error:', err);
      alert('백엔드 서버 연동 상태를 체크하십시오.');
    }
  };

  return (
    <div className="login-page-box">
      {/* Header */}
      <header role="banner">
        <nav className="header-nav" aria-label="메인 내비게이션">
          <span onClick={() => navigate('/')} className="logo" style={{ cursor: 'pointer' }}>
            La Ligne Hommes
            <span>라 린느 옴므</span>
          </span>
          <span onClick={() => navigate('/')} className="header-back" style={{ cursor: 'pointer' }}>홈으로</span>
        </nav>
      </header>

      <main>
        {/* Visual Panel */}
        <div className="login-visual" aria-hidden="true">
          <div className="visual-bg"></div>
          <div className="visual-overlay"></div>
          <div className="visual-content">
            <p className="visual-label">Welcome Back</p>
            <h2 className="visual-title">
              다시 만나서<br /><em>반갑습니다</em>
            </h2>
            <p className="visual-desc">
              라 린느 옴므와 함께한 당신의 스타일을
              계속 이어가세요.
            </p>
            <div className="visual-quote">
              <p>
                "선 하나에 담긴 감각,<br />
                시간이 지나도 빛을 잃지 않는 옷."
              </p>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className="login-form-panel">
          <div className="form-header">
            <p className="form-eyebrow">Sign In</p>
            <h1 className="form-title">로그인</h1>
            <p className="form-subtitle">
              아직 계정이 없으신가요? <span onClick={() => navigate('/signup')} style={{ color: 'var(--color-gold)', cursor: 'pointer' }}>회원가입</span>
            </p>
          </div>

          <form id="login-form" onSubmit={handleLoginSubmit} noValidate>
            <div className="auth-error" id="auth-error" role="alert" style={{ display: authError ? 'block' : 'none' }}>
              이메일 또는 비밀번호가 올바르지 않습니다.
            </div>

            {/* 이메일 */}
            <div className="field">
              <label htmlFor="email">
                이메일 <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                className={`${emailError ? 'error' : ''} ${emailValid ? 'valid' : ''}`}
                placeholder="example@email.com"
                required
              />
              <span className={`field-error ${emailError ? 'visible' : ''}`} role="alert">올바른 이메일 주소를 입력해 주세요.</span>
            </div>

            {/* 비밀번호 */}
            <div className="field">
              <label htmlFor="password">
                비밀번호 <span className="required" aria-hidden="true">*</span>
              </label>
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={handlePasswordBlur}
                  className={`${passwordError ? 'error' : ''} ${passwordValid ? 'valid' : ''}`}
                  placeholder="비밀번호를 입력하세요"
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '숨김' : '표시'}
                </button>
              </div>
              <span className={`field-error ${passwordError ? 'visible' : ''}`} role="alert">비밀번호를 입력해 주세요.</span>
            </div>

            {/* 로그인 유지 & 비밀번호 찾기 */}
            <div className="field-row">
              <label className="checkbox-label">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                로그인 상태 유지
              </label>
              {/* 🌟 [교정 완료] href="#"로 인한 상단 스크롤 튕김을 방지하고, 클릭 시 카카오 팝업창이 올라오도록 바인딩 스위칭 */}
              <span 
                onClick={() => setIsModalOpen(true)} 
                className="forgot-link" 
                style={{ cursor: 'pointer', color: 'var(--color-gold, #8f8576)', fontWeight: '500' }}
              >
                비밀번호를 잊으셨나요?
              </span>
            </div>

            <button type="submit" className="btn-submit">로그인</button>

            <div className="form-divider"><span>또는</span></div>

            <p className="form-signup-link">
              아직 회원이 아니신가요? <span onClick={() => navigate('/signup')} style={{ color: 'var(--color-gold)', cursor: 'pointer' }}>회원가입하기</span>
            </p>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer role="contentinfo">
        <p>&copy; 2025 La Ligne Hommes. All rights reserved.</p>
      </footer >

      {/* 🌟 [신설 오버레이 결합] 껍데기 모달을 화면에 렌더링하고 상태 동기화 링크 연결 */}
      <FindPasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Login;