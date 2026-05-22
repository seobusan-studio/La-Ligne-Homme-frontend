import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';

// 🌟 [명세 확장] 백엔드에서 수혈되는 동적 옵션 개별 객체 타입 정의
interface ProductOption {
  id: number;
  size: string;
  color: string;
  extraPrice: number;
  stockQuantity: number;
  isSellable: boolean;
}

interface ProductDetailData {
  id: number;
  name: string;
  brandName: string;
  price: number;
  description: string;
  status: string;
  imageUrl: string;
  imageUrls: string[];
  totalStock: number;
  options?: ProductOption[]; // 🌟 [명세 확장] 백엔드에서 쏘아준 다중 옵션 리스트 탑재
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL에서 /product/:id 낚아채기
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  
  // 🚨 [급소 진단 및 교정] 같은 사이즈에 다른 색상(예: M 블랙, M 레드)이 존재할 때 size 문자열만으로 바인딩하면 
  // 브라우저가 첫 번째 옵션으로 강제 고정해버리는 버그가 발생합니다. 이를 해결하기 위해 고유 옵션 ID 체계로 전격 변경합니다.
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. 백엔드 API로부터 상품 상세 정보 로드 (3초 고속 실시간 DB 재고 동기화 루프 개통 - 원형 사수)
  useEffect(() => {
    let isMounted = true;

    const fetchLatestStockFromDb = async (isInitial: boolean = false) => {
      try {
        const res = await fetch(`http://localhost:8080/api/products/${id}`);
        const result = await res.json();
        
        if (result.data && isMounted) {
          const loadedProduct = result.data;
          if (loadedProduct.options) {
            loadedProduct.options = loadedProduct.options.map((opt: any) => {
              // 🌟 [교정] 장바구니에 담긴 임시 수량으로 인해 실재고 카운트가 선차감되어 노출되던 고질적 버그 격리 분리
              return { ...opt, stockQuantity: Math.max(0, opt.stockQuantity) };
            });
          }

          setProduct(loadedProduct);
          
          // 🌟 [방어 가드] 유저가 서브 룩북 사진을 호버링 투어 중일 때 3초 주기로 대표 이미지가 강제 복구되는 간섭 현상 완전 차단
          if (isInitial) {
            setMainImage(loadedProduct.imageUrl || '/images/default-product.jpg');
          }
        }
        if (isInitial && isMounted) setLoading(false);
      } catch (err) {
        console.error('실시간 재고 동기화 실패:', err);
        if (isInitial && isMounted) setLoading(false);
      }
    };

    // 첫 실행 마운트
    fetchLatestStockFromDb(true);

    // 3초 초고속 실시간 DB 재고 수혈 루프 사수
    const stockLiveScheduler = setInterval(() => {
      fetchLatestStockFromDb(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(stockLiveScheduler);
    };
  }, [id]);

  if (loading) return <div className="detail-loading">La Ligne Hommes 프리미엄 컬렉션 로딩 중...</div>;
  if (!product) return <div className="detail-error">존재하지 않거나 보관함 처리된 상품입니다.</div>;

  // 🌟 [교정] 3초 폴링 리로드 시 튕김을 막기 위해 확실하게 String 형으로 일치화하여 탐색 수행
  const currentSelectedOption = product.options?.find(opt => 
    String(opt.id) === selectedOptionId || opt.size === selectedOptionId
  );
  
  // 기존 하방 호환성 사수를 위한 selectedSize 동적 산출선 유지
  const selectedSize = currentSelectedOption ? currentSelectedOption.size : selectedOptionId;

  // 🌟 [순수 확장 헬퍼] 추가 금액이 있다면 기본가에 자동 연산 적용 (없으면 기본가 유지)
  const finalCalculatedPrice = product.price + (currentSelectedOption?.extraPrice || 0);
  const formattedPrice = finalCalculatedPrice.toLocaleString();

  // 수량 가감 핸들러 (선택 옵션별 실시간 잔여 재고 가드 가동)
  const handleQuantityChange = (type: 'plus' | 'minus') => {
    const maxAvailableStock = currentSelectedOption ? currentSelectedOption.stockQuantity : product.totalStock;

    if (type === 'plus') {
      if (quantity >= maxAvailableStock) {
        alert(`죄송합니다. 선택하신 옵션의 현재 최대 잔여 재고는 ${maxAvailableStock}개입니다.`);
        return;
      }
      setQuantity(prev => prev + 1);
    } else {
      if (quantity <= 1) return;
      setQuantity(prev => prev - 1);
    }
  };

  // 🌟 바로 구매 클릭 시 해당 단건 상품 정보를 패키징하여 결제 페이지(Checkout)로 다이렉트 고속 이송
  const handleOrderSubmit = () => {
    if (!selectedOptionId) {
      alert('상품 구매를 위해 사이즈 옵션을 선택해 주세요.');
      return;
    }

    const directItem = [{
      id: product.id,
      name: product.name,
      brandName: product.brandName,
      price: finalCalculatedPrice,
      size: selectedSize,
      // 🌟 교정된 진본 선택 색상을 유실 없이 동착
      color: currentSelectedOption ? currentSelectedOption.color : '기본',
      quantity: quantity,
      imageUrl: mainImage,
      optionId: currentSelectedOption ? currentSelectedOption.id : 1 
    }];

    const totalAmount = finalCalculatedPrice * quantity;
    const deliveryFee = 0; 

    navigate('/checkout', {
      state: {
        selectedItems: directItem,
        totalAmount,
        deliveryFee
      }
    });
  };

  // 장바구니 꼬임 현상 방지용 로그인 계정별 고유 키 매핑 로직 (원형 사수)
  const handleAddToCart = () => {
    if (!selectedOptionId) {
      alert('현대 남성의 실루엣 완성을 위해 사이즈 옵션을 반드시 선택해 주세요.');
      return;
    }

    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    
    const userIdentifier = session ? (session.name || session.id || 'user') : 'guest';
    const dynamicCartKey = `laligne_cart_${userIdentifier}`;

    const currentCart = JSON.parse(localStorage.getItem(dynamicCartKey) || '[]');

    // 🌟 [교정] 같은 사이즈여도 색상이 다르면 장바구니 안에서 별도 라인으로 분리 적재되도록 매핑 수정
    const existingItemIndex = currentCart.findIndex(
      (item: any) => item.id === product.id && item.size === selectedSize && item.color === (currentSelectedOption ? currentSelectedOption.color : '기본')
    );

    if (existingItemIndex > -1) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        brandName: product.brandName,
        price: finalCalculatedPrice,
        size: selectedSize,
        color: currentSelectedOption ? currentSelectedOption.color : '기본',
        quantity: quantity,
        imageUrl: mainImage,
        optionId: currentSelectedOption ? currentSelectedOption.id : 1 
      });
    }

    localStorage.setItem(dynamicCartKey, JSON.stringify(currentCart));

    // 🌟 [교정] 단순 장바구니(BAG) 추가 단계에서 리액트 내부 로컬 stock 상태를 가압류식으로 마이너스 차감하던 실책 코드 완벽 소거 격리
    setSelectedOptionId(''); 
    setQuantity(1); 

    if (window.confirm('선택하신 컬렉션 제품이 BAG에 안전하게 담겼습니다.\n지금 장바구니 화면으로 이동하시겠습니까?')) {
      navigate('/cart');
    }
  };

  return (
    <div className="product-detail-container">
      
      {/* 하이엔드 무드의 뒤로가기 헤더 벨트 그리드 사수 */}
      <div className="detail-top-action-bar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #1a1a1a'
      }}>
        {/* ◀ RETURN TO LIST 슬라이딩 인클로저 단추 */}
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
          {/* 가느다란 정밀 미니멀 화살표 SVG 직조 */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          RETURN TO LIST
        </div>

        {/* 미니 브레드크럼 보드는 우측으로 밀어서 룩북의 밸런스 매칭 조율 */}
        <div className="detail-navigation" style={{ margin: 0, padding: 0 }}>
          <span className="nav-crumbs" style={{ fontSize: '11px', color: '#666' }}>
            HOME &gt; {product.brandName || 'COLLECTION'} &gt; {product.name}
          </span>
        </div>
      </div>

      <div className="detail-main-wrapper">
        {/* 왼쪽 섹션: 메인 거대 대형 뷰어 + 하단 가변 썸네일 스트립 벨트 */}
        <div className="detail-media-box">
          
          {/* 거대 메인 사진 뷰어 카드 */}
          <div className="main-viewer-card">
            <div 
              className="main-viewer-img"
              style={{ 
                backgroundImage: `url("${mainImage.startsWith('http') ? mainImage : `http://localhost:8080${mainImage}`}")`,
                backgroundSize: 'contain', 
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            ></div>
          </div>

          {/* 가변 썸네일 스트립 벨트 */}
          {product.imageUrls && product.imageUrls.length > 0 && (
            <div className="sub-thumbnails-strip">
              {product.imageUrls.map((url, idx) => {
                const fullUrl = url.startsWith('http') ? url : `http://localhost:8080${url}`;
                return (
                  <div 
                    key={idx} 
                    className={`sub-thumb-card ${mainImage === url || mainImage === fullUrl ? 'active-border' : ''}`}
                    onMouseEnter={() => setMainImage(fullUrl)} 
                    style={{ backgroundImage: `url("${fullUrl}")` }}
                  ></div>
                );
              })}
            </div>
          )}

        </div>

        {/* 오른쪽 섹션: 쇼핑몰 레이아웃 기반 정보창 명세 패널 */}
        <div className="detail-info-box">
          <div className="info-header-summary">
            <p className="detail-brand-tag">{product.brandName || 'LA LIGNE HOMMES'}</p>
            <h1 className="detail-product-title">{product.name}</h1>
            <div className="price-row-wrapper">
              <span className="detail-product-price">₩{formattedPrice}</span>
            </div>
          </div>
          
          <div className="detail-divider"></div>

          {/* 에센셜 배송 / 혜택 가이드 테이블 요약 테이블 배치 */}
          <div className="mall-delivery-guide-table">
            <div className="guide-row">
              <span className="guide-label">배송구분</span>
              <span className="guide-value">업체조건배송 (La Ligne 본사 직배송)</span>
            </div>
            <div className="guide-row">
              <span className="guide-label">배송비</span>
              <span className="guide-value">₩0 (라 린느 마스터 회원 전품목 전격 무료배송 혜택선 가동)</span>
            </div>
            <div className="guide-row">
              <span className="guide-label">국내배송</span>
              <span className="guide-value">영업일 기준 2~3일 이내 안전 출고</span>
            </div>
          </div>

          <div className="detail-divider"></div>

          <div className="detail-option-selector-group">
            <label htmlFor="size-select">사이즈 선택 {product.totalStock === 0 && <span className="soldout-alert">(품절)</span>}</label>
            <select 
              id="size-select" 
              value={selectedOptionId} 
              onChange={(e) => {
                setSelectedOptionId(e.target.value);
                setQuantity(1); 
              }}
              className="detail-select-box"
              disabled={product.totalStock === 0}
            >
              <option value="">-- [필수] 사이즈 옵션을 선택하세요 --</option>
              {product.options && product.options.length > 0 ? (
                product.options.map((opt) => (
                  // 🌟 [교정] value 값을 명시적으로 String(opt.id) 처리하여 3초 동기화 리로드 시에도
                  // 리액트 가상 DOM 매핑이 풀리지 않고 블랙 ↔ 레드 간 무한 스위칭을 완벽 보장합니다.
                  <option key={opt.id} value={String(opt.id)} disabled={opt.stockQuantity === 0}>
                    {opt.size} {opt.color && opt.color !== '기본' ? `[${opt.color}]` : ''} 
                    {opt.extraPrice > 0 ? ` (+₩${opt.extraPrice.toLocaleString()})` : ''} 
                    {opt.stockQuantity === 0 ? ' [품절된 규격]' : ` [주문가능 수량: ${opt.stockQuantity}개]`}
                  </option>
                ))
              ) : (
                <>
                  <option value="S (95)">S (95) [남은 수량 여유]</option>
                  <option value="M (100)">M (100) [가장 품절 임박]</option>
                  <option value="L (105)">L (105) [실루엣 추천 핏]</option>
                </>
              )}
            </select>
          </div>

          {product.totalStock > 0 && (
            <div className="detail-quantity-counter-box">
              <div className="counter-row-flex">
                <span className="selected-prod-name-badge">
                  {product.name} {selectedSize ? ` - ${selectedSize}` : ''} {currentSelectedOption?.color && currentSelectedOption.color !== '기본' ? `[${currentSelectedOption.color}]` : ''}
                </span>
                <div className="counter-btn-group">
                  <button type="button" onClick={() => handleQuantityChange('minus')}>-</button>
                  <span className="counter-number-view">{quantity}</span>
                  <button type="button" onClick={() => handleQuantityChange('plus')}>+</button>
                </div>
              </div>
              <div className="live-total-price-board">
                <span className="total-label">총 상품금액 ({quantity}개)</span>
                <span className="total-value">₩{(finalCalculatedPrice * quantity).toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="detail-cta-action-buttons">
            {product.totalStock > 0 ? (
              <>
                <button type="button" className="btn-detail-primary" onClick={handleOrderSubmit}>BUY NOW (바로 구매)</button>
                <button type="button" className="btn-detail-secondary" onClick={handleAddToCart}>ADD TO CART</button>
              </>
            ) : (
              <button type="button" className="btn-detail-soldout" disabled>SOLD OUT (품절된 상품입니다)</button>
            )}
          </div>
          
          <div className="detail-divider"></div>

          <div className="detail-description-area">
            <h4>PRODUCT DETAILS &amp; NOTES</h4>
            <p>{product.description || '본사 검수를 마친 프리미엄 원단으로 직조된 컬렉션 라인입니다. 유행을 타지 않는 타임리스 실루엣을 느껴보세요.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;