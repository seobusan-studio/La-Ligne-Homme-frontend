// src/ProductDetail/Checkout.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadPaymentWidget } from '@tosspayments/payment-widget-sdk';
import './Checkout.css';

// 'PaymentWidgetInstance'는 타입일 뿐이므로 런타임 오류를 피하기 위해 any로 처리합니다.
type PaymentWidgetInstance = any;

/**
 * 🔑 결제창 클라이언트 키.
 *
 * 이 값은 브라우저에 노출되어도 되는 공개 키이지만, 테스트 키와 운영 키를 코드 수정 없이 바꿔 끼우기 위해
 * 환경 변수(.env 의 VITE_TOSS_CLIENT_KEY)로 관리합니다.
 * 키가 설정되지 않은 환경에서는 온라인 결제 수단 자체를 노출하지 않습니다.
 */
const TOSS_CLIENT_KEY: string = import.meta.env.VITE_TOSS_CLIENT_KEY ?? '';
const IS_ONLINE_PAYMENT_ENABLED = TOSS_CLIENT_KEY.length > 0;

/** 비회원도 결제할 수 있도록 토스가 정해 둔 예약어 */
const ANONYMOUS_CUSTOMER_KEY = 'ANONYMOUS';

/**
 * 주문 번호를 만듭니다.
 * 이 번호는 결제창에 그대로 넘어가고, 서버에서도 같은 번호로 주문이 저장됩니다.
 * (토스 규격: 영문·숫자·하이픈·언더스코어 6~64자)
 */
const createOrderNumber = (): string => {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.toUpperCase();

  return `LLH-${random}`;
};

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 토스페이먼츠 위젯 인스턴스 저장용 레퍼런스
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<any>(null);

  // 🌟 [정밀 교정] 형님의 지시를 적극 준수하여 넘어오는 배송비 변수를 과감히 차단하고 0원 무료배송으로 락다운합니다.
  const { selectedItems = [], totalAmount = 0 } = (location.state || {}) as any;
  const deliveryFee: number = 0;

  // ... (rest of states)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [nonMemberPw, setNonMemberPw] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryMemo, setDeliveryMemo] = useState('문 앞에 놓아주세요.');

  // 사용자가 화면에서 고르는 실시간 결제 방식 상태창 (기본값: 무통장입금)
  const [paymentMethod, setPaymentMethod] = useState<string>('무통장입금');
  const [isWidgetReady, setIsWidgetReady] = useState(false); // 🌟 [신설] 위젯 렌더링 완료 상태

  // 화면에 표시하고 결제창에 넘길 최종 금액
  const paymentAmount: number = totalAmount + deliveryFee;

  /* =========================================================================
   * 결제창(위젯) 초기화
   *
   * 🚨 [교정] 예전에는 금액이 바뀔 때마다 이 효과가 다시 실행되면서
   *    결제창이 화면에 여러 개 겹쳐 그려지고, 그때마다 SDK를 새로 내려받았습니다.
   *    이제는 한 번만 그리고, 금액 변경은 아래의 별도 효과에서 갱신만 합니다.
   * ========================================================================= */
  useEffect(() => {
    if (paymentMethod !== 'ONLINE_PAYMENT') return;
    if (!IS_ONLINE_PAYMENT_ENABLED) return;
    if (paymentWidgetRef.current) return; // 이미 그려져 있으면 다시 그리지 않음

    let isCancelled = false;

    (async () => {
      try {
        const paymentWidget = await loadPaymentWidget(TOSS_CLIENT_KEY, ANONYMOUS_CUSTOMER_KEY);
        if (isCancelled) return;

        // 결제 수단 선택 영역
        const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
          '#payment-method',
          { value: paymentAmount },
          { variantKey: 'DEFAULT' }
        );

        // 이용약관 동의 영역
        paymentWidget.renderAgreement('#agreement', { variantKey: 'AGREEMENT' });

        // 결제창이 완전히 그려진 뒤에야 결제 버튼을 허용합니다.
        paymentMethodsWidget.on('ready', () => setIsWidgetReady(true));

        paymentWidgetRef.current = paymentWidget;
        paymentMethodsWidgetRef.current = paymentMethodsWidget;
      } catch (error) {
        console.error('결제 수단을 불러오지 못했습니다.', error);
        alert('결제 화면을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
      }
    })();

    return () => {
      isCancelled = true;
    };
    // paymentAmount는 아래 효과에서 따로 갱신하므로 의존성에 넣지 않습니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod]);

  // 결제 금액이 바뀌면 이미 그려진 결제창의 금액만 갱신합니다.
  useEffect(() => {
    paymentMethodsWidgetRef.current?.updateAmount?.(paymentAmount);
  }, [paymentAmount]);

  // ... (rest of effects and handlers)

  /* =========================================================================
   * 🌟 [신설 상태창] 배송지 유형 선택 라디오 플래그 및 새로운 배송지 입력용 주소 저장소
   * ========================================================================= */
  const [addressType, setAddressType] = useState<'default' | 'new'>('default');
  const [newAddress, setNewAddress] = useState('');
  const [newDetailAddress, setNewDetailAddress] = useState('');

  // 휴대폰 번호 하이픈 자동 포맷 및 글자수 초과 제한 엔진 (오리지널 유지 및 가입 정보 로드 호환)
  const formatPhoneNumber = (value: string) => {
    const cleanNumbers = value.replace(/[^\d]/g, ''); // 숫자 외 문자 전수 삭제
    const limitedNumbers = cleanNumbers.slice(0, 11); // 최대 11자리 제한으로 초과 버그 원천 차단

    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setReceiverPhone(formatted);
  };

  // Daum 우편번호 서비스 스크립트 동적 인젝션 벨트 사수
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      try { document.head.removeChild(script); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (selectedItems.length === 0) {
      alert('주문할 상품이 없습니다. 장바구니로 이동합니다.');
      navigate('/cart');
      return;
    }

    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      setIsLoggedIn(true); // 회원 로그인 상태 활성화
      if (session.name) setReceiverName(session.name);
      
      // DB에 저장된 전화번호 원장을 즉시 수혈 로드하되, 상단 핸들러를 통해 수정도 전격 허용!
      if (session.phone) {
        setReceiverPhone(formatPhoneNumber(session.phone));
      }
      
      // 회원가입 시 기입해 둔 집 주소가 존재한다면 기본 배송지로 자동 매핑 진입
      if (session.address || session.deliveryAddress) {
        setDeliveryAddress(session.address || session.deliveryAddress);
        setAddressType('default');
      } else {
        setAddressType('new');
      }
    } else {
      setAddressType('new'); // 비회원은 무조건 새로운 배송지 개통
    }
  }, [selectedItems, navigate]);

  // 새로운 배송지 선택 시 구동할 카카오 우편번호 팝업 트래커
  const handleOpenPostcode = () => {
    if ((window as any).daum && (window as any).daum.Postcode) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          let fullRoadAddr = data.roadAddress;
          let extraRoadAddr = '';

          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraRoadAddr += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          if (extraRoadAddr !== '') {
            extraRoadAddr = ` (${extraRoadAddr})`;
          }

          setNewAddress(`[${data.zonecode}] ${fullRoadAddr}${extraRoadAddr}`);
          
          // 주소 꽂히면 상세주소 창으로 자동 포커싱 이동
          const detailInput = document.getElementById('checkout-detail-address');
          if (detailInput) detailInput.focus();
        }
      }).open();
    } else {
      alert('주소 검색을 준비하고 있습니다. 잠시 후 다시 눌러 주세요.');
    }
  };

  const handleFinalPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 선택한 배송지 방식에 맞추어 최종 전송할 단일 주소 텍스트를 실시간 병합 산출
    const finalDeliveryAddress = addressType === 'default' 
      ? deliveryAddress 
      : `${newAddress.trim()} ${newDetailAddress.trim()}`.trim();

    if (!receiverName || !receiverPhone || !finalDeliveryAddress) {
      alert('배송지 정보를 모두 입력해 주세요.');
      return;
    }

    if (!isLoggedIn && !nonMemberPw) {
      alert('나중에 주문 내역을 조회하려면 비회원 주문 비밀번호가 필요합니다.');
      return;
    }

    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;

    const orderRequestDto = {
      userId: session ? (session.id || session.userId || session.userSeq || session.memberId || session.userNo || session.memberNo || session.seq || null) : null,
      nonMemberPw: isLoggedIn ? null : nonMemberPw, 
      receiverName: receiverName,
      receiverPhone: receiverPhone,
      deliveryAddress: finalDeliveryAddress, // 산출된 최종 주소 패킹
      deliveryMemo: deliveryMemo,
      paymentMethod: paymentMethod === 'ONLINE_PAYMENT' ? 'CARD' : paymentMethod,
      items: selectedItems.map((item: any) => ({
        optionId: item.optionId || 1,
        quantity: item.quantity,
        orderPrice: item.price
      }))
    };

    /* =========================================================================
     * 💳 온라인 결제(신용카드·간편결제) — 결제창 열기
     *
     * 주문 번호를 여기서 미리 만들어 결제창에 넘기고, 결제가 끝난 뒤 같은 번호로 서버에 주문이 저장됩니다.
     * 결제 도중 페이지가 토스로 넘어가므로 주문 내용은 잠시 브라우저에 보관해 둡니다.
     * ========================================================================= */
    if (paymentMethod === 'ONLINE_PAYMENT') {
      const paymentWidget = paymentWidgetRef.current;
      if (!paymentWidget || !isWidgetReady) {
        alert('결제 화면을 준비하고 있습니다. 잠시 후 다시 눌러 주세요.');
        return;
      }

      const orderNumber = createOrderNumber();
      const orderName = selectedItems.length > 1
        ? `${selectedItems[0].name} 외 ${selectedItems.length - 1}건`
        : selectedItems[0].name;

      sessionStorage.setItem(`pending_order_${orderNumber}`, JSON.stringify({
        orderRequest: orderRequestDto,
        totalAmount: paymentAmount,
        selectedItems: selectedItems
      }));

      try {
        await paymentWidget.requestPayment({
          orderId: orderNumber,
          orderName: orderName,
          customerName: receiverName,
          customerEmail: session?.email || 'guest@lalignehomme.com',
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
        });
      } catch (error: any) {
        // 고객이 결제창을 그냥 닫은 경우에는 안내를 띄우지 않습니다.
        if (error?.code !== 'USER_CANCEL') {
          console.error('결제 요청 실패', error);
          alert('결제를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
        sessionStorage.removeItem(`pending_order_${orderNumber}`);
      }
      return; // 결제창으로 이동하므로 아래 무통장 처리 로직은 실행하지 않습니다.
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders?paymentMethod=${encodeURIComponent(paymentMethod)}&email=${encodeURIComponent(session?.email || '')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderRequestDto)
      });

      const result = await response.json();
      if (response.ok && result.status !== 'ERROR') {
        
        /* =========================================================================
         * 🌟 [정밀 교정 개통 구역] 결제 수단 분류형 알림창 피드백 분기 가드선
         * ========================================================================= */
        if (paymentMethod === '무통장입금') {
          alert('📋 무통장 주문 접수가 완료되었습니다. 가상계좌로 입금해 주세요.');
        } else {
          alert('🎉 주문 승인 및 카드 결제가 성공적으로 처리 완료되었습니다.');
        }

        const successData = {
          orderNumber: result.data.orderNumber, 
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          bankInfo: paymentMethod === '무통장입금' ? {
            bankName: '국민은행',
            accountNumber: '473801-04-176193',
            depositor: '제니스'
          } : null
        };
        
        const userIdentifier = session ? (session.name || session.id || 'user') : 'guest';
        const dynamicCartKey = `laligne_cart_${userIdentifier}`;
        
        // 🌟 백엔드 연동 회원이면 DB 장바구니에서 구매 항목 삭제 요청
        if (session && session.id) {
          const cartItemIds = selectedItems
            .map((sel: any) => sel.cartItemId)
            .filter((id: any) => id != null);
            
          if (cartItemIds.length > 0) {
            try {
              fetch(`${import.meta.env.VITE_API_URL}/api/carts?ids=${cartItemIds.join(',')}`, {
                method: 'DELETE',
                headers: { 'X-User-Id': String(session.id) }
              });
            } catch (err) {
              console.error('결제 후 장바구니 항목 정리 실패:', err);
            }
          }
        } else {
          // 비회원이면 로컬 스토리지 정리 유지
          const localCart = JSON.parse(localStorage.getItem(dynamicCartKey) || '[]');
          const remainingCart = localCart.filter((localItem: any) => 
            !selectedItems.some((sel: any) => sel.id === localItem.id && sel.size === localItem.size && sel.color === localItem.color)
          );
          localStorage.setItem(dynamicCartKey, JSON.stringify(remainingCart));
        }

        navigate('/payment-complete', { state: successData });
      } else {
        alert(result.message || '주문을 접수하지 못했습니다. 재고 수량을 확인해 주세요.');
      }
    } catch (err) {
      console.error('주문 접수 실패', err);
      alert('주문을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div className="checkout-page-container">
      
      {/* 하이엔드 무드의 뒤로가기 및 메인 이동 액션 바 그리드 사수 */}
      <div className="checkout-top-action-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #1a1a1a'
      }}>
        <div 
          onClick={() => navigate(-1)} 
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
          CONTINUE SHOPPING (이전 화면으로)
        </div>

        <div 
          onClick={() => navigate('/')} 
          style={{ 
            fontSize: '11px', 
            letterSpacing: '0.12em', 
            color: '#8f8576', 
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8f8576')}
        >
          LA LIGNE HOMMES MAIN (메인 홈으로)
        </div>
      </div>

      <header className="checkout-header">
        <h1>ORDER &amp; CHECKOUT</h1>
        <p>배송지와 결제 방법을 확인하신 뒤 주문을 완료해 주세요.</p>
      </header>

      <div className="checkout-main-wrapper">
        <form onSubmit={handleFinalPaymentSubmit} className="checkout-form-section">
          <div className="checkout-box">
            <h3>DELIVERY INFO (배송지 정보)</h3>
            
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
              <input 
                type="tel" 
                value={receiverPhone} 
                onChange={handlePhoneInputChange} 
                placeholder="010-0000-0000" 
                maxLength={13} 
                required 
              />
            </div>

            {/* 회원을 위한 기존 가입 주소 vs 새 주소 분기 토글 라디오 그리드 바인딩 */}
            {isLoggedIn && (
              <div className="checkout-input-group" style={{ display: 'flex', gap: '24px', margin: '20px 0 10px 0', padding: '5px 0' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                  <input 
                    type="radio" 
                    name="addressType" 
                    checked={addressType === 'default'} 
                    onChange={() => setAddressType('default')} 
                    style={{ accentColor: '#8f8576', width: '16px', height: '16px' }}
                  />
                  회원 기본 배송지
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                  <input 
                    type="radio" 
                    name="addressType" 
                    checked={addressType === 'new'} 
                    onChange={() => setAddressType('new')} 
                    style={{ accentColor: '#8f8576', width: '16px', height: '16px' }}
                  />
                  새로운 배송지 입력
                </label>
              </div>
            )}

            {/* 라디오 선택 상태에 따른 유기적 렌더링 뷰포트 교체 매핑 구역 */}
            {addressType === 'default' ? (
              <div className="checkout-input-group">
                <label>배송지 주소</label>
                <input 
                  type="text" 
                  value={deliveryAddress} 
                  readOnly 
                  style={{ backgroundColor: '#161616', color: '#bbb', border: '1px solid #222', cursor: 'not-allowed' }} 
                  placeholder="회원정보에 등록된 기본 주소가 없습니다."
                />
              </div>
            ) : (
              <div className="checkout-input-group">
                <label>배송지 상세 주소</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input 
                    type="text" 
                    value={newAddress} 
                    readOnly 
                    onClick={handleOpenPostcode}
                    placeholder="우측 주소 검색 버튼을 이용해 주세요" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={handleOpenPostcode} 
                    style={{
                      background: '#111',
                      color: '#fff',
                      border: '1px solid #8f8576',
                      padding: '0 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.05em'
                    }}
                  >
                    주소 검색
                  </button>
                </div>
                <input 
                  type="text" 
                  id="checkout-detail-address"
                  value={newDetailAddress} 
                  onChange={(e) => setNewDetailAddress(e.target.value)} 
                  placeholder="상세 주소를 입력하세요 (아파트 동·호수 등)" 
                  required 
                />
              </div>
            )}

            <div className="checkout-input-group">
              <label>배송 요청 사항</label>
              <input type="text" value={deliveryMemo} onChange={(e) => setDeliveryMemo(e.target.value)} />
            </div>

            <div className="checkout-input-group" style={{ marginTop: '20px' }}>
              <label style={{ fontWeight: '600' }}>결제 방법 선택</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  color: '#111',
                  fontSize: '0.88rem',
                  outline: 'none',
                  cursor: 'pointer',
                  borderRadius: '0' 
                }}
              >
                <option value="무통장입금">무통장입금 (가상계좌 발송)</option>
                {/* 결제창 키(VITE_TOSS_CLIENT_KEY)가 설정된 환경에서만 온라인 결제를 노출합니다.
                    키가 없으면 결제창을 띄울 수 없으므로 선택지 자체를 감춥니다. */}
                {IS_ONLINE_PAYMENT_ENABLED && (
                  <option value="ONLINE_PAYMENT">온라인 결제 (신용카드 / 간편결제)</option>
                )}
              </select>
            </div>

            {/* 🌟 [토스페이먼츠 연동 구역] 온라인 결제 선택 시 위젯 노출 */}
            {paymentMethod === 'ONLINE_PAYMENT' && (
              <div className="toss-widget-area" style={{ marginTop: '30px', background: '#fff', padding: '20px 0', borderRadius: '4px' }}>
                <div id="payment-method"></div>
                <div id="agreement"></div>
              </div>
            )}

          </div>
        </form>

        <div className="checkout-summary-section">
          <div className="final-summary-card">
            <h3>FINAL CHECK</h3>
            
            <div className="checkout-preview-list">
              {selectedItems.map((item: any, idx: number) => (
                <div key={idx} className="preview-item-row">
                  <span>{item.name} (SZ: {item.size} / CL: {item.color || '기본'}) x {item.quantity}</span>
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
              <span>{deliveryFee === 0 ? 'FREE' : `₩${(deliveryFee as any).toLocaleString()}`}</span>
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