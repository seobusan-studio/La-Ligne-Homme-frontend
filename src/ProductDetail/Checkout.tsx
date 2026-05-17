import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Checkout.css';

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { selectedItems = [], totalAmount = 0, deliveryFee = 0 } = (location.state || {}) as any;

  // 🌟 [추가] 로그인 여부 상태판별 및 비회원 전용 주문 비밀번호 상태창 생성
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [nonMemberPw, setNonMemberPw] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryMemo, setDeliveryMemo] = useState('문 앞에 놓아주세요.');

  useEffect(() => {
    if (selectedItems.length === 0) {
      alert('결제 대상 상품이 유실되었습니다. 장바구니로 복귀합니다.');
      navigate('/cart');
      return;
    }

    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      setIsLoggedIn(true); // 회원 로그인 상태 활성화
      if (session.name) setReceiverName(session.name);
    }
  }, [selectedItems, navigate]);

  const handleFinalPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName || !receiverPhone || !deliveryAddress) {
      alert('안전한 명품 배송을 위해 배송지 명세를 성실히 기입해 주십시오.');
      return;
    }

    // 🌟 [추가] 비회원일 경우 비밀번호 기입 여부 2차 방어벽
    if (!isLoggedIn && !nonMemberPw) {
      alert('나중에 주문 내역을 조회하기 위해 비회원 주문 비밀번호를 반드시 입력해 주세요.');
      return;
    }

    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;

    // 🌟 [교정] 하드코딩 '1234'를 완벽히 걷어내고, 사용자가 직접 폼에 친 비밀번호(nonMemberPw)를 동적 바인딩!
    const orderRequestDto = {
      userId: session ? (session.id || session.userId || null) : null,
      nonMemberPw: isLoggedIn ? null : nonMemberPw, // 회원이면 null, 비회원이면 입력한 비번 주입
      receiverName: receiverName,
      receiverPhone: receiverPhone,
      deliveryAddress: deliveryAddress,
      deliveryMemo: deliveryMemo,
      items: selectedItems.map((item: any) => ({
        optionId: item.optionId || 1,
        quantity: item.quantity,
        orderPrice: item.price
      }))
    };

    try {
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderRequestDto)
      });

      const result = await response.json();
      if (response.ok && result.status !== 'ERROR') {
        alert('🎉 주문 승인 및 결제가 성공적으로 처리 완료되었습니다.');
        
        // 본인 계정(혹은 guest)의 장바구니함에서 구매 완료된 물건만 도려내어 청소 (오리지널 유지)
        const userIdentifier = session ? (session.name || session.id || 'user') : 'guest';
        const dynamicCartKey = `laligne_cart_${userIdentifier}`;
        
        const localCart = JSON.parse(localStorage.getItem(dynamicCartKey) || '[]');
        const remainingCart = localCart.filter((localItem: any) => 
          !selectedItems.some((sel: any) => sel.id === localItem.id && sel.size === localItem.size)
        );
        localStorage.setItem(dynamicCartKey, JSON.stringify(remainingCart));

        // 비회원이면 마이페이지로 가면 세션 튕기니까 홈으로 보내거나 전용 안내 창구로 유도
        if (isLoggedIn) {
          navigate('/mypage');
        } else {
          alert(`비회원 주문번호 조회를 위해 홈화면으로 이동합니다.\n설정하신 비밀번호를 꼭 기억해 주세요!`);
          navigate('/');
        }
      } else {
        alert(`결제 실패: ${result.message || '창고 재고 수량 초과'}`);
      }
    } catch (err) {
      alert('백엔드 정문 코어 결제 모듈 통신 실패');
    }
  };

  return (
    <div className="checkout-page-container">
      <header className="checkout-header">
        <h1>ORDER &amp; CHECKOUT</h1>
        <p>안전한 보안 결제 시스템을 통한 라 린느 옴므 최종 수주 단계입니다.</p>
      </header>

      <div className="checkout-main-wrapper">
        <form onSubmit={handleFinalPaymentSubmit} className="checkout-form-section">
          <div className="checkout-box">
            <h3>DELIVERY INFO (배송지 명세 작성)</h3>
            
            {/* 🌟 [보존형 추가] 로그인 안 한 비회원일 때만 주소창 맨 위에 패스워드 설정 칸 출력 */}
            {!isLoggedIn && (
              <div className="checkout-input-group" style={{ marginBottom: '25px', padding: '15px', background: '#fcfcfc', border: '1px stroke #eee' }}>
                <label style={{ color: '#8f8576', fontWeight: 'bold' }}>비회원 주문 비밀번호 설정</label>
                <input 
                  type="password" 
                  value={nonMemberPw} 
                  onChange={(e) => setNonMemberPw(e.target.value)} 
                  placeholder="나중에 주문 조회할 때 쓸 비밀번호 입력" 
                  required 
                />
              </div>
            )}

            <div className="checkout-input-group">
              <label>수령인 성명</label>
              <input type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} required />
            </div>
            <div className="checkout-input-group">
              <label>연락처</label>
              <input type="tel" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="010-0000-0000" required />
            </div>
            <div className="checkout-input-group">
              <label>배송지 상세 주소</label>
              <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="번지 및 동·호수 상세 기입" required />
            </div>
            <div className="checkout-input-group">
              <label>배송 요청 사항</label>
              <input type="text" value={deliveryMemo} onChange={(e) => setDeliveryMemo(e.target.value)} />
            </div>
          </div>
        </form>

        <div className="checkout-summary-section">
          <div className="final-summary-card">
            <h3>FINAL CHECK</h3>
            
            <div className="checkout-preview-list">
              {selectedItems.map((item: any, idx: number) => (
                <div key={idx} className="preview-item-row">
                  <span>{item.name} (SZ: {item.size}) x {item.quantity}</span>
                  <span>₩{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="checkout-divider"></div>

            <div className="summary-row">
              <span>선택 상품 총액</span>
              <span>₩{totalAmount.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>{deliveryFee === 0 ? 'FREE' : `₩${deliveryFee.toLocaleString()}`}</span>
            </div>

            <div className="checkout-divider"></div>

            <div className="summary-row final-total-row">
              <span>최종 결제 금액</span>
              <span>₩{(totalAmount + deliveryFee).toLocaleString()}</span>
            </div>

            <button type="button" onClick={handleFinalPaymentSubmit} className="btn-payment-execute">
              CONFIRM &amp; PAY (최종 결제 승인하기)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;