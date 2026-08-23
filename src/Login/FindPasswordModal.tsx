// src/Login/FindPasswordModal.tsx
import React, { useState } from 'react';
import './FindPasswordModal.css'; // 🌟 [수혈] 분리된 전용 CSS 파일 정밀 결합

interface FindPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FindPasswordModal: React.FC<FindPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 모달이 닫혀있는 상태면 화면 렌더링 인터셉트 탈출
  if (!isOpen) return null;

  // 전화번호 입력 시 숫자만 남기고 자동 하이픈 포맷팅 가드선
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length >= 4 && raw.length < 8) formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    else if (raw.length >= 8) formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
    setPhone(formatted);
    setErrorMsg('');
  };

  const handleFindPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const isEmailValid = email && email.includes('@');
    const rawPhone = phone.replace(/\D/g, '');

    if (!isEmailValid) {
      setErrorMsg('올바른 이메일 주소 형식을 입력해 주세요.');
      return;
    }
    if (rawPhone.length < 10) {
      setErrorMsg('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      /* =========================================================================
       * 💡 [스프링부트 백엔드 오피셜 파이프라인 연격 격발]
       * UserController의 POST /api/auth/find-password 라인을 정밀 타격합니다.
       * ========================================================================= */
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/find-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          phone: rawPhone // 하이픈을 제거한 순수 숫자 원장 사출
        })
      });

      const result = await response.json();

      if (response.ok && (result.status === 'SUCCESS' || result.success)) {
        alert('임시 비밀번호를 카카오 알림톡으로 발송했습니다.\n확인 후 로그인해 주세요.');
        setEmail('');
        setPhone('');
        onClose(); // 성공 시 모달창 폐쇄
      } else {
        setErrorMsg(result.message || '회원 정보가 일치하지 않거나 오류가 발생했습니다.');
      }
    } catch (err) {
      setErrorMsg('임시 비밀번호를 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay-box">
      <div className="modal-content-panel">
        
        <div className="modal-header-zone">
          <p className="modal-eyebrow">Find Password</p>
          <h2 className="modal-title">비밀번호 찾기</h2>
          <p className="modal-desc">
            가입하실 때 사용한 이메일과 휴대폰 번호를 입력하시면 임시 비밀번호를 알림톡으로 보내 드립니다.
          </p>
        </div>

        <form onSubmit={handleFindPasswordSubmit} noValidate className="modal-form">
          
          {/* 이메일 입력 */}
          <div className="modal-field">
            <label>이메일 계정 *</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
              placeholder="example@laligne.com"
              disabled={isLoading}
            />
          </div>

          {/* 휴대폰 번호 입력 */}
          <div className="modal-field">
            <label>휴대폰 번호 *</label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="010-0000-0000"
              disabled={isLoading}
            />
          </div>

          {/* 에러 피드백 벨브 */}
          {errorMsg && (
            <span className="modal-error-msg">
              ⚠️ {errorMsg}
            </span>
          )}

          {/* 제어 버튼 */}
          <div className="modal-btn-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="modal-btn-cancel"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="modal-btn-submit"
            >
              {isLoading ? '전송 처리 중...' : '임시 비밀번호 발급'}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};