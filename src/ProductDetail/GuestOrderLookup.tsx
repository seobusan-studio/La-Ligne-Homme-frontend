import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GuestOrderLookup.css';

const GuestOrderLookup: React.FC = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [password, setPassword] = useState('');
  const [orderData, setOrderData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // 🌟 상태값 한글 변환 엔진
  const getStatusKr = (status: string) => {
    switch(status) {
      case 'PENDING': return '주문접수';
      case 'PAYMENT_COMPLETE': return '결제완료';
      case 'PREPARING': return '배송준비중';
      case 'SHIPPING': return '배송중';
      case 'DELIVERED': return '배송완료';
      case 'CANCEL_COMPLETED': return '주문취소';
      default: return '배송준비중';
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !password) return;

    setLoading(true);
    setOrderData(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/non-member?orderNumber=${encodeURIComponent(orderNumber)}&password=${encodeURIComponent(password)}`
      );
      const result = await response.json();

      if (response.ok && result.status !== 'ERROR') {
        setOrderData(result.data);
      } else {
        alert(result.message || '주문 번호 또는 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      console.error('비회원 주문 조회 실패', err);
      alert('주문 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lookup-page-container">
      <header className="lookup-header">
        <h1>GUEST ORDER TRACKING</h1>
        <p>주문 번호와 비밀번호로 주문 내역과 배송 상태를 확인하실 수 있습니다.</p>
        {/* 🌟 홈으로 돌아가기 버튼 추가 */}
        <button type="button" className="btn-home-return" onClick={() => navigate('/')}>
          메인 홈으로 돌아가기
        </button>
      </header>

      <div className="lookup-main-wrapper">
        <form onSubmit={handleLookupSubmit} className="lookup-form-card">
          <h3>비회원 주문 조회</h3>
          <div className="lookup-input-group">
            <label>주문 번호 (예: LLH-XXXXXX)</label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="문자로 받으신 주문 번호를 입력해 주세요"
              required
            />
          </div>
          <div className="lookup-input-group">
            <label>주문 비밀번호</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="결제 시 설정한 비밀번호 기입" 
              required 
            />
          </div>
          <button type="submit" className="btn-lookup-execute" disabled={loading}>
            {loading ? '조회 중...' : '주문 내역 조회하기'}
          </button>
        </form>

        <div className="lookup-result-section">
          {orderData ? (
            <div className="receipt-card animate-fade">
              <h3>ORDER DETAILS (주문 상세 내역)</h3>
              <div className="receipt-row">
                <span>주문 번호</span>
                <span className="bold-text">{orderData.orderNumber}</span>
              </div>
              <div className="receipt-row">
                <span>수령인 성함</span>
                <span>{orderData.receiverName}</span>
              </div>
              <div className="receipt-row">
                <span>배송지 주소</span>
                <span>{orderData.deliveryAddress}</span>
              </div>
              <div className="receipt-row">
                <span>결제 금액</span>
                <span className="price-tag">₩{Number(orderData.totalPrice).toLocaleString()}</span>
              </div>
              
              <div className="receipt-row" style={{ marginTop: '15px' }}>
                <span>배송 상태</span>
                <span className={`status-badge ${orderData.status === 'DELIVERED' ? 'delivered' : 'shipping'}`}>
                  {getStatusKr(orderData.status)}
                </span>
              </div>

              {(orderData.courierName || orderData.trackingNumber) && (
                <div className="receipt-row" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #333' }}>
                  <span>배송 정보</span>
                  <a 
                    href={`https://search.naver.com/search.naver?query=${encodeURIComponent(orderData.courierName + ' ' + orderData.trackingNumber)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#8f8576', 
                      textDecoration: 'underline', 
                      fontWeight: 'bold',
                      cursor: 'pointer' 
                    }}
                    title="클릭 시 네이버에서 배송 현황을 조회합니다."
                  >
                    {orderData.courierName || '배송사 미지정'} / {orderData.trackingNumber || '송장 미입력'}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="receipt-placeholder-box">
              <p>주문 번호와 비밀번호를 입력하시면,<br />고객님의 소중한 주문 내역과 배송 상태를 확인하실 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestOrderLookup;