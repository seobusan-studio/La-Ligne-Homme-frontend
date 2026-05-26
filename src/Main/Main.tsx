import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Main.css';
import SpeedDial from '../components/SpeedDial/SpeedDial';

interface Product {
  id: number;
  name: string;
  brandName: string;
  basePrice?: number;   // 어떤 필드명으로 들어와도 깨지지 않게 옵셔널 처리
  price?: number;       // 백엔드 실제 바인딩 규격 수용 필드 추가
  base_price?: number;  // 스네이크 케이스 규격 수용 필드 추가
  description: string;
  imageUrl?: string;    // 백엔드에서 넘어오는 업로드 이미지 파일 주소 타입 세팅
  categoryId?: number;  // 탭 필터링 제어를 위한 카테고리 아이디 명세 확장
  status?: string;      // 어드민 판매 상태(ON_SALE, STOPPED) 연동을 위한 명세 확장
  isVisible?: boolean;  // 어드민 진열 여부(true, false) 연동을 위한 명세 확장
}

// 한글 카테고리 버튼 이름과 백엔드 DB 고유 ID를 바인딩하기 위한 매핑 사전 구축 (폴백용 유지)
const CATEGORY_ID_MAP: Record<string, number> = {
  '아우터': 1,
  '티셔츠 / 셔츠': 2,
  '가디건 / 니트': 3,
  '팬츠': 4
};

const Main: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  
  // TypeScript 빨간줄 방지를 위해 유저 상태 타입에 role 유지 (오리지널 보존)
  const [user, setUser] = useState<{ name: string; role?: string } | null>(null);
  
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState('전체');
  // 🌟 [신설 핵심 상태] 백엔드 DB에서 실시간으로 긁어올 동적 카테고리 수혈단
  const [categories, setCategories] = useState<any[]>([]);

  // 1. 로그인 세션 및 상품 데이터 로드 + 동적 카테고리 실시간 동기화
  useEffect(() => {
    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      setUser(JSON.parse(sessionRaw));
    }

    // 🌟 [신설] 백엔드 DB 카테고리 테이블 정보 로드 파이프라인
    fetch('http://localhost:8080/api/categories')
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setCategories(result.data);
        }
      })
      .catch(err => console.error('동적 카테고리 통신 대기 중...', err));

    fetch('http://localhost:8080/api/products')
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setProducts(result.data);
        } else if (Array.isArray(result)) {
          setProducts(result);
        }
      })
      .catch(err => console.error('백엔드 대기 중... 오리지널 데이터를 출력합니다.', err));
  }, []);

  // 2. 스크롤, 애니메이션, 키보드 이벤트 완벽 이식 (오리지널 유지)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 이제 비동기로 상품 데이터가 로드되어 들어와도 새 카드를 정확하게 추적합니다.
    const fadeEls = document.querySelectorAll('.fade-in');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    fadeEls.forEach(el => io.observe(el));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsNavOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      io.disconnect();
    };
  }, [products, activeCategory, categories]); // 🌟 카테고리 원장 변경 시에도 동기화 작동

  const handleLogout = () => {
    const SESSION_KEY = 'laligne_session';
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    window.location.reload();
  };

  const scrollToSection = (id: string) => {
    setIsNavOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 🌟 [순수 확장 헬퍼] DB에서 받은 카테고리가 있으면 동적으로 탭바 라인업 구성, 없으면 고정 배열로 리턴하는 가드 코드
  const dynamicCategoryTabs = categories.length > 0 
    ? ['전체', ...categories.map((c: any) => c.name)]
    : ['전체', '아우터', '티셔츠 / 셔츠', '가디건 / 니트', '팬츠'];

  return (
    <div className="main-page-box">
      {/* Skip Link */}
      <a href="#main" className="skip-link">본문 바로가기</a>

      {/* Mobile Nav Overlay */}
      <nav className={`mobile-nav ${isNavOpen ? 'open' : ''}`} id="mobile-nav" aria-label="모바일 메뉴" aria-hidden={!isNavOpen}>
        <button className="mobile-nav-close" id="mobile-nav-close" onClick={() => setIsNavOpen(false)} aria-label="메뉴 닫기">&#xd7;</button>
        <a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션</a>
        <a href="#brand" onClick={(e) => { e.preventDefault(); scrollToSection('brand'); }}>브랜드</a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>문의</a>
      </nav>

      {/* Header */}
      <header role="banner" id="header" className={isScrolled ? 'scrolled' : ''}>
        <nav className="container header-nav" aria-label="메인 내비게이션">
          <a href="/" className="logo" aria-label="La Ligne Hommes 홈">
            La Ligne Hommes
            <span>라 린느 옴므</span>
          </a>

          <ul className="nav-links" role="list">
            <li><a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션</a></li>
            <li><a href="#brand" onClick={(e) => { e.preventDefault(); scrollToSection('brand'); }}>브랜드</a></li>
            <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>문의</a></li>
          </ul>

          <div className="nav-right" id="nav-right">
            {!user ? (
              <>
                <button onClick={() => navigate('/cart')} className="btn-header desktop-only" id="btn-cart" style={{ marginRight: '0.35rem' }}>장바구니</button>
                <button onClick={() => navigate('/guest-lookup')} className="btn-header desktop-only" id="btn-guest-lookup" style={{ marginRight: '0.35rem' }}>비회원 주문조회</button>
                <button onClick={() => navigate('/login')} className="btn-header desktop-only" id="btn-login">로그인</button>
                <button onClick={() => navigate('/signup')} className="btn-header desktop-only" id="btn-signup">회원가입</button>
              </>
            ) : (
              <>
                <span className="nav-user desktop-only" id="nav-user" style={{ fontSize: '0.78rem', fontWeight: 400, letterSpacing: '0.05em', color: 'var(--color-text-sub)' }}>
                  {user.name}님
                </span>
                
                {user.role !== 'ADMIN' && (
                  <>
                    <button onClick={() => navigate('/cart')} className="btn-header desktop-only" id="btn-cart" style={{ marginRight: '0.35rem' }}>장바구니</button>
                    <button onClick={() => navigate('/mypage')} className="btn-header desktop-only" id="btn-mypage" style={{ marginRight: '0.35rem' }}>마이페이지</button>
                  </>
                )}
                
                <button onClick={handleLogout} className="btn-header desktop-only" id="btn-logout">로그아웃</button>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => navigate('/admin')} 
                className="btn-header desktop-only" 
                style={{ marginLeft: '0.5rem', borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}
              >
                관리자 페이지
              </button>
            )}

            <button
              className="hamburger"
              id="hamburger"
              onClick={() => setIsNavOpen(true)}
              aria-label="메뉴 열기"
              aria-expanded={isNavOpen}
              aria-controls="mobile-nav"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-img-placeholder"></div>
            <span className="hero-season-tag">SS 2025 Collection</span>
          </div>

          <div className="hero-content">
            <p className="hero-eyebrow data-fade-in">Nouvelle Collection</p>
            <h1 id="hero-heading" className="hero-title fade-in fade-in-delay-1">
              남성의 선,<br /><em>La Ligne</em>
            </h1>
            <p className="hero-subtitle fade-in fade-in-delay-2">
              라 린느 옴므는 프랑스어로 '남성의 선'을 의미합니다.<br />
              깔끔한 실루엣 and 미니멀한 디자인으로
              현대 남성의 감각을 완성합니다.
            </p>
            <div className="hero-cta-group fade-in fade-in-delay-3">
              <a href="#collection" className="btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션 보기</a>
              <a href="#brand" className="btn-secondary" onClick={(e) => { e.preventDefault(); scrollToSection('brand'); }}>브랜드 스토리</a>
            </div>
          </div>
        </section>

        {/* Brand Intro */}
        <section className="brand-intro" id="brand" aria-labelledby="brand-heading">
          <div className="container">
            <div className="brand-intro-inner">
              <p className="section-label fade-in">Maison La Ligne Hommes</p>
              <h2 id="brand-heading" className="section-title fade-in fade-in-delay-1">
                세련되고 감각적인 무드,<br /><em>미니멀의 철학</em>
              </h2>
              <div className="brand-divider fade-in"></div>
              <p className="section-body fade-in fade-in-delay-2">
                '라 린느 옴므(La Ligne Hommes)'는 세련되고 감각적인 무드를 지향하는
                남성 컨템포러리 패션 브랜드입니다.<br />
                프랑스어로 '남성의 선'이라는 의미를 담고 있는 만큼,
                깔끔한 실루엣 and 미니멀한 디자인이 특징입니다.
                <br /><br />
                과하지 않고, 부족하지도 않게. 정제된 선 하나에 담긴 감각이
                현대 남성의 일상을 더욱 특별하게 만들어 드립니다.
              </p>
            </div>
          </div>
        </section>

        {/* Collection */}
        <section className="collection" id="collection" aria-labelledby="collection-heading">
          <div className="container">
            <div className="collection-header">
              <div>
                <h2 id="collection-heading" className="section-title fade-in fade-in-delay-1">
                  신상품
                </h2>
              </div>
              <button className="btn-secondary fade-in">전체 보기</button>
            </div>

            <nav className="category-nav fade-in" aria-label="상품 카테고리">
              {/* 🌟 [동적 교정] 하드코딩 리스트를 지우고 실시간 생성된 dynamicCategoryTabs 배열로 토글 스위치 렌더링 */}
              {dynamicCategoryTabs.map(cat => (
                <button 
                  key={cat}
                  className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </nav>

            <div className="collection-grid" role="list">
              {products.length > 0 ? (
                (() => {
                  const filtered = products.filter(product => {
                    if (product.isVisible === false || product.status === 'STOPPED') return false;

                    if (activeCategory === '전체') return true;
                    const prodCatId = product.categoryId || (product as any).category_id;
                    if (prodCatId === undefined || prodCatId === null) return true;
                    
                    // 🌟 [동적 필터링 교정] DB 카테고리 데이터에 매칭되는 행이 있는지 파악하여 연격 교차 필터링
                    const matchedCat = categories.find(c => c.name === activeCategory);
                    const targetId = matchedCat ? matchedCat.id : CATEGORY_ID_MAP[activeCategory];
                    
                    return prodCatId === targetId;
                  });

                  if (filtered.length === 0) {
                    return (
                      <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-sub)', padding: '4rem 0', letterSpacing: '0.05em' }}>
                        해당 카테고리에 등록된 신규 상품이 없습니다.
                      </p>
                    );
                  }

                  // 🌟 [교정] 각 카테고리별 최대 6개만 표출되도록 상한 가드 레일 제한 채결 (.slice)
                  return filtered.slice(0, 6).map((product, idx) => (
                    <article key={product.id} className={`product-card fade-in visible ${idx === 1 ? 'fade-in-delay-1' : idx === 2 ? 'fade-in-delay-2' : ''}`} role="listitem">
                      <a href={`/product/${product.id}`} onClick={(e) => { e.preventDefault(); navigate(`/product/${product.id}`); }} aria-label={`${product.name} 상세 보기`}>
                        <div className="product-img-wrap">
                          <div 
                            className={`product-img-inner prod-${(idx % 6) + 1}`} 
                            style={product.imageUrl ? { backgroundImage: `url("${product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:8080${product.imageUrl}`}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                            role="img" 
                            aria-label={product.name}
                          ></div>
                          {idx === 0 && <span className="product-tag">New</span>}
                          {idx === 2 && <span className="product-tag">Best</span>}
                        </div>
                      </a>
                      <p className="product-name">{product.name}</p>
                      {/* 🌟 [요구사항 반영] 설명글(product-material) 엘리먼트 라인 완전 제거 완료 */}
                      <p className="product-price">₩ {(product.price || product.basePrice || 0).toLocaleString()}</p>
                    </article>
                  ));
                })()
              ) : (
                <>
                  <article className="product-card fade-in" role="listitem">
                    <a href="#" aria-label="미니멀 울 코트 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-1" role="img" aria-label="미니멀 울 코트 — 아이보리"></div>
                        <span className="product-tag">New</span>
                      </div>
                    </a>
                    <p className="product-name">미니멀 울 코트</p>
                    {/* 🌟 [폴백 레이아웃 교정] 설명글 라인 제거 */}
                    <p className="product-price">₩ 498,000</p>
                  </article>
                  <article className="product-card fade-in fade-in-delay-1" role="listitem">
                    <a href="#" aria-label="슬림 테일러드 재킷 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-2" role="img" aria-label="슬림 테일러드 재킷 — 차콜"></div>
                      </div>
                    </a>
                    <p className="product-name">슬림 테일러드 재킷</p>
                    {/* 🌟 [폴백 레이아웃 교정] 설명글 라인 제거 */}
                    <p className="product-price">₩ 368,000</p>
                  </article>
                  <article className="product-card fade-in fade-in-delay-2" role="listitem">
                    <a href="#" aria-label="드레이프 셔츠 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-3" role="img" aria-label="드레이프 셔츠 — 샌드"></div>
                        <span className="product-tag">Best</span>
                      </div>
                    </a>
                    <p className="product-name">드레이프 셔츠</p>
                    {/* 🌟 [폴백 레이아웃 교정] 설명글 라인 제거 */}
                    <p className="product-price">₩ 148,000</p>
                  </article>
                  <article className="product-card fade-in" role="listitem">
                    <a href="#" aria-label="와이드 팬츠 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-4" role="img" aria-label="와이드 팬츠 — 블랙"></div>
                      </div>
                    </a>
                    <p className="product-name">와이드 팬츠</p>
                    {/* 🌟 [폴백 레이아웃 교정] 설명글 라인 제거 */}
                    <p className="product-price">₩ 218,000</p>
                  </article>
                  <article className="product-card fade-in fade-in-delay-1" role="listitem">
                    <a href="#" aria-label="리넨 블레이저 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-5" role="img" aria-label="리넨 블레이저 — 그레이"></div>
                      </div>
                    </a>
                    <p className="product-name">리넨 블레이저</p>
                    {/* 🌟 [폴백 레이아웃 교정] 설명글 라인 제거 */}
                    <p className="product-price">₩ 298,000</p>
                  </article>
                  <article className="product-card fade-in fade-in-delay-2" role="listitem">
                    <a href="#" aria-label="크루넥 니트 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-6" role="img" aria-label="크루넥 니트 — 오트밀"></div>
                        <span className="product-tag">New</span>
                      </div>
                    </a>
                    <p className="product-name">크루넥 니트</p>
                    {/* 🌟 [폴백 레이아웃 교정] 설명글 라인 제거 */}
                    <p className="product-price">₩ 198,000</p>
                  </article>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Editorial */}
        <section className="editorial" aria-labelledby="editorial-heading">
          <div className="editorial-visual" aria-hidden="true">
            <div className="editorial-bg"></div>
          </div>
          <div className="editorial-content">
            <p className="editorial-kicker fade-in">The La Ligne Philosophy</p>
            <h2 id="editorial-heading" className="editorial-title fade-in fade-in-delay-1">
              선 하나에 담긴<br /><em>절제의 미학</em>
            </h2>
            <p className="editorial-body fade-in fade-in-delay-2">
              과잉을 걷어낸 자리에 남는 것, 그것이 라 린느 옴므가 추구하는 스타일입니다.
              불필요한 장식을 줄이고 소재 본연의 질감과 실루엣으로
              완성한 옷은 시간이 지나도 빛을 잃지 않습니다.
            </p>
            <a href="#collection" className="btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션 탐색하기</a>
          </div>
        </section>

        {/* Values */}
        <section className="values" aria-labelledby="values-heading">
          <div className="container">
            <p className="section-label fade-in">Our Principles</p>
            <h2 id="values-heading" className="section-title fade-in fade-in-delay-1">
              brand가 지키는 것들
            </h2>

            <div className="values-grid">
              <div className="value-item fade-in">
                <p className="value-number" aria-hidden="true">01</p>
                <h3 className="value-title">Silhouette First</h3>
                <p className="value-body">
                  실루엣이 먼저입니다. 몸의 선을 살리는 패턴 작업에서
                  라 린느 옴므의 모든 디자인이 시작됩니다.
                  유행에 흔들리지 않는 클래식한 라인을 고집합니다.
                </p>
              </div>
              <div className="value-item fade-in fade-in-delay-1">
                <p className="value-number" aria-hidden="true">02</p>
                <h3 className="value-title">Material Integrity</h3>
                <p className="value-body">
                  소재의 진정성을 믿습니다. 이탈리아 울, 퓨어 리넨,
                  메리노 울 — 엄선된 원단만이 라 린느 옴므의 이름을 달 수 있습니다.
                </p>
              </div>
              <div className="value-item fade-in fade-in-delay-2">
                <p className="value-number" aria-hidden="true">03</p>
                <h3 className="value-title">Timeless Over Trendy</h3>
                <p className="value-body">
                  한 시즌이 아닌 10년을 입을 수 있는 옷을 만듭니다.
                  트렌드는 참고하되, 시대를 초월하는 클래식함이
                  우리가 도달하려는 목표입니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq" id="faq" aria-labelledby="faq-heading">
          <div className="container">
            <div className="faq-inner">
              <p className="section-label fade-in">FAQ</p>
              <h2 id="faq-heading" className="section-title fade-in fade-in-delay-1">
                자주 묻는 질문
              </h2>

              <div className="faq-list fade-in fade-in-delay-2">
                <details>
                  <summary>배송은 얼마나 걸리나요?</summary>
                  <p>
                    国内 배송은 결제 확인 후 영업일 기준 2~3일 이내 출고됩니다.
                    제주 및 도서산간 지역은 추가 2일이 소요될 수 있습니다.
                    주문 후 발송 알림 문자를 통해 배송 현황을 확인하실 수 있습니다.
                  </p>
                </details>
                <details>
                  <summary>교환 및 반품이 가능한가요?</summary>
                  <p>
                    상품 수령 후 7일 이내 교환 및 반품이 가능합니다.
                    단, 착용 흔적이 있거나 태그가 제거된 경우에는 교환·반품이 제한될 수 있습니다.
                    자세한 사항은 고객센터로 문의해 주시기 바랍니다.
                  </p>
                </details>
                <details>
                  <summary>사이즈 선택이 어렵습니다. 어떻게 해야 할까요?</summary>
                  <p>
                    각 상품 상세 페이지에 정확한 실측 사이즈 가이드가 제공됩니다.
                    라 린느 옴므의 제품은 슬림 실루엣을 기본으로 하므로,
                    평소보다 한 사이즈 크게 선택하시는 분들도 계십니다.
                    사이즈 문의는 채팅 상담을 이용해 주세요.
                  </p>
                </details>
                <details>
                  <summary>세탁은 어떻게 하는 것이 좋을까요?</summary>
                  <p>
                    울 및 리넨 소재는 드라이클리닝을 권장합니다.
                    코튼 소재는 냉수 손세탁이 가능하며, 탈수 후 그늘에서 평평하게 건조해 주세요.
                    각 상품의 케어 라벨에 세탁 방법이 상세히 표기되어 있습니다.
                  </p>
                </details>
                <details>
                  <summary>해외 배송도 가능한가요?</summary>
                  <p>
                    현재는 국내 배송만 운영 중이며, 해외 배송 서비스는 2025년 하반기 오픈 예정입니다.
                    글로벌 론칭 소식을 가장 먼저 받아보시려면 뉴스레터를 구독해 주세요.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta" id="contact" aria-labelledby="final-cta-heading">
          <div className="container">
            <p className="section-label fade-in">La Ligne Hommes</p>
            <h2 id="final-cta-heading" className="section-title fade-in fade-in-delay-1">
              당신의 선을 완성할<br /><em>시간입니다</em>
            </h2>
            <div className="final-cta-actions fade-in fade-in-delay-2">
              <button className="btn-primary" onClick={() => scrollToSection('collection')}>쇼핑 시작하기</button>
              <a href="mailto:contact@lalignehomme.com" className="btn-secondary">문의하기</a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (오리지널 유지) */}
      <footer role="contentinfo">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="/" className="logo" aria-label="La Ligne Hommes 홈">
                La Ligne Hommes
                <span>라 린느 옴므</span>
              </a>
              <p className="footer-tagline">
                세련되고 감각적인 무드를 지향하는<br />
                남성 컨템포러리 패션 brand
              </p>
            </div>
            <div className="footer-col">
              <h4>쇼핑</h4>
              <ul>
                <li><a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>아우터</a></li>
                <li><a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>티셔츠 / 셔츠</a></li>
                <li><a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>가디건 / 니트</a></li>
                <li><a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>팬츠</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>brand</h4>
              <ul>
                <li><a href="#brand" onClick={(e) => { e.preventDefault(); scrollToSection('brand'); }}>브랜드 스토리</a></li>
                <li><a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션</a></li>
                <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>자주 묻는 질문</a></li>
                <li><a href="mailto:contact@lalignehomme.com">고객 문의</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>고객센터</h4>
              <ul>
                <li><a href="#">배송 안내</a></li>
                <li><a href="#">교환 · 반품</a></li>
                <li><a href="#">사이즈 가이드</a></li>
                <li><a href="#">케어 가이드</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-biz">
            <div className="footer-biz-info">
              <span><strong>상호명</strong> 제니스</span>
              <span><strong>대표</strong> 김결</span>
              <span><strong>주소</strong> 중구 광복로49번길 33</span>
              <span><strong>전화</strong> 050.6977.2787</span>
              <span><strong>이메일</strong> busanfull6567@naver.com</span>
              <span><strong>사업자등록번호</strong> 737-68-00698</span>
              <span><strong>통신판매업 신고번호</strong> 제 2025-부산중구-0216호</span>
              <span><strong>개인정보보호 책임자</strong> 김결</span>
              <span><strong>무통장입금</strong> 국민은행 473801-04-176193 (제니스)</span>
              <span><strong>상담시간</strong> 오전 10:00 ~ 오후 4:00</span>
            </div>
            <a href="https://pf.kakao.com/_xdfQsX" target="_blank" rel="noopener noreferrer" className="footer-kakao">
              카카오 오픈채팅 상담 &rarr;
            </a>
          </div>
          <div className="footer-bottom">
            <p className="footer-legal">
              &copy; 2025 La Ligne Hommes. All rights reserved.
            </p>
            <nav className="footer-legal-links" aria-label="법적 링크">
              <a href="https://www.law.go.kr/LSW/lsInfoP.do?lsId=011357&ancYnChk=0#0000" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a>
              <a href="/terms" target="_blank" rel="noopener noreferrer">이용약관</a>
            </nav>
          </div>
        </div>
      </footer>
      <SpeedDial />
    </div>
  );
};

export default Main;