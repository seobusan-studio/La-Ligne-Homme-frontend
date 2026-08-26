// src/ProductDetail/MyPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyPage.css'; // 🌟 [개통] 인라인이 철거된 형님의 순정 CSS 명세 전면 수입

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

  /* =========================================================================
   * 🔒 비밀번호 변경 제어 및 입력 코어 엔진
   * ========================================================================= */
  const [isPwFormOpen, setIsPwFormOpen] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [pwError, setPwError] = useState<string>('');
  const [pwSuccess, setPwSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /* =========================================================================
   * 🚚 [신설] 배송 조회 및 교환/반품 모달 제어 상태창
   * ========================================================================= */
  const [claimOrderId, setClaimOrderId] = useState<number | null>(null);
  const [claimType, setClaimType] = useState<'EXCHANGE' | 'RETURN'>('EXCHANGE');
  const [claimReason, setClaimReason] = useState<string>('');

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimOrderId) return;
    if (!claimReason.trim()) {
      alert('교환/반품 사유를 입력해 주세요.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${claimOrderId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimType, reason: claimReason })
      });
      if (response.ok) {
        alert('요청이 정상 접수되었습니다. 관리자 확인 후 처리됩니다.');
        setClaimOrderId(null);
        setClaimReason('');
        window.location.reload();
      } else {
        alert('요청 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('교환/반품 신청 실패', err);
      alert('신청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

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
    fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/list`)
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

  /* =========================================================================
   * 🚀 [보안 대개혁 완료] 최소 8자 + 영문, 숫자, 특수문자 필수 포함 정밀 검증 가드
   * ========================================================================= */
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword) {
      setPwError('현재 비밀번호를 입력해 주세요.');
      return;
    }

    // 🛡️ [철벽 가드 1] 최소 8자 이상 스펙 바인딩
    if (!newPassword || newPassword.length < 8) {
      setPwError('새 비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    // 🛡️ [철벽 가드 2] 영문, 숫자, 특수문자 조합 정규식 피드백 검증 (회원가입 스펙과 싱크로율 100%)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPwError('비밀번호는 영문 대소문자, 숫자, 특수문자($@$!%*#?&)를 모두 포함해야 합니다.');
      return;
    }

    // 🛡️ [철벽 가드 3] 패스워드 불일치 위조 차단
    if (newPassword !== confirmPassword) {
      setPwError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!sessionRaw) return;
    const session = JSON.parse(sessionRaw);

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.email,
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const result = await response.json();

      if (response.ok && (result.status === 'SUCCESS' || result.success)) {
        setPwSuccess('비밀번호가 안전하게 변경되었습니다. 다음 로그인부터 적용됩니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsPwFormOpen(false);
          setPwSuccess('');
        }, 3000);
      } else {
        setPwError(result.message || '현재 비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      setPwError('비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (orderId: number) => {
    if (!window.confirm('주문을 취소하시겠습니까? (관리자 확인 후 최종 결제 취소가 진행됩니다)')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '취소요청' })
      });
      if (response.ok) {
        alert('주문 취소 요청이 정상 접수되었습니다. 관리자 승인 후 결제가 자동 취소됩니다.');
        // 목록 새로고침
        window.location.reload();
      } else {
        alert('취소 요청 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('주문 취소 요청 실패', err);
      alert('취소 요청을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div className="mypage-container">
      
      {/* 🌟 [교정] 형님의 3열 종대 그리드 벨트선 및 정렬 클래스로 전면 대치 */}
      <div className="mypage-top-nav-belt">
        <div className="nav-grid-left">
          <span onClick={() => navigate('/')} className="nav-link-home">
            HOME
          </span>
        </div>
        
        <div className="nav-grid-center">
          <div onClick={() => navigate('/')} className="nav-left-brand">
            LA LIGNE HOMMES
          </div>
        </div>
        
        <div className="nav-grid-right">
          <span 
            onClick={() => {
              const element = document.getElementById('my-orders-zone');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="nav-link-orders"
          >
            ORDERS
          </span>
        </div>
      </div>

      {/* 🌟 [교정] 헤더 영역 인라인 제거 후 형님의 순정 클래스로 복구 + 비밀번호 제어 단추 조립 */}
      <header className="mypage-header mypage-header-flex-layout">
        <div className="mypage-brand-title-group">
          <span className="welcome-tag">
            Maison La Ligne Private Lounge
          </span>
          <h1>{userName}님의 마이페이지</h1>
          <p>고객님의 주문 배송 흐름을 실시간 추적합니다.</p>
        </div>

        {/* 🔒 우측 하단 밸런스에 딱 걸리는 토글 스위치 배정 */}
        <div className="mypage-pw-trigger-box">
          <button
            type="button"
            onClick={() => {
              setIsPwFormOpen(!isPwFormOpen);
              setPwError('');
              setPwSuccess('');
            }}
            className={`btn-password-toggle ${isPwFormOpen ? 'active' : ''}`}
          >
            {isPwFormOpen ? '✖ 변경 취소' : '🔒 비밀번호 변경'}
          </button>
        </div>
      </header>

      {/* 🌟 비밀번호 변경 폼 구역 (전용 확장 클래스 세팅) */}
      {isPwFormOpen && (
        <section className="pw-amend-section">
          <h3 className="pw-amend-title">비밀번호 변경 관리</h3>
          <p className="pw-amend-desc">
            보안 유지를 위해 임시 비밀번호를 변경하시거나 주기적인 개인 정보 갱신을 원하시면 재설정해 주십시오.
          </p>

          <form onSubmit={handleUpdatePassword} className="pw-amend-form">
            <div className="pw-input-field">
              <label>현재 비밀번호</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="현재 임시 패스워드 입력"
                disabled={isSubmitting}
              />
            </div>

            <div className="pw-input-field">
              <label>새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="영문, 숫자, 특수문자 조합 8자 이상 입력" // 💡 힌트 변경 완료
                disabled={isSubmitting}
              />
            </div>

            <div className="pw-input-field">
              <label>새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="새로운 패스워드 재입력"
                disabled={isSubmitting}
              />
            </div>

            {pwError && <span className="pw-status-error-hint">⚠️ {pwError}</span>}
            {pwSuccess && <span className="pw-status-success-hint">✓ {pwSuccess}</span>}

            <button type="submit" disabled={isSubmitting} className="btn-pw-amend-confirm-trigger">
              {isSubmitting ? '변경 중...' : '비밀번호 변경 완료'}
            </button>
          </form>
        </section>
      )}

      {/* 주문 내역 테이블 섹션 */}
      <section id="my-orders-zone" className="my-orders-section">
        <h2>주문/배송 조회</h2>
        
        <div className="orders-table-wrapper">
          {loading ? (
            <div className="table-placeholder">
              주문 내역을 불러오는 중입니다...
            </div>
          ) : orderList.length === 0 ? (
            <div className="table-placeholder">
              최근 주문하신 내역이 존재하지 않습니다.
            </div>
          ) : (
            <table className="mypage-order-table">
              <thead>
                <tr>
                  <th style={{ background: '#f7f7f7' }}>주문 일자</th>
                  <th style={{ background: '#f7f7f7' }}>주문 번호</th>
                  <th style={{ background: '#f7f7f7' }}>상품 내역 정보</th>
                  <th style={{ background: '#f7f7f7' }}>결제 금액</th>
                  <th style={{ background: '#f7f7f7', textAlign: 'center' }}>배송 상태 추적</th>
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
                    <td className="price-bold">
                      ₩{(order.price || order.totalPrice || 0).toLocaleString()}
                    </td>
                    <td>
                      <div className="status-cell-flex">
                        <span className={`status-badge ${order.status === '배송완료' ? 'delivered' : (order.status === '주문취소' || order.status === '취소요청') ? 'cancelled' : 'shipping'}`}>
                          {order.status || '주문접수'}
                        </span>

                        {/* 🌟 [신설] 주문 취소 요청 버튼: 송장 번호가 없고, 아직 취소 상태가 아닐 때만 노출 */}
                        {!order.trackingNumber && order.status !== '주문취소' && order.status !== '취소요청' && (
                          <button 
                            type="button"
                            onClick={() => handleCancelRequest(order.id || order.orderId)}
                            style={{
                              marginLeft: '8px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor: '#fff',
                              border: '1px solid #ddd',
                              color: '#666',
                              cursor: 'pointer',
                              borderRadius: '2px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            취소요청
                          </button>
                        )}
                        
                        {order.trackingNumber ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div 
                              onClick={() => {
                                const trackingNum = order.trackingNumber;
                                // 🌟 [수혈] CJ대한통운 전용 배송조회 팝업 다이렉트 연동
                                const cjSearchUrl = `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${trackingNum}`;
                                window.open(cjSearchUrl, 'cjTrackingWindow', 'width=800,height=800,scrollbars=yes');
                              }}
                              className="tracking-btn-trigger"
                              title="클릭하시면 CJ대한통운 실시간 배송조회 페이지가 새 창으로 열립니다"
                            >
                              <span>{order.courierName || 'CJ대한통운'}</span>
                              <span className="tracking-num-highlight">{order.trackingNumber}</span>
                            </div>
                            
                            {/* 🌟 [신설] 배송중 / 배송완료 상태일 때만 활성화되는 교환/반품 원클릭 버튼 */}
                            {(order.status === '배송중' || order.status === '배송완료') && (
                              <button 
                                type="button"
                                onClick={() => setClaimOrderId(order.id || order.orderId)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  backgroundColor: '#111',
                                  border: '1px solid #111',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  borderRadius: '2px',
                                  whiteSpace: 'nowrap',
                                  marginTop: '4px'
                                }}
                              >
                                교환/반품 신청
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#999999', fontStyle: 'italic', padding: '5px 0' }}>송장 발급 대기중</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 🌟 [신설] 교환/반품 사유 입력 모달 레이어 */}
        {claimOrderId && (
          <div className="claim-modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
            <div className="claim-modal-content" style={{
              background: '#fff', padding: '30px', borderRadius: '4px', width: '400px', maxWidth: '90%'
            }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>교환 및 반품 신청</h3>
              <form onSubmit={handleClaimSubmit}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>신청 구분</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                      <input type="radio" name="claimType" value="EXCHANGE" checked={claimType === 'EXCHANGE'} onChange={() => setClaimType('EXCHANGE')} /> 교환
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                      <input type="radio" name="claimType" value="RETURN" checked={claimType === 'RETURN'} onChange={() => setClaimType('RETURN')} /> 반품
                    </label>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>신청 사유 (필수)</label>
                  <textarea 
                    value={claimReason} 
                    onChange={e => setClaimReason(e.target.value)} 
                    placeholder="사이즈 교환, 단순 변심 등 사유를 상세히 적어주세요."
                    style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid #ddd', resize: 'none', fontSize: '13px' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setClaimOrderId(null)} style={{ flex: 1, padding: '10px', background: '#f5f5f5', border: '1px solid #ddd', cursor: 'pointer' }}>취소</button>
                  <button type="submit" style={{ flex: 1, padding: '10px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>신청 접수</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* [장바구니 배너] ➡️ 형님의 순정 클래스(mypage-cart-banner, cart-banner-text-box) 완벽 이식 */}
        <div className="mypage-cart-banner">
          <div className="cart-banner-text-box">
            <h4>아직 마무리 짓지 않은 선이 있습니까?</h4>
            <p>BAG에 보관 중인 제품들을 확인하고 현대 남성의 완벽한 실루엣을 완성해 보세요.</p>
          </div>
          <div>
            <button 
              type="button" 
              className="btn-cart-move-trigger" 
              onClick={() => navigate('/cart')}
            >
              GO TO CART (장바구니 바로가기) &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 최근 본 상품 목록 구역 */}
      {recentViews.length > 0 && (
        <section className="mypage-recent-views-section">
          <h2>최근 본 상품 목록</h2>
          <div className="recent-views-grid">
            {recentViews.map((prod) => (
              <div key={prod.id} className="recent-prod-card" onClick={() => navigate(`/product/${prod.id}`)}>
                <div 
                  className="recent-card-img" 
                  style={{ backgroundImage: `url("${prod.imageUrl?.startsWith('http') ? prod.imageUrl : `${import.meta.env.VITE_API_URL}${prod.imageUrl}`}")` }}
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