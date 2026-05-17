import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  
  // 🌟 현재 세션에 따른 유저 고유 장바구니 스토리지 키 추출용 유틸리티 함수
  const getDynamicCartKey = () => {
    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      return `laligne_cart_${session.name || session.id || 'user'}`;
    }
    return 'laligne_cart_guest';
  };

  useEffect(() => {
    // 🌟 [교정] 로그인 유저 고유 Key에 종속된 아이템 리스트만 정밀 스크리닝 로드
    const dynamicKey = getDynamicCartKey();
    const items = JSON.parse(localStorage.getItem(dynamicKey) || '[]');
    setCartItems(items);
    
    // 장바구니 진입 시 해당 계정의 모든 보관 상품 전체 선택 처리
    const allKeys = items.map((item: any) => `${item.id}_${item.size}`);
    setCheckedKeys(allKeys);
  }, []);

  // 개별 체크박스 토글 핸들러
  const handleCheckboxToggle = (productId: number, size: string) => {
    const targetKey = `${productId}_${size}`;
    setCheckedKeys(prev => 
      prev.includes(targetKey) 
        ? prev.filter(key => key !== targetKey) 
        : [...prev, targetKey]
    );
  };

  // 전체 선택 / 전체 해제 토글 핸들러
  const handleAllCheckboxToggle = () => {
    if (checkedKeys.length === cartItems.length) {
      setCheckedKeys([]);
    } else {
      const allKeys = cartItems.map((item: any) => `${item.id}_${item.size}`);
      setCheckedKeys(allKeys);
    }
  };

  // 장바구니 수량 실시간 변경 핸들러
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    setCartItems(updated);
    
    // 🌟 [교정] 타 유저 저장소 훼손 방지용 고유 키 타격 백업
    localStorage.setItem(getDynamicCartKey(), JSON.stringify(updated));
  };

  // 장바구니 단건 삭제 핸들러
  const removeItem = (index: number, productId: number, size: string) => {
    const targetKey = `${productId}_${size}`;
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
    setCheckedKeys(prev => prev.filter(key => key !== targetKey));
    
    // 🌟 [교정] 타 유저 저장소 훼손 방지용 고유 키 타격 백업
    localStorage.setItem(getDynamicCartKey(), JSON.stringify(updated));
  };

  // 선택 상품 금액 실시간 동적 합산 (오리지널 유지)
  const totalAmount = cartItems.reduce((sum, item) => {
    const itemKey = `${item.id}_${item.size}`;
    if (checkedKeys.includes(itemKey)) {
      return sum + (item.price * item.quantity);
    }
    return sum;
  }, 0);

  const deliveryFee = totalAmount >= 100000 || totalAmount === 0 ? 0 : 3000;

  // 결제 페이지(Checkout)로 선택 품목만 들고 라우팅 점프
  const handleGoToCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedItems = cartItems.filter(item => 
      checkedKeys.includes(`${item.id}_${item.size}`)
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
              const isChecked = checkedKeys.includes(`${item.id}_${item.size}`);
              return (
                <div key={`${item.id}_${item.size}`} className={`cart-item-card ${isChecked ? 'item-checked-bg' : 'item-unchecked-blur'}`}>
                  <div className="cart-item-checkbox-zone">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle(item.id, item.size)}
                    />
                  </div>
                  
                  <div 
                    className="cart-item-img" 
                    style={{ backgroundImage: `url("${item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8080${item.imageUrl}`}")` }}
                  ></div>
                  <div className="cart-item-details">
                    <span className="cart-item-brand">{item.brandName}</span>
                    <h3>{item.name}</h3>
                    <p className="cart-item-option">선택 옵션: SIZE {item.size}</p>
                    <span className="cart-item-price">₩{item.price.toLocaleString()}</span>
                  </div>
                  <div className="cart-item-actions">
                    <div className="cart-qty-counter">
                      <button type="button" onClick={() => updateQuantity(idx, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(idx, item.quantity + 1)}>+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(idx, item.id, item.size)} className="btn-item-delete">제거</button>
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
                <span>배송비 (10만 원 이상 무료)</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₩${deliveryFee.toLocaleString()}`}</span>
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