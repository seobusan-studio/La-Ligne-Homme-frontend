import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RecentProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('고객');
  const [orderList, setOrderList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 창 닫으면 날아가서 다음 날 데이터 꼬임 없는 안전한 세션 스토리지 기반 최근 본 상품
  const [recentViews, setRecentViews] = useState<RecentProduct[]>([]);

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

    // 세션 스토리지에서 최근 본 목록 인양 (최대 4개)
    const recentRaw = sessionStorage.getItem('laligne_recent_views');
    if (recentRaw) {
      setRecentViews(JSON.parse(recentRaw).slice(0, 4));
    }

    /* =========================================================================
     * 🚨 [기존 백엔드 연동 원본 사수] 실시간 주문 데이터 필터링 라인
     * ========================================================================= */
    fetch('http://localhost:8080/api/admin/orders/list')
      .then(res => res.json())
      .then(result => {
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
    <div className="mypage-container" style={{
      maxWidth: '1240px',
      margin: '0 auto',
      padding: '140px 20px 100px 20px',
      backgroundColor: '#ffffff',
      color: '#111111',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif'
    }}>
      
      {/* [내비게이션 벨트] 3구역 정밀 분할 레이아웃 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        marginBottom: '60px',
        padding: '20px 0',
        borderBottom: '1px solid #111111',
        width: '100%'
      }}>
        {/* 1구역: 좌측 완전 밀착 HOME */}
        <div style={{ textAlign: 'left' }}>
          <span onClick={() => navigate('/')} style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#111111', cursor: 'pointer', fontWeight: '700' }}>
            HOME
          </span>
        </div>
        
        {/* 2구역: 정중앙 고정 하이엔드 로고 */}
        <div style={{ textAlign: 'center' }}>
          <div onClick={() => navigate('/')} style={{ fontSize: '14px', letterSpacing: '0.3em', color: '#8f8576', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', paddingLeft: '0.3em' }}>
            LA LIGNE HOMME
          </div>
        </div>
        
        {/* 3구역: 우측 완전 밀착 ORDERS 스크롤 단추 */}
        <div style={{ textAlign: 'right' }}>
          <span 
            onClick={() => {
              const element = document.getElementById('my-orders-zone');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }} 
            style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#111111', cursor: 'pointer', fontWeight: '700', borderBottom: '1px solid #111111', paddingBottom: '4px' }}
          >
            ORDERS
          </span>
        </div>
      </div>

      {/* [헤더 영역] 상방 3줄 텍스트 유격 시스템 */}
      <header style={{ marginBottom: '65px', borderBottom: '1px solid #111111', paddingBottom: '35px', textAlign: 'left' }}>
        <span style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.15em', color: '#8f8576', fontWeight: '600', textTransform: 'uppercase', marginBottom: '20px' }}>
          Maison La Ligne Private Lounge
        </span>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '400', letterSpacing: '-0.01em', color: '#111111', margin: '0 0 22px 0', lineHeight: '1.2' }}>
          {userName}님의 마이페이지
        </h1>
        <p style={{ margin: '0', fontSize: '0.88rem', color: '#666666', letterSpacing: '0.02em' }}>
          고객님의 주문 배송 흐름을 실시간 추적합니다.
        </p>
      </header>

      {/* 주문 내역 테이블 섹션 */}
      <section id="my-orders-zone" style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '20px', letterSpacing: '-0.01em', color: '#111111', textAlign: 'left' }}>
          주문/배송 조회
        </h2>
        
        <div style={{ borderTop: '2px solid #111111' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999999', fontSize: '0.88rem', borderBottom: '1px solid #eeeeee' }}>
              실시간 주문 데이터 라우팅 중...
            </div>
          ) : orderList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999999', fontSize: '0.88rem', borderBottom: '1px solid #eeeeee' }}>
              최근 주문하신 내역이 존재하지 않습니다.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f7f7f7' }}>
                  <th style={{ padding: '16px', fontWeight: '500', borderBottom: '1px solid #eeeeee', textAlign: 'left', color: '#444444' }}>주문 일자</th>
                  <th style={{ padding: '16px', fontWeight: '500', borderBottom: '1px solid #eeeeee', textAlign: 'left', color: '#444444' }}>주문 번호</th>
                  <th style={{ padding: '16px', fontWeight: '500', borderBottom: '1px solid #eeeeee', textAlign: 'left', color: '#444444' }}>상품 내역 정보</th>
                  <th style={{ padding: '16px', fontWeight: '500', borderBottom: '1px solid #eeeeee', textAlign: 'left', color: '#444444' }}>결제 금액</th>
                  <th style={{ padding: '16px', fontWeight: '500', borderBottom: '1px solid #eeeeee', textAlign: 'center', color: '#444444' }}>배송 상태 추적</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((order, idx) => (
                  <tr key={order.id || idx}>
                    <td style={{ padding: '20px 16px', borderBottom: '1px solid #eeeeee', color: '#333333', textAlign: 'left', verticalAlign: 'middle' }}>{order.date || order.createdAt || '-'}</td>
                    <td style={{ padding: '20px 16px', borderBottom: '1px solid #eeeeee', color: '#555555', textAlign: 'left', fontWeight: '500', verticalAlign: 'middle' }}>{order.orderNumber || order.id || order.orderId}</td>
                    <td style={{ padding: '20px 16px', borderBottom: '1px solid #eeeeee', color: '#111111', textAlign: 'left', verticalAlign: 'middle' }}>
                      {order.items && order.items.length > 0 
                        ? `${order.items[0].productName} ${order.items.length > 1 ? `외 ${order.items.length - 1}건` : ''}` 
                        : (order.productSummary || order.itemName || '라 린느 옴므 프리미엄 컬렉션')
                      }
                    </td>
                    <td style={{ padding: '20px 16px', borderBottom: '1px solid #eeeeee', color: '#111111', textAlign: 'left', fontWeight: '600' , verticalAlign: 'middle'}}>
                      ₩{(order.price || order.totalPrice || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '20px 16px', borderBottom: '1px solid #eeeeee', textAlign: 'center', verticalAlign: 'middle' }}>
                      {/* 🌟 수직 정렬 밸런스를 가독성 높게 보정 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <span className={`status-badge ${order.status === '배송완료' ? 'delivered' : order.status === '주문취소' ? 'cancelled' : 'shipping'}`}>
                          {order.status || '주문접수'}
                        </span>
                        
                        {/* =========================================================================
                         * 🌟 [UI 전면 대개혁 구역 - 인라인 가드 이식]
                         * 사용자가 명확히 누를 수 있는 '버튼 배지' 형태임을 인지하도록 테두리(border)와 배경색을 조율하고,
                         * 마우스 클릭 시 시각적 변화가 일어나는 상용 트랙 스타일 인터셉터를 강제 주입했습니다.
                         * ========================================================================= */}
                        {order.trackingNumber ? (
                          <div 
                            onClick={() => {
                              const courierName = order.courierName || '우체국택배';
                              const trackingNum = order.trackingNumber;
                              const naverSearchUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(courierName + ' ' + trackingNum)}`;
                              window.open(naverSearchUrl, '_blank');
                            }}
                            style={{ 
                              fontSize: '11px', 
                              color: '#555555', 
                              letterSpacing: '0.04em', 
                              cursor: 'pointer',
                              border: '1px solid #cccccc',
                              padding: '6px 14px',
                              backgroundColor: '#ffffff',
                              transition: 'all 0.2s ease-in-out',
                              textAlign: 'center',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              borderRadius: '2px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#111111';
                              e.currentTarget.style.borderColor = '#8f8576';
                              e.currentTarget.style.backgroundColor = '#faf6f0';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#555555';
                              e.currentTarget.style.borderColor = '#cccccc';
                              e.currentTarget.style.backgroundColor = '#ffffff';
                            }}
                            title="클릭하시면 네이버 실시간 배송조회 페이지가 새 창으로 열립니다"
                          >
                            <span>{order.courierName || '우체국택배'}</span>
                            <span style={{ color: '#8f8576', fontWeight: '700' }}>{order.trackingNumber}</span>
                          </div>
                        ) : (
                          // 운송장이 없는 주문접수 상태일 때는 자리를 비워 깔끔하게 가독성 방어
                          <span style={{ fontSize: '11px', color: '#999999', fontStyle: 'italic' }}>송장 발급 대기중</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* [장바구니 배너] */}
        <div style={{
          marginTop: '40px',
          padding: '30px',
          border: '1px solid #eeeeee',
          backgroundColor: '#fcfcfc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'left', flex: '1' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#111111', fontWeight: '500', letterSpacing: '0.02em' }}>
              아직 마무리 짓지 않은 선이 있습니까?
            </h4>
            <p style={{ margin: '0', fontSize: '11px', color: '#777777', letterSpacing: '0.01em', lineHeight: '1.5' }}>
              BAG에 보관 중인 제품들을 확인하고 현대 남성의 완벽한 실루엣을 완성해 보세요.
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <button 
              type="button" 
              className="btn-cart-move-trigger" 
              onClick={() => navigate('/cart')}
              style={{
                background: 'none',
                border: '1px solid #8f8576',
                color: '#8f8576',
                padding: '0 24px',
                fontSize: '11px',
                letterSpacing: '0.08em',
                fontWeight: '600',
                cursor: 'pointer',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              GO TO CART (장바구니 바로가기) &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 최근 본 상품 목록 구역 (세션 스토리지 기반) */}
      {recentViews.length > 0 && (
        <section style={{ marginTop: '70px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '20px', letterSpacing: '-0.01em', color: '#111111' }}>
            최근 본 상품 목록
          </h2>
          <div className="recent-views-grid">
            {recentViews.map((prod) => (
              <div key={prod.id} className="recent-prod-card" onClick={() => navigate(`/product/${prod.id}`)}>
                <div 
                  className="recent-card-img" 
                  style={{ backgroundImage: `url("${prod.imageUrl?.startsWith('http') ? prod.imageUrl : `http://localhost:8080${prod.imageUrl}`}")` }}
                ></div>
                <div className="recent-card-info">
                  <p className="recent-card-name">{prod.name}</p>
                  <p className="recent-card-price">₩ {prod.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

export default MyPage;