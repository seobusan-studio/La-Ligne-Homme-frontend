import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GuestOrderLookup.css';

const GuestOrderLookup: React.FC = () => {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [password, setPassword] = useState('');
  const [orderData, setOrderData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !password) return;

    setLoading(true);
    setOrderData(null);

    try {
      // 🌟 아까 백엔드 OrderController에 증설해둔 검증용 GET endpoint 명세 호출 가동
      const response = await fetch(
        `http://localhost:8080/api/orders/non-member?orderNumber=${encodeURIComponent(orderNumber)}&password=${encodeURIComponent(password)}`
      );
      const result = await response.json();

      if (response.ok && result.status !== 'ERROR') {
        setOrderData(result.data);
      } else {
        alert(result.message || '주문 정보가 일치하지 않거나 패스워드 장벽을 넘지 못했습니다.');
      }
    } catch (err) {
      alert('백엔드 서버 연동 레이어 통신 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lookup-page-container">
      <header className="lookup-header">
        <h1>GUEST ORDER TRACKING</h1>
        <p>비회원 주문서 및 실시간 배송 흐름 교차 검증 센터입니다.</p>
      </header>

      <div className="lookup-main-wrapper">
        {/* 왼편: 검색 폼 입력 구역 */}
        <form onSubmit={handleLookupSubmit} className="lookup-form-card">
          <h3>비회원 인증조회 명세</h3>
          <div className="lookup-input-group">
            <label>주문 번호 (예: LLH-XXXXXX)</label>
            <input 
              type="text" 
              value={orderNumber} 
              onChange={(e) => setOrderNumber(e.target.value)} 
              placeholder="발급받으신 고유 주문코드 기입" 
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
            {loading ? '교차 검증 중...' : '주문 내역 조회하기'}
          </button>
        </form>

        {/* 오른편: 성공 시 띄워줄 실시간 영수증 명세 출력 바인딩 보드 */}
        <div className="lookup-result-section">
          {orderData ? (
            <div className="receipt-card animate-fade">
              <h3>INVOICE SPEC (주문 영수증 명세)</h3>
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
                <span>최종 정산 금액</span>
                <span className="price-tag">₩{Number(orderData.totalPrice).toLocaleString()}</span>
              </div>
              <div className="receipt-row" style={{ marginTop: '15px' }}>
                <span>실시간 배송 동향</span>
                <span className={`status-badge ${orderData.status === 'DELIVERED' || orderData.status === '배송완료' ? 'delivered' : 'shipping'}`}>
                  {orderData.status || '배송준비중'}
                </span>
              </div>
            </div>
          ) : (
            <div className="receipt-placeholder-box">
              <p>주문 번호와 패스워드를 기입하시면 백엔드 DB의 실시간 배송 및 원장 팩트 정보가 이곳에 바인딩됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestOrderLookup;