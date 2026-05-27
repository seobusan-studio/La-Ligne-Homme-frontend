// src/Signup/Signup.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

// 🌟 [법적 결합] 형님이 constants 폴더에 생성하신 철벽 방어용 법률 원본 서류 정밀 연동
import { LALIGN_TERMS_TEXT, LALIGN_PRIVACY_TEXT } from '../constants/TermsConstants';

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

  /* =========================================================================
   * 🔒 [보안 수혈] 휴대폰 SMS 인증 파이프라인 전용 상태 관리 컴포넌트 추가
   * ========================================================================= */
  const [verificationCode, setVerificationCode] = useState(''); // 유저가 입력한 인증번호 상태
  const [isCodeSent, setIsCodeSent] = useState(false);          // 인증번호 발송 완료 여부 스위치
  const [isVerified, setIsVerified] = useState(false);          // 휴대폰 최종 검증 완료 여부 가드선
  const [isEmailVerified, setIsEmailVerified] = useState(false); // 📧 [수혈] 이메일 중복 확인 완료 여부 가드선
  const [smsError, setSmsError] = useState('');                // SMS 인증 에러 메시지창
  const [emailMessage, setEmailMessage] = useState('');        // 📧 [수혈] 이메일 중복 확인 메시지창
  const [timer, setTimer] = useState(180);                      // 🌟 법적 제한 유효시간 3분 카운트다운 (180초)

  /* =========================================================================
   * 💸 [보안 고도화 수혈] 악의적인 무단 도용 및 연타 비용 테러 방지용 쿨타임 상태 변수
   * ========================================================================= */
  const [isSmsCooltime, setIsSmsCooltime] = useState(false);    // 1분간 재발송 버튼 잠금 스위치
  const [cooltimeSeconds, setCooltimeSeconds] = useState(60);   // 연타 방지 디바운싱 남은 시간

  // 유효성 에러 상태
  const [errors, setErrors] = useState({
    lastName: false,
    firstName: false,
    email: false,
    address: false, 
    password: false,
    passwordConfirm: false,
    agree: false,
    phoneVerify: false // 🌟 [수혈] 휴대폰 미인증 방어 스위치 추가
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

  /* =========================================================================
   * ⏰ [보안 수혈] 인증번호 유효시간 3분 정밀 카운트다운 타이머 인터셉터
   * ========================================================================= */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCodeSent && timer > 0 && !isVerified) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setSmsError('인증 시간이 만료되었습니다. 다시 요청해 주세요.');
    }
    return () => {
      document.body.style.zoom = "1.0"; // 브라우저 배율 고정 가드선
      clearInterval(interval);
    };
  }, [isCodeSent, timer, isVerified]);

  /* =========================================================================
   * 💸 [보안 고도화 수혈] 연타 공격 방지용 60초 쿨타임 가동 백그라운드 타이머
   * ========================================================================= */
  useEffect(() => {
    let cooldownInterval: NodeJS.Timeout;
    if (isSmsCooltime && cooltimeSeconds > 0) {
      cooldownInterval = setInterval(() => {
        setCooltimeSeconds(prev => prev - 1);
      }, 1000);
    } else if (cooltimeSeconds === 0) {
      setIsSmsCooltime(false);
      setCooltimeSeconds(60); // 다음 테러 방지를 위해 60초 리셋
    }
    return () => clearInterval(cooldownInterval);
  }, [isSmsCooltime, cooltimeSeconds]);

  /* =========================================================================
   * 🌟 [보안 규격 전면 고도화] 영문, 숫자, 특수문자 조합 유효성 판별 엔진
   * ========================================================================= */
  const getPasswordScore = (pw: string) => {
    if (pw.length < 8) return 0; // 최소 8자 미만은 무조건 0점 과락
    let score = 1;
    if (/[A-Za-z]/.test(pw)) score++;          // 조건 1: 영문자 포함
    if (/[0-9]/.test(pw)) score++;             // 조건 2: 숫자 포함
    if (/[@$!%*#?&]/.test(pw)) score++;        // 조건 3: 특수문자 포함
    return score; // 최고 4점
  };

  const passwordScore = getPasswordScore(password);
  const strengthColors = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60'];
  const strengthTexts = ['', '조합 부족(8자 이상)', '낮은 보안 수준', '안전함', '최고 수준 보안'];

  // 전화번호 자동 하이픈
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length >= 4 && raw.length < 8) formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    else if (raw.length >= 8) formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
    setPhone(formatted);
    
    // 번호가 수정되면 인증 유효성 리셋 처리 (우회 차단 가드)
    setIsCodeSent(false);
    setIsVerified(false);
    setVerificationCode('');
    setSmsError('');
  };

  /* =========================================================================
   * 📧 [수혈] 이메일 중복 확인 엔진
   * ========================================================================= */
  const handleCheckEmail = async () => {
    if (!email || !email.includes('@')) {
      setEmailMessage('올바른 이메일 형식을 입력해 주세요.');
      return;
    }

    try {
      setEmailMessage('');
      const response = await fetch('http://localhost:8080/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const result = await response.json();

      if (response.ok) {
        setIsEmailVerified(true);
        setEmailMessage('사용 가능한 이메일입니다.');
        setErrors(prev => ({ ...prev, email: false }));
      } else {
        setIsEmailVerified(false);
        setEmailMessage(result.message || '이미 사용 중인 이메일입니다.');
        setErrors(prev => ({ ...prev, email: true }));
      }
    } catch (err) {
      setEmailMessage('서버 통신 실패. 백엔드 상태를 확인하세요.');
    }
  };

  /* =========================================================================
   * 🚀 [법적 가드선 체결] 개인정보 수집 및 이용 동의가 완료되어야만 발송 밸브 개통
   * ========================================================================= */
  const handleRequestSmsCode = async () => {
    // 🛡️ 법적 의무 가드: 필수 개인정보 동의 체크 여부 선제 검증
    if (!agreeTerms || !agreePrivacy) {
      setSmsError('하단의 개인정보 처리방침 및 필수 이용약관에 동의하셔야 휴대폰 인증 요청이 가능합니다.');
      setErrors(prev => ({ ...prev, agree: true }));
      return;
    }

    // 🛡️ 연타 테러 가드: 1분 내 재요청 시 즉시 무력화
    if (isSmsCooltime) {
      return;
    }

    // 🌟 [정밀 보정] 플래그와 정규식을 명확히 하여 순수 숫자만 추출합니다.
    const rawPhone = phone.replace(/[^0-9]/g, ''); 
    
    if (rawPhone.length < 10 || rawPhone.includes('undefined')) {
      setSmsError('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }

    try {
      setSmsError('');
      // 백엔드 실시간 SMS 사출 API 타격
      const response = await fetch('http://localhost:8080/api/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone }) // 깨끗한 숫자만 송출
      });

      if (response.ok) {
        setIsCodeSent(true);
        setIsSmsCooltime(true); // 격발 성공 즉시 60초 버튼 락(LOCK) 가동
        setTimer(180); // 3분 세팅 리로드
        alert('인증번호가 발송되었습니다. (테스트 모드 시 백엔드 콘솔창 확인)');
      } else {
        const errorData = await response.json();
        setSmsError(errorData.message || '인증번호 발송 실패. 과도한 요청이 감지되었습니다.');
      }
    } catch (err) {
      setSmsError('인증 서버 통신 실패. 백엔드 가동 상태를 확인하세요.');
    }
  };

  /* =========================================================================
   * 🚀 [보안 수혈] 입력한 임시 번호가 메모리 원장과 맞는지 교차 검증
   * ========================================================================= */
  const handleVerifySmsCode = async () => {
    if (timer === 0) {
      setSmsError('시간이 만료되었습니다. 다시 발송해 주세요.');
      return;
    }

    // 🌟 [정밀 보정] 송출 전 번호 원장의 무결성을 재검증합니다.
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    try {
      setSmsError('');
      const response = await fetch('http://localhost:8080/api/auth/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          code: verificationCode.trim()
        })
      });

      const result = await response.json();

      if (response.ok && (result.status === 'SUCCESS' || result.success)) {
        setIsVerified(true);
        setErrors(prev => ({ ...prev, phoneVerify: false }));
        alert('휴대폰 인증이 완료되었습니다.');
      } else {
        setSmsError(result.message || '인증번호가 일치하지 않습니다.');
      }
    } catch (err) {
      setSmsError('인증 서버 검증 통신 실패.');
    }
  };

  // 전체 동의 핸들러
  const handleAgreeAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  /* =========================================================================
   * 🌟 [교정] Blur 유효성 검사 내 정규식 철벽 결합선 연격 가동
   * ========================================================================= */
  const handleBlur = (field: string, value: string | boolean) => {
    let isInvalid = false;
    
    if (field === 'password') {
      // 마이페이지와 100% 동일한 대기업 규격의 영문+숫자+특수문자 필수 정규식 적용
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
      isInvalid = !value || !(value as string).match(passwordRegex);
    } else if (field === 'passwordConfirm') {
      isInvalid = value !== password;
    } else {
      isInvalid = !value;
    }

    setErrors(prev => ({
      ...prev,
      [field]: isInvalid
    }));
  };

  /* =========================================================================
   * 🌟 [신설 - Daum 우편번호 오버레이 엔진]
   * ========================================================================= */
  const handleOpenPostcode = () => {
    if ((window as any).daum && (window as any).daum.Postcode) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          let fullRoadAddr = data.roadAddress;
          let extraRoadAddr = '';

          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraRoadAddr += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          if (extraRoadAddr !== '') {
            extraRoadAddr = ` (${extraRoadAddr})`;
          }

          setAddress(`[${data.zonecode}] ${fullRoadAddr}${extraRoadAddr}`);
          
          const detailInput = document.getElementById('detail-address');
          if (detailInput) detailInput.focus();
        }
      }).open();
    } else {
      alert('우편번호 서비스 스크립트를 로딩 중입니다. 잠시만 기다려 주십시오.');
    }
  };

  /* =========================================================================
   * 🚀 [최종 격발 가드] 가입 버튼 클릭 시 특수문자 정규식 최종 락다운
   * ========================================================================= */
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = email && email.includes('@');
    
    // 🛡️ 서브밋 시점 특수문자 조합 정규식 최종 교차 필터링 개통
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    const isPwValid = password && password.match(passwordRegex);
    const isPwMatch = password === passwordConfirm;
    const isAddressValid = address.trim().length > 0;
    const isAgreeValid = agreeTerms && agreePrivacy;

    setErrors({
      lastName: !lastName.trim(),
      firstName: !firstName.trim(),
      email: !isEmailValid,
      address: !isAddressValid, 
      password: !isPwValid,
      passwordConfirm: !isPwMatch,
      agree: !isAgreeValid,
      phoneVerify: !isVerified
    });

    if (!lastName.trim() || !firstName.trim() || !isEmailValid || !isAddressValid || !isPwValid || !isPwMatch || !isAgreeValid || !isVerified) {
      alert('입력 양식이 올바르지 않거나 보안 조합(최소 8자, 특수문자 필수)이 충족되지 않았습니다.');
      return; 
    }

    try {
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
      alert('라  린느 인증 백엔드 서버와 통신할 수 없습니다.');
    }
  };

  return (
    <div className="signup-page-box">
      <header role="banner">
        <nav className="header-nav" aria-label="메인 내비게이션">
          <span onClick={() => navigate('/')} className="logo" style={{ cursor: 'pointer' }}>
            La Ligne Hommes<span>라 린느 옴므</span>
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
                  <div className="email-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="email" 
                      id="email" 
                      value={email} 
                      onChange={e => { setEmail(e.target.value); setIsEmailVerified(false); setEmailMessage(''); }} 
                      onBlur={e => handleBlur('email', e.target.value)} 
                      className={errors.email ? 'error' : (isEmailVerified ? 'valid' : '')} 
                      placeholder="example@email.com" 
                      required 
                      disabled={isEmailVerified}
                    />
                    <button 
                      type="button" 
                      onClick={handleCheckEmail}
                      disabled={isEmailVerified}
                      style={{
                        background: isEmailVerified ? '#555' : '#111', 
                        color: '#fff', 
                        border: '1px solid #8f8576', 
                        padding: '0 16px',
                        fontSize: '12px', 
                        fontWeight: '600', 
                        cursor: isEmailVerified ? 'not-allowed' : 'pointer', 
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isEmailVerified ? '확인 완료' : '중복 확인'}
                    </button>
                  </div>
                  {emailMessage && (
                    <span style={{ 
                      color: isEmailVerified ? '#27ae60' : '#c0392b', 
                      fontSize: '11px', 
                      marginTop: '4px', 
                      display: 'block',
                      fontWeight: '500'
                    }}>
                      {isEmailVerified ? '✓ ' : '✕ '}{emailMessage}
                    </span>
                  )}
                  <span className={`field-error ${errors.email ? 'visible' : ''}`} role="alert">올바른 이메일 주소를 입력하고 중복 확인을 완료해 주세요.</span>
                </div>

                {/* 📱 휴대폰 번호 */}
                <div className="field">
                  <label htmlFor="phone">휴대폰 번호 <span className="required" aria-hidden="true">*</span></label>
                  <div className="phone-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="tel" 
                      id="phone" 
                      value={phone} 
                      onChange={handlePhoneChange} 
                      disabled={isVerified} 
                      placeholder="010-0000-0000" 
                      className={isVerified ? 'valid' : ''}
                    />
                    <button 
                      type="button" 
                      onClick={handleRequestSmsCode}
                      disabled={isVerified || isSmsCooltime}
                      style={{
                        background: (isVerified || isSmsCooltime) ? '#555' : '#111', 
                        color: '#fff', 
                        border: '1px solid #8f8576', 
                        padding: '0 16px',
                        fontSize: '12px', 
                        fontWeight: '600', 
                        cursor: (isVerified || isSmsCooltime) ? 'not-allowed' : 'pointer', 
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isSmsCooltime ? `${cooltimeSeconds}초 후 가능` : isCodeSent ? '재발송' : '인증 요청'}
                    </button>
                  </div>
                  <span className="field-hint">숫자만 입력하시면 자동으로 하이픈이 추가됩니다.</span>

                  {isCodeSent && !isVerified && (
                    <div className="verification-input-row" style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input 
                          type="text" 
                          value={verificationCode} 
                          onChange={e => setVerificationCode(e.target.value)}
                          placeholder="인증번호 6자리" 
                          maxLength={6}
                          style={{ width: '100%' }}
                        />
                        <span style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          fontSize: '12px', color: '#c0392b', fontWeight: 'bold'
                        }}>
                          {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleVerifySmsCode}
                        style={{
                          background: 'var(--color-gold, #8f8576)', color: '#fff', border: 'none', padding: '0 16px',
                          fontSize: '12px', fontweight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                          minWidth: '85px'
                        }}
                      >
                        확인
                      </button>
                    </div>
                  )}
                  
                  {(!agreeTerms || !agreePrivacy) && !isVerified && (
                    <span style={{ color: '#e67e22', fontSize: '11px', marginTop: '4px', display: 'block', fontweight: '500' }}>
                      💡 하단의 [이용약관 및 개인정보 처리방침]에 필수 동의하셔야 인증번호 발송이 가능합니다.
                    </span>
                  )}
                  {smsError && <span style={{ color: '#c0392b', fontSize: '11px', marginTop: '4px', display: 'block' }}>{smsError}</span>}
                  {isVerified && <span style={{ color: '#27ae60', fontSize: '11px', marginTop: '4px', display: 'block' }}>✓ 휴대폰 번호가 정상 인증되었습니다.</span>}
                  <span className={`field-error ${errors.phoneVerify ? 'visible' : ''}`} role="alert">가입을 위해 휴대폰 인증을 완료해 주세요.</span>
                </div>

                {/* 기본 배송지 주소 */}
                <div className="field">
                  <label htmlFor="address">기본 배송지 주소 <span className="required" aria-hidden="true">*</span></label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      id="address" 
                      value={address} 
                      readOnly 
                      onClick={handleOpenPostcode} 
                      className={errors.address ? 'error' : address ? 'valid' : ''} 
                      placeholder="주소 검색 버튼을 눌러주세요" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={handleOpenPostcode} 
                      style={{ 
                        background: '#111', color: '#fff', border: '1px solid #8f8576', padding: '0 16px', 
                        fontSize: '12px', fontweight: '600', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.05em'
                      }}
                    >
                      주소 검색
                    </button>
                  </div>
                  
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
                    <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={e => { setPassword(e.target.value); handleBlur('password', e.target.value); }} onBlur={e => handleBlur('password', e.target.value)} className={errors.password ? 'error' : (passwordScore >= 4 ? 'valid' : '')} placeholder="영문, 숫자, 특수문자 조합 8자 이상" required />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? '숨김' : '표시'}</button>
                  </div>
                  <div className="strength-bar" aria-hidden="true">
                    {[1, 2, 3, 4].map(num => (
                      <div key={num} className="strength-segment" style={{ background: num <= passwordScore ? strengthColors[passwordScore - 1] : 'var(--color-border)' }}></div>
                    ))}
                  </div>
                  <span className="strength-label">{password.length > 0 ? strengthTexts[passwordScore] : ''}</span>
                  <span className={`field-error ${errors.password ? 'visible' : ''}`} role="alert">비밀번호는 영문, 숫자, 특수문자(@$!%*#?&)를 혼합하여 8자 이상이어야 합니다.</span>
                </div>

                {/* 비밀번호 확인 */}
                <div className="field">
                  <label htmlFor="password-confirm">비밀번호 확인 <span className="required" aria-hidden="true">*</span></label>
                  <div className="password-wrap">
                    <input type={showPasswordConfirm ? 'text' : 'password'} id="password-confirm" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} onBlur={e => handleBlur('passwordConfirm', e.target.value)} className={errors.passwordConfirm ? 'error' : (passwordConfirm && passwordConfirm === password ? 'valid' : '')} placeholder="비밀번호를 다시 입력하세요" required />
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
                  <textarea 
                    className="agree-textarea-board"
                    readOnly 
                    value={LALIGN_TERMS_TEXT} 
                    style={{ width: '100%', height: '110px', background: '#1a1a1a', color: '#aaa', border: '1px solid #333', padding: '8px', fontSize: '11px', lineHeight: '1.5', resize: 'none', marginBottom: '12px', marginTop: '4px', outline: 'none' }}
                  />

                  <label className="checkbox-label">
                    <input type="checkbox" checked={agreePrivacy} onChange={e => setAgreePrivacy(e.target.checked)} required />
                    <span><span className="agree-badge">필수</span> <span className="agree-link">개인정보 처리방침</span>에 동의합니다.</span>
                  </label>
                  <textarea 
                    className="agree-textarea-board"
                    readOnly 
                    value={LALIGN_PRIVACY_TEXT} 
                    style={{ width: '100%', height: '110px', background: '#1a1a1a', color: '#aaa', border: '1px solid #333', padding: '8px', fontSize: '11px', lineHeight: '1.5', resize: 'none', marginBottom: '12px', marginTop: '4px', outline: 'none' }}
                  />

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
        <p>&copy; 2025 La Ligne Hommes. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Signup;