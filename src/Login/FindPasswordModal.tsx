import { apiFetch } from '../lib/api';
import React, { useState } from 'react';
import './FindPasswordModal.css';
interface Props { isOpen: boolean; onClose: () => void; }
export const FindPasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [proofToken, setProofToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const post = async (path: string, body: object) => {
    const response = await apiFetch(`${import.meta.env.VITE_API_URL}/api/auth/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || '요청을 처리하지 못했습니다.');
    return result.data;
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true);
    const identity = { email: email.trim(), phone: phone.replace(/\D/g, '') };
    try {
      if (!sent) { await post('find-password', identity); setSent(true); }
      else {
        if (new TextEncoder().encode(password).length > 72) throw new Error('비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.');
        const token = proofToken || (await post('sms/verify', { ...identity, code, purpose: 'RESET' })).verificationToken;
        setProofToken(token);
        await post('reset-password', { ...identity, verificationToken: token, newPassword: password });
        alert('비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.');
        setProofToken(''); setSent(false); setCode(''); setPassword(''); onClose();
      }
    } catch (e) { setError(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.'); }
    finally { setLoading(false); }
  };
  return <div className="modal-overlay-box"><div className="modal-content-panel" role="dialog" aria-modal="true" aria-labelledby="reset-title">
    <div className="modal-header-zone"><h2 id="reset-title" className="modal-title">비밀번호 재설정</h2>
    <p className="modal-desc">{sent ? '알림톡의 6자리 임시 비밀번호를 아래에 입력하고 새 비밀번호를 설정해 주세요. 확인 전까지 기존 비밀번호는 유지됩니다.' : '가입한 이메일과 휴대폰 번호로 본인 확인 후 새 비밀번호를 설정합니다.'}</p></div>
    <form onSubmit={submit} className="modal-form">
      <div className="modal-field"><label htmlFor="reset-email">이메일</label><input id="reset-email" type="email" required value={email} disabled={loading || sent} onChange={e => setEmail(e.target.value)} /></div>
      <div className="modal-field"><label htmlFor="reset-phone">휴대폰 번호</label><input id="reset-phone" type="tel" required value={phone} disabled={loading || sent} onChange={e => setPhone(e.target.value)} /></div>
      {sent && <><div className="modal-field"><label htmlFor="reset-code">전송받은 임시 비밀번호 (3분 이내)</label><input id="reset-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></div>
      <div className="modal-field"><label htmlFor="reset-password">새 비밀번호 (8자 이상)</label><input id="reset-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></div></>}
      {sent && <button type="button" disabled={loading} onClick={() => {setSent(false);setProofToken('');setCode('');setError('');}}>인증 다시 시작</button>}
      {error && <p className="modal-error-msg" role="alert">{error}</p>}
      <div className="modal-btn-row"><button type="button" className="modal-btn-cancel" disabled={loading} onClick={() => {setProofToken('');setSent(false);setCode('');setPassword('');onClose();}}>취소</button>
      <button className="modal-btn-submit" disabled={loading}>{loading ? '처리 중…' : sent ? '비밀번호 변경' : '인증용 임시 비밀번호 받기'}</button></div>
    </form></div></div>;
};
