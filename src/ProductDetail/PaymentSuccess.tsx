import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Checkout.css'; // 기존 스타일 재활용

/**
 * 결제창을 통과한 뒤 돌아오는 화면.
 *
 * 🚨 [교정] 예전에는 이 화면에서 "결제 승인"과 "주문 저장"을 각각 따로 요청했습니다.
 *    그래서 승인은 됐는데 주문 저장이 실패하면 결제 기록만 남고 주문은 사라졌습니다.
 *    이제는 서버에 한 번만 요청하고, 서버가 두 작업을 한 묶음으로 처리합니다.
 */
const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 개발 모드의 이중 실행이나 새로고침으로 승인 요청이 두 번 나가지 않도록 막습니다.
  const hasRequestedRef = useRef(false);

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setErrorMessage('결제 정보를 확인할 수 없습니다. 주문 내역에서 결제 상태를 확인해 주세요.');
      setLoading(false);
      return;
    }

    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    const finalizeOrder = async () => {
      const pendingKey = `pending_order_${orderId}`;
      const pendingRaw = sessionStorage.getItem(pendingKey);

      if (!pendingRaw) {
        setErrorMessage('주문 정보를 찾을 수 없습니다. 고객센터로 문의해 주세요.');
        setLoading(false);
        return;
      }

      const { orderRequest, totalAmount, selectedItems } = JSON.parse(pendingRaw);

      const SESSION_KEY = 'laligne_session';
      const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      const session = sessionRaw ? JSON.parse(sessionRaw) : null;

      try {
        // 결제 승인 + 주문 저장을 서버가 한 번에 처리합니다.
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/payments/toss/confirm?email=${encodeURIComponent(session?.email || '')}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount,
              order: { ...orderRequest, paymentMethod: 'CARD' }
            })
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          setErrorMessage(result?.message || '결제 승인에 실패했습니다.');
          setLoading(false);
          return;
        }

        await clearPurchasedCartItems(session, selectedItems);
        sessionStorage.removeItem(pendingKey);

        navigate('/payment-complete', {
          replace: true,
          state: {
            orderNumber: result.data?.orderNumber || orderId,
            totalAmount: result.data?.amount ?? totalAmount,
            paymentMethod: '카드결제',
            bankInfo: null
          }
        });
      } catch (err) {
        console.error('결제 승인 요청 실패', err);
        setErrorMessage('결제 결과를 확인하지 못했습니다. 주문 내역에서 결제 상태를 확인해 주세요.');
        setLoading(false);
      }
    };

    finalizeOrder();
  }, [paymentKey, orderId, amount, navigate]);

  /** 결제한 상품을 장바구니에서 비웁니다. 실패해도 주문 자체에는 영향을 주지 않습니다. */
  const clearPurchasedCartItems = async (session: any, selectedItems: any[]) => {
    try {
      if (session?.id) {
        const cartItemIds = (selectedItems || [])
          .map((item: any) => item.cartItemId)
          .filter((id: any) => id != null);

        if (cartItemIds.length > 0) {
          await fetch(`${import.meta.env.VITE_API_URL}/api/carts?ids=${cartItemIds.join(',')}`, {
            method: 'DELETE',
            headers: { 'X-User-Id': String(session.id) }
          });
        }
        return;
      }

      const cartKey = 'laligne_cart_guest';
      const localCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      const remaining = localCart.filter((localItem: any) =>
        !(selectedItems || []).some((sel: any) =>
          sel.id === localItem.id && sel.size === localItem.size && sel.color === localItem.color
        )
      );
      localStorage.setItem(cartKey, JSON.stringify(remaining));
    } catch (err) {
      console.error('장바구니 정리 실패', err);
    }
  };

  if (loading) {
    return (
      <div className="checkout-page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div className="detail-loading">결제를 확인하고 있습니다. 잠시만 기다려 주세요...</div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
      <header className="checkout-header">
        <h1 style={{ color: '#c0392b' }}>결제를 완료하지 못했습니다</h1>
        <p>{errorMessage}</p>
      </header>

      <div className="checkout-box" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>주문 정보</h3>
        <div style={{ padding: '20px 0', lineHeight: '2' }}>
          <p><strong>주문 번호:</strong> {orderId}</p>
          <p><strong>결제 금액:</strong> ₩{Number(amount || 0).toLocaleString()}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => navigate('/cart')} className="btn-payment-execute" style={{ background: '#555' }}>
            장바구니로 이동
          </button>
          <button onClick={() => navigate('/')} className="btn-payment-execute">
            홈으로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
