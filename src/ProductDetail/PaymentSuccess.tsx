import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Checkout.css'; // 기존 스타일 재활용

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const finalizeOrder = async () => {
      try {
        // 1. 토스페이먼츠 결제 승인 (백엔드 확인)
        const confirmRes = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/toss/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount })
        });
        
        const confirmData = await confirmRes.json();
        
        if (confirmRes.ok && confirmData.success) {
          // 2. 대기 중인 주문 데이터 인양
          const pendingDataRaw = sessionStorage.getItem(`pending_order_${orderId}`);
          if (!pendingDataRaw) {
            setResult({ success: false, message: '주문 정보를 찾을 수 없습니다.' });
            setLoading(false);
            return;
          }
          
          const { orderRequest, totalAmount, selectedItems } = JSON.parse(pendingDataRaw);
          const SESSION_KEY = 'laligne_session';
          const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
          const session = sessionRaw ? JSON.parse(sessionRaw) : null;

          // 3. 실제 주문 생성 (우리 DB 저장)
          const orderRes = await fetch(`${import.meta.env.VITE_API_URL}/api/orders?paymentMethod=CARD&email=${encodeURIComponent(session?.email || '')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...orderRequest,
              paymentMethod: 'CARD' // 🌟 [수혈] DTO 내 필수 필드 강제 주입
            })
          });

          const orderResult = await orderRes.json();
          
          if (orderRes.ok && orderResult.status !== 'ERROR') {
            // 4. 장바구니 비우기
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
                  console.error('토스 결제 후 장바구니 정리 실패:', err);
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
            
            // 5. 사용 완료된 세션 데이터 삭제 및 완료 페이지 이동
            sessionStorage.removeItem(`pending_order_${orderId}`);
            
            navigate('/payment-complete', { 
              state: {
                orderNumber: orderResult.data.orderNumber || orderId,
                totalAmount: totalAmount,
                paymentMethod: '카드결제(Toss)',
                bankInfo: null
              }
            });
          } else {
            setResult({ success: false, message: '결제는 완료되었으나 주문 생성 중 오류가 발생했습니다.' });
            setLoading(false);
          }
        } else {
          setResult({ success: false, message: confirmData.message || '결제 승인에 실패했습니다.' });
          setLoading(false);
        }
      } catch (err) {
        setResult({ success: false, message: '서버와 통신 중 오류가 발생했습니다.' });
        setLoading(false);
      }
    };

    if (paymentKey && orderId && amount) {
      finalizeOrder();
    }
  }, [paymentKey, orderId, amount, navigate]);

  if (loading) return (
    <div className="checkout-page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
      <div className="detail-loading">결제 승인을 확인 중입니다. 잠시만 기다려 주십시오...</div>
    </div>
  );

  return (
    <div className="checkout-page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
      <header className="checkout-header">
        <h1 style={{ color: result?.success ? '#27ae60' : '#c0392b' }}>
          {result?.success ? 'PAYMENT SUCCESS' : 'PAYMENT FAILED'}
        </h1>
        <p>{result?.success ? '토스페이먼츠 안전 결제가 정상적으로 완료되었습니다.' : result?.message}</p>
      </header>

      <div className="checkout-box" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>주문 상세 확인</h3>
        <div style={{ padding: '20px 0', lineHeight: '2' }}>
          <p><strong>주문 번호:</strong> {orderId}</p>
          <p><strong>최종 결제 금액:</strong> ₩{Number(amount).toLocaleString()}</p>
        </div>

        <button 
          onClick={() => navigate('/')} 
          className="btn-payment-execute"
          style={{ marginTop: '30px' }}
        >
          쇼핑 계속하기 (홈으로 이동)
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
