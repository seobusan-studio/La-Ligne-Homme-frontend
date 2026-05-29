import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 🌟 현재 세션에 따른 유저 고유 장바구니 스토리지 키 추출용 유틸리티 함수
  const getDynamicCartKey = () => {
    return 'laligne_cart_guest';
  };

  const getSession = () => {
    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return sessionRaw ? JSON.parse(sessionRaw) : null;
  };

  useEffect(() => {
    const fetchCart = async () => {
      const session = getSession();
      
      // 🌟 [로그인 유저] 백엔드 장바구니 DB API 조회
      if (session && session.id) {
        try {
          const res = await fetch('http://localhost:8080/api/carts', {
            headers: { 'X-User-Id': String(session.id) }
          });
          const result = await res.json();
          if (result.success) {
            // 프론트엔드 호환성을 위해 DTO 형식을 기존 localStorage 포맷에 맞춤
            const mappedItems = result.data.map((item: any) => ({
              cartItemId: item.cartItemId, // DB PK 추가
              id: item.productId,
              name: item.productName,
              brandName: 'LA LIGNE HOMMES', // 기본값
              price: item.basePrice + item.extraPrice,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
              optionId: item.optionId
            }));
            setCartItems(mappedItems);
            
            // 모든 항목 체크
            const allKeys = mappedItems.map((item: any) => `${item.id}_${item.size}_${item.color}`);
            setCheckedKeys(allKeys);
          }
        } catch (err) {
          console.error('장바구니 API 로드 실패', err);
        } finally {
          setLoading(false);
        }
      } else {
        // 🌟 [비회원/게스트] 로컬 스토리지 사용
        const items = JSON.parse(localStorage.getItem(getDynamicCartKey()) || '[]');
        setCartItems(items);
        const allKeys = items.map((item: any) => `${item.id}_${item.size}_${item.color}`);
        setCheckedKeys(allKeys);
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // 개별 체크박스 토글 핸들러
  const handleCheckboxToggle = (productId: number, size: string, color: string = '기본') => {
    const targetKey = `${productId}_${size}_${color}`;
    const isChecked = checkedKeys.includes(targetKey);
    setCheckedKeys(prev => 
      isChecked 
        ? prev.filter(key => key !== targetKey) 
        : [...prev, targetKey]
    );
  };

  // 전체 선택 / 전체 해제 토글 핸들러
  const handleAllCheckboxToggle = () => {
    if (checkedKeys.length === cartItems.length) {
      setCheckedKeys([]);
    } else {
      const allKeys = cartItems.map((item: any) => `${item.id}_${item.size}_${item.color}`);
      setCheckedKeys(allKeys);
    }
  };

  // 장바구니 수량 실시간 변경 핸들러
  const updateQuantity = async (index: number, newQty: number) => {
    if (newQty < 1) return;
    
    const item = cartItems[index];
    const session = getSession();

    if (session && session.id && item.cartItemId) {
      try {
        await fetch(`http://localhost:8080/api/carts/${item.cartItemId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': String(session.id) 
          },
          body: JSON.stringify({ quantity: newQty })
        });
      } catch (err) {
        console.error('수량 업데이트 실패:', err);
        return;
      }
    }

    const updated = [...cartItems];
    updated[index].quantity = newQty;
    setCartItems(updated);
    
    if (!session) {
      localStorage.setItem(getDynamicCartKey(), JSON.stringify(updated));
    }
  };

  // 장바구니 단건 삭제 핸들러
  const removeItem = async (index: number, productId: number, size: string, color: string = '기본') => {
    const item = cartItems[index];
    const session = getSession();

    if (session && session.id && item.cartItemId) {
      try {
        await fetch(`http://localhost:8080/api/carts?ids=${item.cartItemId}`, {
          method: 'DELETE',
          headers: { 'X-User-Id': String(session.id) }
        });
      } catch (err) {
        console.error('삭제 실패:', err);
        return;
      }
    }

    const targetKey = `${productId}_${size}_${color}`;
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
    setCheckedKeys(prev => prev.filter(key => key !== targetKey));
    
    if (!session) {
      localStorage.setItem(getDynamicCartKey(), JSON.stringify(updated));
    }
  };

  // 선택 상품 금액 실시간 동적 합산 (오리지널 유지)
  const totalAmount = cartItems.reduce((sum, item) => {
    const itemKey = `${item.id}_${item.size}_${item.color}`;
    if (checkedKeys.includes(itemKey)) {
      return sum + (item.price * item.quantity);
    }
    return sum;
  }, 0);

  const deliveryFee = 0;

  // 결제 페이지(Checkout)로 선택 품목만 들고 라우팅 점프
  const handleGoToCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedItems = cartItems.filter(item => 
      checkedKeys.includes(`${item.id}_${item.size}_${item.color}`)
    );

    if (selectedItems.length === 0) {
      alert('주문 진행을 위해 결제할 상품을 최소 1개 이상 선택해 주세요.');
      return;
    }

    navigate('/checkout', { 
      state: { 

        selectedItems,
        totalAmount,
        deliveryFee
      } 
    });
  };

  return (
    <div className="cart-page-container">
      
      {/* 🌟 [신설] 하이엔드 무드의 메인 홈 이동 액션 바 그리드 개통 */}
      <div className="cart-top-action-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #1a1a1a'
      }}>
        {/* ◀ CONTINUE SHOPPING (메인 홈화면 복귀 단추) */}
        <div 
          onClick={() => navigate('/')} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '11px', 
            letterSpacing: '0.12em', 
            color: '#8f8576', 
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'color 0.2s, transform 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = 'translateX(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#8f8576';
            e.currentTarget.style.transform = 'translateX(0px)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          CONTINUE SHOPPING (메인 홈으로)
        </div>
      </div>

      <header className="cart-header">
        <h1>SHOPPING BAG</h1>
        <p>선택하신 정제된 실루엣의 컬렉션 예약 보관함입니다.</p>
      </header>

      {cartItems.length > 0 && (
        <div className="cart-select-all-bar">
          <input 
            type="checkbox" 
            id="all-select-check"
            checked={checkedKeys.length === cartItems.length && cartItems.length > 0}
            onChange={handleAllCheckboxToggle}
          />
          <label htmlFor="all-select-check">
            전체선택 ({checkedKeys.length} / {cartItems.length})
          </label>
        </div>
      )}

      <div className="cart-main-wrapper">
        <div className="cart-items-section">
          {cartItems.length === 0 ? (
            <div className="empty-cart-view">
              <p>장바구니가 비어 있습니다.</p>
              <button onClick={() => navigate('/')} className="btn-goto-shop">컬렉션 보러가기</button>
            </div>
          ) : (
            cartItems.map((item, idx) => {
              const targetKey = `${item.id}_${item.size}_${item.color || '기본'}`;
              const isChecked = checkedKeys.includes(targetKey);
              return (
                <div key={targetKey} className={`cart-item-card ${isChecked ? 'item-checked-bg' : 'item-unchecked-blur'}`}>
                  <div className="cart-item-checkbox-zone">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle(item.id, item.size, item.color)}
                    />
                  </div>
                  
                  <div 
                    className="cart-item-img" 
                    style={{ backgroundImage: `url("${item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8080${item.imageUrl}`}")` }}
                  ></div>
                  <div className="cart-item-details">
                    <span className="cart-item-brand">{item.brandName}</span>
                    <h3>{item.name}</h3>
                    {/* 🌟 [교정] SIZE 옵션 옆에 유저가 선택한 색상(COLOR) 명세까지 실시간 유기적 결합 표출 */}
                    <p className="cart-item-option">선택 옵션: SIZE {item.size} / COLOR {item.color || '기본'}</p>
                    <span className="cart-item-price">₩{item.price.toLocaleString()}</span>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-qty-counter">
                      <button type="button" onClick={() => updateQuantity(idx, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(idx, item.quantity + 1)}>+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(idx, item.id, item.size, item.color)} className="btn-item-delete">제거</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-summary-section">
            <div className="summary-card">
              <h3>ORDER SUMMARY</h3>
              <div className="summary-row">
                <span>선택 상품 금액</span>
                <span>₩{totalAmount.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>배송비 무료</span>
                <span>FREE</span>
              </div>
              
              <div className="detail-divider"></div>

              <div className="summary-row total-amount-row">
                <span>최종 결제 금액</span>
                <span>₩{(totalAmount + deliveryFee).toLocaleString()}</span>
              </div>

              <button type="button" onClick={handleGoToCheckout} className="btn-checkout-submit">
                PLACE ORDER ({checkedKeys.length}개 상품 최종 결제하기)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;