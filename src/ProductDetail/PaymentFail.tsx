import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Checkout.css';

const PaymentFail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="checkout-page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
      <header className="checkout-header">
        <h1 style={{ color: '#c0392b' }}>PAYMENT FAILED</h1>
        <p>결제 처리 중 오류가 발생하여 중단되었습니다.</p>
      </header>

      <div className="checkout-box" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>실패 사유</h3>
        <div style={{ padding: '20px 0', lineHeight: '2' }}>
          <p><strong>에러 코드:</strong> {code}</p>
          <p><strong>메시지:</strong> {message}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button 
            onClick={() => navigate('/cart')} 
            className="btn-payment-execute"
            style={{ background: '#555' }}
          >
            장바구니로 돌아가기
          </button>
          <button 
            onClick={() => navigate('/checkout')} 
            className="btn-payment-execute"
          >
            다시 결제하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFail;
