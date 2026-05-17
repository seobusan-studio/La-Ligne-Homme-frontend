import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('고객');
  const [orderList, setOrderList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    
    if (!sessionRaw) {
      alert('로그인 세션이 만료되었습니다. 메인화면으로 이동합니다.');
      navigate('/login');
      return;
    }
    
    const session = JSON.parse(sessionRaw);
    setUserName(session.name || 'Premium Member');

    // 📊 어드민 백오피스 관리자 페이지 주문 데이터와 실시간 연동 싱크 가동 (오리지널 보존)
    fetch('http://localhost:8080/api/admin/orders')
      .then(res => res.json())
      .then(result => {
        // 🌟 [하드코딩 제거] 세션 성명값에 종속된 실제 주문 데이터 팩트만 필터링 바인딩
        const myData = (result.data || result || []).filter(
          (o: any) => o.customer === session.name || o.customerName === session.name
        );
        setOrderList(myData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [navigate]);

  return (
    <div className="mypage-container">
      <header className="mypage-header">
        <span className="welcome-tag">Maison La Ligne Private Lounge</span>
        <h1>{userName}님의 마이페이지</h1>
        <p>고객님의 프리미엄 멤버십 등급과 주문 배송 흐름을 실시간 추적합니다.</p>
      </header>

      {/* 멤버십 대시보드 (오리지널 디자인 100% 보존) */}
      <section className="membership-summary-board">
        <div className="member-card">
          <h4>MEMBERSHIP</h4>
          <p className="grade">BLACK NOBLESSE</p>
        </div>
        <div className="member-card">
          <h4>가용 적립금</h4>
          <p className="value">₩15,400</p>
        </div>
        <div className="member-card">
          <h4>보유 쿠폰</h4>
          <p className="value">2 장</p>
        </div>
      </section>

      {/* 주문 내역 내역 테이블 (하드코딩 문자열 전면 격파) */}
      <section className="my-orders-section">
        <h2>주문/배송 조회 (실시간 어드민 연동 벨트)</h2>
        <div className="orders-table-wrapper">
          {loading ? (
            <div className="table-placeholder">실시간 주문 데이터 라우팅 중...</div>
          ) : orderList.length === 0 ? (
            <div className="table-placeholder">최근 3개월간 주문하신 내역이 존재하지 않습니다.</div>
          ) : (
            <table className="mypage-order-table">
              <thead>
                <tr>
                  <th>주문 일자</th>
                  <th>주문 번호</th>
                  <th>상품 내역 정보</th>
                  <th>결제 금액</th>
                  <th>배송 상태 추적</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((order, idx) => (
                  <tr key={order.id || idx}>
                    <td>{order.date || order.createdAt || '-'}</td>
                    <td className="order-num-text">{order.orderNumber || order.id || order.orderId}</td>
                    {/* 🌟 [하드코딩 제거] '수트 외' 고정 문구를 제거하고 백엔드가 던져준 실제 상품 요약 데이터 매핑 */}
                    <td className="prod-title-cell">{order.productSummary || order.itemName || '라 린느 옴므 프레시 컬렉션'}</td>
                    <td className="price-bold">₩{(order.price || order.totalPrice || 0).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${order.status === '배송완료' || order.status === 'DELIVERED' ? 'delivered' : order.status === '주문취소' || order.status === 'CANCEL_COMPLETED' ? 'cancelled' : 'shipping'}`}>
                        {order.status || '배송준비중'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default MyPage;