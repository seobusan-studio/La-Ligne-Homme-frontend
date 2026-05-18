import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('고객');
  const [orderList, setOrderList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🌟 [신설] 하드코딩 완전 소거용 동적 유저 프로필 상태창 개통
  const [userProfile, setUserProfile] = useState({
    membershipGrade: 'BLACK NOBLESSE',
    availablePoints: 0,
    couponCount: 0
  });

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

    // 🌟 [신설] 회원의 실시간 적립금, 쿠폰 갯수, 등급 정보를 백엔드 원장에서 동적 인양
    fetch(`http://localhost:8080/api/users/profile?email=${session.email || ''}`)
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setUserProfile({
            membershipGrade: result.data.membershipGrade || 'BLACK NOBLESSE',
            availablePoints: result.data.availablePoints || 0,
            couponCount: result.data.couponCount || 0
          });
        }
      })
      .catch(() => console.log('프로필 동적 원장 통신 대기 중...'));

    /* =========================================================================
     * 🚨 [급소 교정 완료 - URL 동기화 및 실시간 필터 가드선 정밀 타격]
     * 기존의 잘못된 경로('/api/admin/orders')를 실제 백엔드 이정표인 '/api/admin/orders/list'로 완벽 동기화했습니다.
     * ========================================================================= */
    fetch('http://localhost:8080/api/admin/orders/list')
      .then(res => res.json())
      .then(result => {
        // 세션 성명값에 종속된 실제 주문 데이터 팩트만 필터링 바인딩
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
      
      {/* 라 린느 옴므 프라이빗 프레임워크 내비게이션 탑 액션 바 (원형 사수) */}
      <div className="mypage-top-nav-belt" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '35px',
        paddingBottom: '15px',
        borderBottom: '1px solid #1a1a1a'
      }}>
        <div className="nav-left-brand" style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#fff', fontWeight: '700' }}>
          LA LIGNE HOMME
        </div>
        
        <div className="nav-right-actions" style={{ display: 'flex', gap: '24px' }}>
          <span 
            onClick={() => navigate('/')} 
            style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#8f8576', cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#8f8576'}
          >
            HOME (메인 홈)
          </span>

          <span 
            onClick={() => navigate('/cart')} 
            style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#8f8576', cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#8f8576'}
          >
            BAG (장바구니)
          </span>

          <span 
            onClick={() => {
              const element = document.getElementById('my-orders-zone');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }} 
            style={{ fontSize: '11px', letterSpacing: '0.1em', color: '#fff', cursor: 'pointer', fontWeight: '700', borderBottom: '1px solid #fff', paddingBottom: '2px' }}
          >
            ORDERS (주문/결제 내역)
          </span>
        </div>
      </div>

      <header className="mypage-header">
        <span className="welcome-tag">Maison La Ligne Private Lounge</span>
        <h1>{userName}님의 마이페이지</h1>
        <p>고객님의 프리미엄 멤버십 등급과 주문 배송 흐름을 실시간 추적합니다.</p>
      </header>

      {/* 🌟 멥버십 대시보드 구역 (DB 실제 데이터로 완전 동적 치환 완결) */}
      <section className="membership-summary-board">
        <div className="member-card">
          <h4>MEMBERSHIP</h4>
          <p className="grade">{userProfile.membershipGrade}</p>
        </div>
        <div className="member-card">
          <h4>가용 적립금</h4>
          <p className="value">₩ {userProfile.availablePoints.toLocaleString()}</p>
        </div>
        <div className="member-card">
          <h4>보유 쿠폰</h4>
          <p className="value">{userProfile.couponCount} 장</p>
        </div>
      </section>

      {/* 주문 내역 내역 테이블 */}
      <section className="my-orders-section" id="my-orders-zone">
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
                    <td className="prod-title-cell">
                      {order.items && order.items.length > 0 
                        ? `${order.items[0].productName} ${order.items.length > 1 ? `외 ${order.items.length - 1}건` : ''}` 
                        : (order.productSummary || order.itemName || '라 린느 옴므 프리미엄 컬렉션')
                      }
                    </td>
                    <td className="price-bold">₩{(order.price || order.totalPrice || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span className={`status-badge ${order.status === '배송완료' ? 'delivered' : order.status === '주문취소' ? 'cancelled' : 'shipping'}`}>
                          {order.status || '주문접수'}
                        </span>
                        
                        {/* =========================================================================
                         * 🌟 [신설 - 진짜 쇼핑몰용 택배사 및 송장 트래킹 인포메이션 뷰포트 배치]
                         * 오직 상태가 '배송중' 단계일 때만 백엔드에서 쏴준 택배사명과 고유 송장번호를 실시간 노출합니다.
                         * ========================================================================= */}
                        {order.status === '배송중' && order.trackingNumber && (
                          <span style={{ fontSize: '11px', color: '#8f8576', fontWeight: '500', letterSpacing: '0.02em', marginTop: '2px' }}>
                            📦 {order.courierName || '우체국택배'} : {order.trackingNumber}
                          </span>
                        )}
                      </div>
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