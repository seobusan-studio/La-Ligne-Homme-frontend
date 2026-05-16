// src/Login/Login.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

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
      const result = await response.json();

      // 안전하게 ApiResponse의 데이터 유무나 성공 여부 체크
      if (response.ok && (result.success || result.data)) {
        const SESSION_KEY = 'laligne_session';
        
        // 🌟 핵심 수정: result.user가 아니라 백엔드가 보낸 통짜 데이터 객체(result.data)를 바라보게 변경
        const userData = result.data; 

        // 세션 데이터에 이메일, 이름과 함께 백엔드가 넘겨주는 role까지 안전하게 동착
        const sessionData = JSON.stringify({ 
          email: userData.email, 
          name: userData.name,
          role: userData.role // 👈 세션에 ADMIN / USER 분기용 데이터가 정상적으로 저장됩니다.
        });
        
        if (rememberMe) localStorage.setItem(SESSION_KEY, sessionData);
        else sessionStorage.setItem(SESSION_KEY, sessionData);
        
        navigate('/');
      } else {
        // 로그인 실패 시 에러 모션 (오리지널 로직 그대로)
        setAuthError(true);
        setEmailError(true);
        setPasswordError(true);
      }
    } catch (err) {
      alert('백엔드 서버 연동 상태를 체크하십시오.');
    }
  };

  return (
    <div className="login-page-box">
      {/* Header */}
      <header role="banner">
        <nav className="header-nav" aria-label="메인 내비게이션">
          <span onClick={() => navigate('/')} className="logo" style={{ cursor: 'pointer' }}>
            La Ligne Homme
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
            <div className={`auth-error ${authError ? 'visible' : ''}`} id="auth-error" role="alert">
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
              <a href="#" className="forgot-link">비밀번호를 잊으셨나요?</a>
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
        <p>&copy; 2025 La Ligne Homme. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;