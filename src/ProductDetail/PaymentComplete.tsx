// src/ProductDetail/PaymentComplete.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PaymentComplete.css';

const PaymentComplete: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderNumber, totalAmount, paymentMethod, bankInfo } = location.state || {};

  return (
    <div className="complete-container">
      {/* 🌟 형님이 짜두신 대로 "정상 접수되었습니다" 문구가 아주 격조 있게 중심을 잡고 있습니다! */}
      <h1>ORDER COMPLETE</h1>
      <p>고객님의 소중한 주문이 정상적으로 접수되었습니다.</p>

      <div className="complete-card">
        <div className="complete-row"><span>주문 번호</span><strong>{orderNumber}</strong></div>
        <div className="complete-row"><span>결제 금액</span><strong>₩{Number(totalAmount).toLocaleString()}</strong></div>
        <div className="complete-row"><span>결제 방식</span><strong>{paymentMethod}</strong></div>

        {/* 🌟 무통장입금일 때만 기가 막히게 은행 원장 노출 스위칭 가드가 작동합니다. */}
        {paymentMethod === '무통장입금' && bankInfo && (
          <div className="bank-info-box">
            <p>아래 계좌로 입금해주시면 배송이 시작됩니다.</p>
            <div className="complete-row"><span>입금 계좌</span><strong>{bankInfo.bankName} {bankInfo.accountNumber}</strong></div>
            <div className="complete-row"><span>예금주</span><strong>{bankInfo.depositor}</strong></div>
          </div>
        )}
      </div>

      <button onClick={() => navigate('/')} className="btn-home">메인으로 돌아가기</button>
    </div>
  );
};

export default PaymentComplete;