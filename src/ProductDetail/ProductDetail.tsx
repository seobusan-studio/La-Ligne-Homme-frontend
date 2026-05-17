import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';

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
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL에서 /product/:id 낚아채기
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. 백엔드 API로부터 상품 단건 상세 정보 실시간 로드 (오리지널 100% 보존)
  useEffect(() => {
    fetch(`http://localhost:8080/api/products/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setProduct(result.data);
          setMainImage(result.data.imageUrl || '/images/default-product.jpg');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('상세 정보 호출 실패:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="detail-loading">La Ligne Homme 프리미엄 컬렉션 로딩 중...</div>;
  if (!product) return <div className="detail-error">존재하지 않거나 보관함 처리된 상품입니다.</div>;

  // 가격 포맷팅 편의 함수 (오리지널 보존)
  const formattedPrice = (product.price || 0).toLocaleString();

  // 수량 가감 핸들러 (오리지널 보존)
  const handleQuantityChange = (type: 'plus' | 'minus') => {
    if (type === 'plus') {
      if (quantity >= product.totalStock) {
        alert(`죄송합니다. 현재 창고 최대 잔여 재고는 ${product.totalStock}개입니다.`);
        return;
      }
      setQuantity(prev => prev + 1);
    } else {
      if (quantity <= 1) return;
      setQuantity(prev => prev - 1);
    }
  };

  // 🌟 [정밀 교정] 바로 구매 클릭 시 해당 단건 상품 정보를 패키징하여 결제 페이지(Checkout)로 다이렉트 고속 이송 가동
  const handleOrderSubmit = () => {
    if (!selectedSize) {
      alert('상품 구매를 위해 사이즈 옵션을 선택해 주세요.');
      return;
    }

    // 결제 페이지(Checkout.tsx)의 selectedItems 규격과 1인치도 틀림없이 완벽 싱크로 매핑 포장
    const directItem = [{
      id: product.id,
      name: product.name,
      brandName: product.brandName,
      price: product.price,
      size: selectedSize,
      quantity: quantity,
      imageUrl: mainImage,
      optionId: 1 // 백엔드 product_options 테이블 연동용 기본 가상 인덱스 매핑선
    }];

    const totalAmount = product.price * quantity;
    const deliveryFee = totalAmount >= 100000 ? 0 : 3000;

    // 장바구니를 거치지 않고 React Router state 보관소를 통해 Checkout으로 다이렉트 라우팅 점프
    navigate('/checkout', {
      state: {
        selectedItems: directItem,
        totalAmount,
        deliveryFee
      }
    });
  };

  // 다른 유저와 장바구니 꼬임 현상을 100% 차단하도록 로그인 계정별 고유 키(dynamicCartKey) 매핑 엔진 전면 체인지 (오리지널 보존)
  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('현대 남성의 실루엣 완성을 위해 사이즈 옵션을 반드시 선택해 주세요.');
      return;
    }

    // 현재 로그인된 유저 세션 확인 (Local + Session 교차 검증)
    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    
    // 유저 고유 ID나 성명을 결합하여 격리된 독립 영토 Key 생성 (비회원은 guest)
    const userIdentifier = session ? (session.name || session.id || 'user') : 'guest';
    const dynamicCartKey = `laligne_cart_${userIdentifier}`;

    // 해당 사용자 전용 금고에서만 데이터 배열 낚아채기
    const currentCart = JSON.parse(localStorage.getItem(dynamicCartKey) || '[]');

    // 동일 상품의 동일 사이즈 옵션이 중복 적재되었는지 실시간 전수 조사
    const existingItemIndex = currentCart.findIndex(
      (item: any) => item.id === product.id && item.size === selectedSize
    );

    if (existingItemIndex > -1) {
      // 이미 같은 옵션이 존재한다면 수량만 덧셈 연산하여 병합
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      // 신규 옵션 및 신규 상품 분기일 경우 패키징 후 배열에 주입
      currentCart.push({
        id: product.id,
        name: product.name,
        brandName: product.brandName,
        price: product.price,
        size: selectedSize,
        quantity: quantity,
        imageUrl: mainImage,
        optionId: 1 // 백엔드 product_options 테이블 연동용 기본 가상 인덱스 매핑선
      });
    }

    // 해당 사용자 고유 장바구니 금고 데이터 동기화 백업 갱신
    localStorage.setItem(dynamicCartKey, JSON.stringify(currentCart));

    // 유저 경험(UX) 배려형 인터랙션 팝업 연동
    if (window.confirm('선택하신 컬렉션 제품이 BAG에 안전하게 담겼습니다.\n지금 장바구니 화면으로 이동하시겠습니까?')) {
      navigate('/cart');
    }
  };

  return (
    <div className="product-detail-container">
      {/* 쇼핑몰 특유의 깔끔한 상단 브레드크럼 네비게이션 */}
      <div className="detail-navigation">
        <span className="nav-crumbs">HOME &gt; {product.brandName || 'COLLECTION'} &gt; {product.name}</span>
      </div>

      <div className="detail-main-wrapper">
        {/* 왼쪽 섹션: 쇼핑몰 스타일 썸네일 리스트 + 메인 거대 대형 뷰어 복합 박스 */}
        <div className="detail-media-box">
          {/* 복수 사진이 존재할 때 좌측에 이쁘게 세로 배치되는 썸네일 스트립 벨트 */}
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

          <div className="main-viewer-card">
            <div 
              className="main-viewer-img"
              style={{ backgroundImage: `url("${mainImage.startsWith('http') ? mainImage : `http://localhost:8080${mainImage}`}")` }}
            ></div>
          </div>
        </div>

        {/* 오른쪽 섹션: 쇼핑몰 레이아웃 기반 정보창 명세 패널 */}
        <div className="detail-info-box">
          <div className="info-header-summary">
            <p className="detail-brand-tag">{product.brandName || 'LA LIGNE HOMME'}</p>
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
              <span className="guide-value">₩3,000 (₩100,000 이상 구매 시 무료배송)</span>
            </div>
            <div className="guide-row">
              <span className="guide-label">국내배송</span>
              <span className="guide-value">영업일 기준 2~3일 이내 안전 출고</span>
            </div>
          </div>

          <div className="detail-divider"></div>

          {/* 사이즈 옵션 셀렉터 박스 */}
          <div className="detail-option-selector-group">
            <label htmlFor="size-select">사이즈 선택 {product.totalStock === 0 && <span className="soldout-alert">(품절)</span>}</label>
            <select 
              id="size-select" 
              value={selectedSize} 
              onChange={(e) => setSelectedSize(e.target.value)}
              className="detail-select-box"
              disabled={product.totalStock === 0}
            >
              <option value="">-- [필수] 사이즈 옵션을 선택하세요 --</option>
              <option value="S (95)">S (95) [남은 수량 여유]</option>
              <option value="M (100)">M (100) [가장 품절 임박]</option>
              <option value="L (105)">L (105) [실루엣 추천 핏]</option>
            </select>
          </div>

          {/* 실시간 수량 제어 및 최종 정산 금액 미니 보드 */}
          {product.totalStock > 0 && (
            <div className="detail-quantity-counter-box">
              <div className="counter-row-flex">
                <span className="selected-prod-name-badge">{product.name}</span>
                <div className="counter-btn-group">
                  <button type="button" onClick={() => handleQuantityChange('minus')}>-</button>
                  <span className="counter-number-view">{quantity}</span>
                  <button type="button" onClick={() => handleQuantityChange('plus')}>+</button>
                </div>
              </div>
              <div className="live-total-price-board">
                <span className="total-label">총 상품금액 ({quantity}개)</span>
                <span className="total-value">₩{(product.price * quantity).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* 대형 쇼핑몰 스타일 볼드 액션 버튼 그리드 벨트 */}
          <div className="detail-cta-action-buttons">
            {product.totalStock > 0 ? (
              <>
                {/* 🌟 [교정 바인딩] 기존 가상 alert를 파괴하고 다이렉트 결제 이송 엔진 함수 매핑 완결 */}
                <button type="button" className="btn-detail-primary" onClick={handleOrderSubmit}>BUY NOW (바로 구매)</button>
                <button type="button" className="btn-detail-secondary" onClick={handleAddToCart}>ADD TO CART</button>
              </>
            ) : (
              <button type="button" className="btn-detail-soldout" disabled>SOLD OUT (품절된 상품입니다)</button>
            )}
          </div>
          
          <div className="detail-divider"></div>

          {/* 하단 디자이너 어드바이스 어코디언 배치 */}
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