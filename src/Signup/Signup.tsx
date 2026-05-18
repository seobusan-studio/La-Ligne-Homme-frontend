// src/Signup/Signup.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup: React.FC = () => {
  const navigate = useNavigate();

  // 입력 상태
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // 🌟 [수혈] 검색된 우편번호+도로명 주소용 상태창과 상세주소(동, 호수)용 상태창 분할 적재
  const [address, setAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // 유효성 에러 상태
  const [errors, setErrors] = useState({
    lastName: false,
    firstName: false,
    email: false,
    address: false, 
    password: false,
    passwordConfirm: false,
    agree: false
  });

  // UI 토글 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 약관 동의 상태
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const isAllAgreed = agreeTerms && agreePrivacy && agreeMarketing;

  // 🌟 [신설 - Daum 우편번호 고속 트래킹 원장 스크립트 동적 주입]
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 이미 로그인되어 있으면 홈으로
  useEffect(() => {
    const SESSION_KEY = 'laligne_session';
    if (localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)) {
      navigate('/');
    }
  }, [navigate]);

  // 비밀번호 강도 계산
  const getPasswordScore = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const passwordScore = getPasswordScore(password);
  const strengthColors = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60'];
  const strengthTexts = ['', '약함', '보통', '강함', '매우 강함'];

  // 전화번호 자동 하이픈
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length >= 4 && raw.length < 8) formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    else if (raw.length >= 8) formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
    setPhone(formatted);
  };

  // 전체 동의 핸들러
  const handleAgreeAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  // 실시간 Blur 유효성 검사
  const handleBlur = (field: string, value: string | boolean) => {
    setErrors(prev => ({
      ...prev,
      [field]: field === 'passwordConfirm' ? value !== password : !value || (field === 'password' && (value as string).length < 8)
    }));
  };

  /* =========================================================================
   * 🌟 [신설 - 카카오 카운터 파트 전용 우편번호 오버레이 엔진]
   * 사용자가 주소 검색 버튼을 누르면 팝업창을 띄우고 우편번호와 도로명 주소를 정밀 조합해 냅니다.
   * ========================================================================= */
  const handleOpenPostcode = () => {
    if ((window as any).daum && (window as any).daum.Postcode) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          let fullRoadAddr = data.roadAddress; // 도로명 주소 기본 패킷 변수
          let extraRoadAddr = ''; // 참고 항목 변수

          // 법정동명이 있을 경우 추가 (법정리는 제외)
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraRoadAddr += data.bname;
          }
          // 건물명이 있고, 공동주택일 경우 추가
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          // 표시할 참고항목이 있을 경우 최종 조립
          if (extraRoadAddr !== '') {
            extraRoadAddr = ` (${extraRoadAddr})`;
          }

          // 형님의 결제창 인터페이스 규격에 부합하도록 [우편번호] 도로명주소 포맷 1차 적재
          setAddress(`[${data.zonecode}] ${fullRoadAddr}${extraRoadAddr}`);
          
          // 주소 꼽히면 자동으로 상세주소 칸으로 마우스 포커스 전진 배치
          const detailInput = document.getElementById('detail-address');
          if (detailInput) detailInput.focus();
        }
      }).open();
    } else {
      alert('우편번호 서비스 스크립트를 로딩 중입니다. 잠시만 기다려 주십시오.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = email && email.includes('@');
    const isPwValid = password.length >= 8;
    const isPwMatch = password === passwordConfirm;
    const isAddressValid = address.trim().length > 0; // 주소 선택 검증선

    // 필수 약관 동의 검증 스위치
    const isAgreeValid = agreeTerms && agreePrivacy;

    // 에러 상태 업데이트
    setErrors({
      lastName: !lastName.trim(),
      firstName: !firstName.trim(),
      email: !isEmailValid,
      address: !isAddressValid, 
      password: !isPwValid,
      passwordConfirm: !isPwMatch,
      agree: !isAgreeValid 
    });

    if (!lastName.trim() || !firstName.trim() || !isEmailValid || !isAddressValid || !isPwValid || !isPwMatch || !isAgreeValid) {
      return; 
    }

    try {
      // 🌟 [조립 완료] 우편번호 주소와 상세 기입 주소를 공백 하나 두고 병합하여 백엔드로 단일 사출 처리
      const combinedAddress = `${address.trim()} ${detailAddress.trim()}`.trim();

      const payload = {
        email: email.trim(),
        password,
        name: lastName.trim() + firstName.trim(), 
        phone: phone.replace(/\D/g, ''),
        address: combinedAddress, 
        isAgreedTerms: agreeTerms,         
        isAgreedPrivacy: agreePrivacy,     
        isAgreedMarketing: agreeMarketing  
      };

      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && (result.status === 'SUCCESS' || result.success)) {
        setIsSuccess(true);
      } else {
        alert(result.message || '회원가입 처리 중 알 수 없는 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('라 린느 인증 백엔드 서버와 통신할 수 없습니다.');
    }
  };

  return (
    <div className="signup-page-box">
      <header role="banner">
        <nav className="header-nav" aria-label="메인 내비게이션">
          <span onClick={() => navigate('/')} className="logo" style={{ cursor: 'pointer' }}>
            La Ligne Homme<span>라 린느 옴므</span>
          </span>
          <span onClick={() => navigate('/')} className="header-back" style={{ cursor: 'pointer' }}>홈으로</span>
        </nav>
      </header>

      <main>
        {/* Visual Panel */}
        <div className="signup-visual" aria-hidden="true">
          <div className="visual-bg"></div>
          <div className="visual-overlay"></div>
          <div className="visual-content">
            <p className="visual-label">Member Benefits</p>
            <h2 className="visual-title">당신만을 위한<br /><em>특별한 혜택</em></h2>
            <p className="visual-desc">라 린느 옴므 멤버가 되시면 새 컬렉션 소식을 가장 먼저 받고, 다양한 멤버 전용 혜택을 누리실 수 있습니다.</p>
            <ul className="visual-perks" role="list">
              <li className="perk-item"><span className="perk-dot" aria-hidden="true"></span>첫 구매 10% 할인 쿠폰 즉시 지급</li>
              <li className="perk-item"><span className="perk-dot" aria-hidden="true"></span>신상품 출시 사전 알림</li>
              <li className="perk-item"><span className="perk-dot" aria-hidden="true"></span>멤버 전용 시즌 세일 우선 접근</li>
              <li className="perk-item"><span className="perk-dot" aria-hidden="true"></span>룩북 & 스타일링 가이드 무료 제공</li>
            </ul>
          </div>
        </div>

        {/* Form Panel */}
        <div className="signup-form-panel">
          {!isSuccess ? (
            <div id="form-section">
              <div className="form-header">
                <p className="form-eyebrow">Create Account</p>
                <h2 className="form-title">회원가입</h2>
                <p className="form-subtitle">이미 계정이 있으신가요? <span onClick={() => navigate('/login')} style={{ color: 'var(--color-gold)', cursor: 'pointer' }}>로그인</span></p>
              </div>

              <form id="signup-form" onSubmit={handleSignupSubmit} noValidate>
                {/* 이름 (성/이름) */}
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="last-name">성 <span className="required" aria-hidden="true">*</span></label>
                    <input type="text" id="last-name" value={lastName} onChange={e => setLastName(e.target.value)} onBlur={e => handleBlur('lastName', e.target.value)} className={errors.lastName ? 'error' : lastName ? 'valid' : ''} placeholder="홍" required />
                    <span className={`field-error ${errors.lastName ? 'visible' : ''}`} role="alert">성을 입력해 주세요.</span>
                  </div>
                  <div className="field">
                    <label htmlFor="first-name">이름 <span className="required" aria-hidden="true">*</span></label>
                    <input type="text" id="first-name" value={firstName} onChange={e => setFirstName(e.target.value)} onBlur={e => handleBlur('firstName', e.target.value)} className={errors.firstName ? 'error' : firstName ? 'valid' : ''} placeholder="길동" required />
                    <span className={`field-error ${errors.firstName ? 'visible' : ''}`} role="alert">이름을 입력해 주세요.</span>
                  </div>
                </div>

                {/* 이메일 */}
                <div className="field">
                  <label htmlFor="email">이메일 <span className="required" aria-hidden="true">*</span></label>
                  <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={e => handleBlur('email', e.target.validity.valid)} className={errors.email ? 'error' : (email && email.includes('@') ? 'valid' : '')} placeholder="example@email.com" required />
                  <span className={`field-error ${errors.email ? 'visible' : ''}`} role="alert">올바른 이메일 주소를 입력해 주세요.</span>
                </div>

                {/* 휴대폰 번호 */}
                <div className="field">
                  <label htmlFor="phone">휴대폰 번호</label>
                  <input type="tel" id="phone" value={phone} onChange={handlePhoneChange} placeholder="010-0000-0000" />
                  <span className="field-hint">숫자만 입력하시면 자동으로 하이픈이 추가됩니다.</span>
                </div>

                {/* 🌟 [UX 교정 개통] 우편번호 서비스와 결합된 기본 배송지 주소 구역 */}
                <div className="field">
                  <label htmlFor="address">기본 배송지 주소 <span className="required" aria-hidden="true">*</span></label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      id="address" 
                      value={address} 
                      readOnly // 키보드로 임의 타자 주작 버그 차단
                      onClick={handleOpenPostcode} // 주소창 클릭해도 바로 팝업 개통
                      className={errors.address ? 'error' : address ? 'valid' : ''} 
                      placeholder="주소 검색 버튼을 눌러주세요" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={handleOpenPostcode} 
                      style={{ 
                        background: '#111', 
                        color: '#fff', 
                        border: '1px solid #8f8576', 
                        padding: '0 16px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.05em'
                      }}
                    >
                      주소 검색
                    </button>
                  </div>
                  
                  {/* 상세주소 입력 보드 (동, 호수 세부 명세용) */}
                  <input 
                    type="text" 
                    id="detail-address" 
                    value={detailAddress} 
                    onChange={e => setDetailAddress(e.target.value)}
                    placeholder="상세 주소를 입력하세요 (아파트 동·호수 등)" 
                    style={{ width: '100%' }}
                  />
                  <span className={`field-error ${errors.address ? 'visible' : ''}`} role="alert">배송지 주소를 입력해 주세요.</span>
                </div>

                {/* 비밀번호 */}
                <div className="field">
                  <label htmlFor="password">비밀번호 <span className="required" aria-hidden="true">*</span></label>
                  <div className="password-wrap">
                    <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={e => setPassword(e.target.value)} onBlur={e => handleBlur('password', e.target.value)} className={errors.password ? 'error' : (password.length >= 8 ? 'valid' : '')} placeholder="8자 이상 입력하세요" required />
                    <input type="checkbox" style={{display: 'none'}} id="toggle-pw-chk" />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '숨김' : '표시'}</button>
                  </div>
                  <div className="strength-bar" aria-hidden="true">
                    {[1, 2, 3, 4].map(num => (
                      <div key={num} className="strength-segment" style={{ background: num <= passwordScore ? strengthColors[passwordScore - 1] : 'var(--color-border)' }}></div>
                    ))}
                  </div>
                  <span className="strength-label">{password.length > 0 ? strengthTexts[passwordScore] : ''}</span>
                  <span className={`field-error ${errors.password ? 'visible' : ''}`} role="alert">비밀번호는 8자 이상이어야 합니다.</span>
                </div>

                {/* 비밀번호 확인 */}
                <div className="field">
                  <label htmlFor="password-confirm">비밀번호 확인 <span className="required" aria-hidden="true">*</span></label>
                  <div className="password-wrap">
                    <input type={showPasswordConfirm ? 'text' : 'password'} id="password-confirm" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} onBlur={e => handleBlur('passwordConfirm', e.target.value)} className={errors.passwordConfirm ? 'error' : (passwordConfirm && passwordConfirm === password ? 'valid' : '')} placeholder="비밀번호를 다시 입력하세요" required />
                    <input type="checkbox" style={{display: 'none'}} id="toggle-pw-confirm-chk" />
                    <button type="button" className="password-toggle" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}>{showPasswordConfirm ? '숨김' : '표시'}</button>
                  </div>
                  <span className={`field-error ${errors.passwordConfirm ? 'visible' : ''}`} role="alert">비밀번호가 일치하지 않습니다.</span>
                </div>

                {/* 약관 동의 */}
                <div className="agree-section">
                  <label className="checkbox-label agree-all">
                    <input type="checkbox" checked={isAllAgreed} onChange={handleAgreeAll} />
                    <span><strong>전체 동의</strong> — 필수 및 선택 항목 모두 동의합니다.</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} required />
                    <span><span className="agree-badge">필수</span> <span className="agree-link">이용약관</span>에 동의합니다.</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} required />
                    <span><span className="agree-badge">필수</span> <span className="agree-link">개인정보 처리방침</span>에 동의합니다.</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={agreeMarketing} onChange={e => setAgreeMarketing(e.target.checked)} />
                    <span><span className="agree-badge">선택</span> 마케팅 정보 수신에 동의합니다. (이메일 · SMS)</span>
                  </label>
                </div>

                <p className={`field-error ${errors.agree ? 'visible' : ''}`} role="alert" style={{ marginBottom: '0.75rem' }}>필수 약관에 동의해 주세요.</p>

                <button type="submit" className="btn-submit">가입 완료하기</button>

                <div className="form-divider"><span>또는</span></div>
                <p className="form-login-link">이미 회원이신가요? <span onClick={() => navigate('/login')} style={{ color: 'var(--color-gold)', cursor: 'pointer' }}>로그인하기</span></p>
              </form>
            </div>
          ) : (
            /* 성공 화면 */
            <div className="success-panel visible">
              <div className="success-icon" aria-hidden="true">✓</div>
              <h2 className="success-title">가입을 환영합니다</h2>
              <p className="success-desc">
                라 린느 옴므의 멤버가 되셨습니다.<br />
              </p>
              <span onClick={() => navigate('/')} className="btn-to-home" style={{ cursor: 'pointer' }}>쇼핑 시작하기</span>
            </div>
          )}
        </div>
      </main>

      <footer role="contentinfo">
        <p>&copy; 2025 La Ligne Homme. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Signup;