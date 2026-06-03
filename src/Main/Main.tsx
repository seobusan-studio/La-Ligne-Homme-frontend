import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Main.css';
import SpeedDial from '../components/SpeedDial/SpeedDial';

interface Product {
  id: number;
  name: string;
  brandName: string;
  basePrice?: number;
  price?: number;
  base_price?: number;
  description: string;
  imageUrl?: string;
  categoryId?: number;
  status?: string;
  isVisible?: boolean;
}

const CATEGORY_ID_MAP: Record<string, number> = {
  '아우터': 1,
  '티셔츠 / 셔츠': 2,
  '가디건 / 니트': 3,
  '팬츠': 4
};

const Main: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<{ name: string; role?: string } | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [categories, setCategories] = useState<any[]>([]);
  
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

  const [editorialBanners, setEditorialBanners] = useState<any[]>([]);
  const [currentEditorialIdx, setCurrentEditorialIdx] = useState(0);

  const loadData = () => {
    const fetchBanners = (type: string, setter: any) => {
      fetch(`${import.meta.env.VITE_API_URL}/api/banners/${type.toLowerCase()}`)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setter(Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []));
          }
        })
        .catch(err => console.error(`${type} 배너 통신 대기 중...`, err));
    };

    fetchBanners('HERO', setHeroBanners);
    fetchBanners('EDITORIAL', setEditorialBanners);

    fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setCategories(result.data);
        }
      })
      .catch(err => console.error('동적 카테고리 통신 대기 중...', err));

    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setProducts(result.data);
        } else if (Array.isArray(result)) {
          setProducts(result);
        }
      })
      .catch(err => console.error('백엔드 대기 중...', err));
  };

  useEffect(() => {
    const SESSION_KEY = 'laligne_session';
    const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (sessionRaw) {
      setUser(JSON.parse(sessionRaw));
    }
    loadData();
    const syncInterval = setInterval(loadData, 3000);
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    if (heroBanners.length <= 1) {
      setCurrentHeroIdx(0);
      return;
    }
    const timer = setInterval(() => {
      setCurrentHeroIdx(prev => (prev + 1) % heroBanners.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [heroBanners]);

  useEffect(() => {
    if (editorialBanners.length <= 1) {
      setCurrentEditorialIdx(0);
      return;
    }
    const timer = setInterval(() => {
      setCurrentEditorialIdx(prev => (prev + 1) % editorialBanners.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [editorialBanners]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
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
  }, [products, activeCategory, categories]);

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

  const dynamicCategoryTabs = categories.length > 0 
    ? ['전체', ...categories.map((c: any) => c.name)]
    : ['전체', '아우터', '티셔츠 / 셔츠', '가디건 / 니트', '팬츠'];

  return (
    <div className="main-page-box">
      <a href="#main" className="skip-link">본문 바로가기</a>

      <nav className={`mobile-nav ${isNavOpen ? 'open' : ''}`} id="mobile-nav" aria-label="모바일 메뉴" aria-hidden={!isNavOpen}>
        <button className="mobile-nav-close" onClick={() => setIsNavOpen(false)} aria-label="메뉴 닫기">&#xd7;</button>
        <a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션</a>
        <a href="#brand" onClick={(e) => { e.preventDefault(); scrollToSection('brand'); }}>브랜드</a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>문의</a>
      </nav>

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
          <div className="nav-right">
            {!user ? (
              <>
                <button onClick={() => navigate('/cart')} className="btn-header desktop-only">장바구니</button>
                <button onClick={() => navigate('/guest-lookup')} className="btn-header desktop-only">비회원 주문조회</button>
                <button onClick={() => navigate('/login')} className="btn-header desktop-only">로그인</button>
                <button onClick={() => navigate('/signup')} className="btn-header desktop-only">회원가입</button>
              </>
            ) : (
              <>
                <span className="nav-user desktop-only">{user.name}님</span>
                {user.role !== 'ADMIN' && (
                  <>
                    <button onClick={() => navigate('/cart')} className="btn-header desktop-only">장바구니</button>
                    <button onClick={() => navigate('/mypage')} className="btn-header desktop-only">마이페이지</button>
                  </>
                )}
                <button onClick={handleLogout} className="btn-header desktop-only">로그아웃</button>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <button onClick={() => navigate('/admin')} className="btn-header desktop-only" style={{ borderColor: 'var(--color-gold)', color: 'var(--color-gold)' }}>관리자 페이지</button>
            )}
            <button className="hamburger" onClick={() => setIsNavOpen(true)} aria-label="메뉴 열기">
              <span></span><span></span><span></span>
            </button>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-visual" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <div className="hero-img-placeholder" style={{ zIndex: 1 }}></div>
            {heroBanners.length > 0 && (
              <div style={{ position: 'absolute', left: '50%', top: '15%', transform: 'translateX(-50%)', width: '38%', height: '68%', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', zIndex: 10, overflow: 'hidden', backgroundColor: 'rgba(17, 17, 17, 0.2)' }}>
                {heroBanners.map((banner, idx) => (
                  <img key={banner.id} src={(banner?.imageUrl || '').startsWith('http') ? banner.imageUrl : `${import.meta.env.VITE_API_URL}${banner?.imageUrl || ''}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, opacity: currentHeroIdx === idx ? 1 : 0, transition: 'opacity 0.8s ease-in-out', zIndex: currentHeroIdx === idx ? 11 : 0 }} />
                ))}
              </div>
            )}
            <span className="hero-season-tag" style={{ zIndex: 20 }}>Collection</span>
          </div>
          <div className="hero-content">
            <p className="hero-eyebrow fade-in">Nouvelle Collection</p>
            <h1 id="hero-heading" className="hero-title fade-in fade-in-delay-1">남성의 선,<br /><em>La Ligne</em></h1>
            <p className="hero-subtitle fade-in fade-in-delay-2">라 린느 옴므는 프랑스어로 '남성의 선'을 의미합니다.<br />깔끔한 실루엣 and 미니멀한 디자인으로 현대 남성의 감각을 완성합니다.</p>
            <div className="hero-cta-group fade-in fade-in-delay-3">
              <a href="#collection" className="btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션 보기</a>
              <a href="#brand" className="btn-secondary" onClick={(e) => { e.preventDefault(); scrollToSection('brand'); }}>브랜드 스토리</a>
            </div>
          </div>
        </section>

        <section className="brand-intro" id="brand" aria-labelledby="brand-heading">
          <div className="container">
            <div className="brand-intro-inner">
              <p className="section-label fade-in">Maison La Ligne Hommes</p>
              <h2 id="brand-heading" className="section-title fade-in fade-in-delay-1">세련되고 감각적인 무드,<br /><em>미니멀의 철학</em></h2>
              <div className="brand-divider fade-in"></div>
              <p className="section-body fade-in fade-in-delay-2">'라 린느 옴므(La Ligne Hommes)'는 세련되고 감각적인 무드를 지향하는 남성 컨템포러리 패션 브랜드입니다.<br />깔끔한 실루엣 and 미니멀한 디자인이 특징이며, 정제된 선 하나에 담긴 감각이 현대 남성의 일상을 특별하게 만들어 드립니다.</p>
            </div>
          </div>
        </section>

        <section className="collection" id="collection" aria-labelledby="collection-heading">
          <div className="container">
            <div className="collection-header">
              <h2 id="collection-heading" className="section-title fade-in fade-in-delay-1">신상품</h2>
              <button className="btn-secondary fade-in" onClick={() => navigate(`/all-products?category=${activeCategory}`)}>전체 보기</button>
            </div>
            <nav className="category-nav fade-in">
              {dynamicCategoryTabs.map(cat => (
                <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)} type="button">{cat}</button>
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

                    const matchedCat = categories.find(c => c.name === activeCategory);
                    const targetId = matchedCat ? matchedCat.id : CATEGORY_ID_MAP[activeCategory];

                    return prodCatId === targetId;
                  });

                  if (filtered.length === 0) {
                    return (
                      <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-sub)', padding: '4rem 0', letterSpacing: '0.05em' }}>
                        해당 카테고리에 등록된 상품이 없습니다.
                      </p>
                    );
                  }

                  return filtered.slice(0, 6).map((product, idx) => (
                    <article key={product.id} className={`product-card fade-in visible ${idx === 1 ? 'fade-in-delay-1' : idx === 2 ? 'fade-in-delay-2' : ''}`} role="listitem">
                      <a href={`/product/${product.id}`} onClick={(e) => { e.preventDefault(); navigate(`/product/${product.id}`); }} aria-label={`${product.name} 상세 보기`}>
                        <div className="product-img-wrap">
                          <div
                            className={`product-img-inner prod-${(idx % 6) + 1}`}
                            style={product.imageUrl ? { backgroundImage: `url("${product.imageUrl.startsWith('http') ? product.imageUrl : `${import.meta.env.VITE_API_URL}${product.imageUrl}`}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                            role="img"
                            aria-label={product.name}
                          ></div>
                          {idx === 0 && <span className="product-tag">New</span>}
                          {idx === 2 && <span className="product-tag">Best</span>}
                        </div>
                      </a>
                      <p className="product-name">{product.name}</p>
                      <p className="product-price">₩ {(product.price || product.basePrice || 0).toLocaleString()}</p>
                    </article>
                  ));
                })()
              ) : (
                <>
                  <article className="product-card fade-in" role="listitem">
                    <a href="#" aria-label="미니멀 린넨 코트 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-1" role="img" aria-label="미니멀 린넨 코트"></div>
                        <span className="product-tag">New</span>
                      </div>
                    </a>
                    <p className="product-name">미니멀 린넨 코트</p>
                    <p className="product-price">₩ 498,000</p>
                  </article>
                  <article className="product-card fade-in fade-in-delay-1" role="listitem">
                    <a href="#" aria-label="슬림핏 치노 팬츠 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-2" role="img" aria-label="슬림핏 치노 팬츠"></div>
                      </div>
                    </a>
                    <p className="product-name">슬림핏 치노 팬츠</p>
                    <p className="product-price">₩ 368,000</p>
                  </article>
                  <article className="product-card fade-in fade-in-delay-2" role="listitem">
                    <a href="#" aria-label="스트라이프 셔츠 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-3" role="img" aria-label="스트라이프 셔츠"></div>
                        <span className="product-tag">Best</span>
                      </div>
                    </a>
                    <p className="product-name">스트라이프 셔츠</p>
                    <p className="product-price">₩ 148,000</p>
                  </article>
                  <article className="product-card fade-in" role="listitem">
                    <a href="#" aria-label="브라운 로퍼 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-4" role="img" aria-label="브라운 로퍼"></div>
                      </div>
                    </a>
                    <p className="product-name">브라운 로퍼</p>
                    <p className="product-price">₩ 218,000</p>
                  </article>
                  <article className="product-card fade-in fade-in-delay-1" role="listitem">
                    <a href="#" aria-label="리젠트 블레이저 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-5" role="img" aria-label="리젠트 블레이저"></div>
                      </div>
                    </a>
                    <p className="product-name">리젠트 블레이저</p>
                    <p className="product-price">₩ 298,000</p>
                  </article>
                  <article className="product-card fade-in fade-in-delay-2" role="listitem">
                    <a href="#" aria-label="하루타 슈즈 상세 보기">
                      <div className="product-img-wrap">
                        <div className="product-img-inner prod-6" role="img" aria-label="하루타 슈즈"></div>
                        <span className="product-tag">New</span>
                      </div>
                    </a>
                    <p className="product-name">하루타 슈즈</p>
                    <p className="product-price">₩ 198,000</p>
                  </article>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="editorial" aria-labelledby="editorial-heading">
          <div className="editorial-visual" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <div className="editorial-bg" style={{ zIndex: 1 }}></div>
            {editorialBanners.length > 0 && (
              <div style={{ position: 'absolute', left: '50%', top: '15%', transform: 'translateX(-50%)', width: '38%', height: '68%', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', zIndex: 10, overflow: 'hidden', backgroundColor: 'rgba(17, 17, 17, 0.2)' }}>
                {editorialBanners.map((banner, idx) => (
                  <img key={banner.id} src={(banner?.imageUrl || '').startsWith('http') ? banner.imageUrl : `${import.meta.env.VITE_API_URL}${banner?.imageUrl || ''}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, opacity: currentEditorialIdx === idx ? 1 : 0, transition: 'opacity 0.8s ease-in-out', zIndex: currentEditorialIdx === idx ? 11 : 0 }} />
                ))}
              </div>
            )}
          </div>
          <div className="editorial-content">
            <p className="editorial-kicker fade-in">The La Ligne Philosophy</p>
            <h2 id="editorial-heading" className="editorial-title fade-in fade-in-delay-1">
              선 하나에 담긴<br /><em>절제의 미학</em>
            </h2>
            <p className="editorial-body fade-in fade-in-delay-2">
              과잉을 걷어낸 자리에 남는 것, 그것이 라 린느 옴므가 추구하는 스타일입니다.<br />
              불필요한 장식보다는 본질에 집중함으로써 시대를 초월하는 우아함을 지향합니다.
            </p>
            <a href="#collection" className="btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션 탐색하기</a>
          </div>
        </section>

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
                  실루엣이 먼저입니다. 몸의 선을 따라 흐르는 테일러링은 단순한 옷 이상의 가치를 전달합니다.
                  정교한 마무리는 언제나 완성도를 높여줍니다.
                </p>
              </div>
              <div className="value-item fade-in fade-in-delay-1">
                <p className="value-number" aria-hidden="true">02</p>
                <h3 className="value-title">Material Integrity</h3>
                <p className="value-body">
                  소재의 진정성을 믿습니다. 프리미엄 코튼, 엄선된 리넨, 메리노 울 등 최고급 원단만을 고집하여 피부에 닿는 촉감부터 다릅니다.
                </p>
              </div>
              <div className="value-item fade-in fade-in-delay-2">
                <p className="value-number" aria-hidden="true">03</p>
                <h3 className="value-title">Timeless Over Trendy</h3>
                <p className="value-body">
                  한 시즌이 아닌 10년을 입을 수 있는 옷을 만듭니다. 트렌드를 넘어서는 클래식함이 우리가 추구하는 목표입니다.
                </p>
              </div>
            </div>
          </div>
        </section>

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
                    결제 확인 후 영업일 기준 2~3일 이내 출고됩니다.
                    제주 및 도서 산간 지역은 추가 2일 정도 소요될 수 있습니다.
                    주문 후 발송 완료 문자를 통해 배송 현황을 확인하실 수 있습니다.
                  </p>
                </details>
                <details>
                  <summary>교환 및 반품이 가능한가요?</summary>
                  <p>
                    수령 후 7일 이내 교환 및 반품 가능합니다.
                    단, 착용 흔적이 있거나 태그가 제거된 경우에는 교환/반품이 어렵습니다.
                    자세한 사항은 고객센터로 문의 주시기 바랍니다.
                  </p>
                </details>
                <details>
                  <summary>사이즈 문의드립니다. 정사이즈인가요?</summary>
                  <p>
                    대체로 정사이즈로 제작되나 제품별로 실측 사이즈가 차이 날 수 있습니다.
                    라 린느 옴므는 슬림 실루엣을 기본으로 하므로, 
                    넉넉한 핏을 선호하시면 한 사이즈 크게 주문하시는 것을 권장합니다.
                    사이즈 문의는 채팅 상담을 이용해 주세요.
                  </p>
                </details>
                <details>
                  <summary>세탁 및 관리는 어떻게 하나요?</summary>
                  <p>
                    울 및 리넨 소재 제품은 드라이클리닝을 권장합니다.
                    코튼 소재 제품은 손세탁 혹은 세탁망에 넣어 찬물로 세탁해 주세요.
                    가급적 건조기 사용은 피해주시고 그늘에서 건조해 주시기 바랍니다.
                  </p>
                </details>
                <details>
                  <summary>해외 배송도 가능한가요?</summary>
                  <p>
                    현재 국내 배송을 우선으로 하고 있으며 해외 배송은 준비 중입니다.
                    글로벌 런칭 예정일이 정해지면 다시 공지해 드리겠습니다.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>

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

      <footer role="contentinfo">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="/" className="logo">La Ligne Hommes<span>라 린느 옴므</span></a>
              <p className="footer-tagline">세련되고 감각적인 무드를 지향하는 남성 컨템포러리 패션 brand</p>
            </div>
            <div className="footer-col">
              <h4>쇼핑</h4>
              <ul>
                {(categories.length > 0 ? categories : [{id:1,name:'아우터'},{id:2,name:'티셔츠 / 셔츠'},{id:3,name:'가디건 / 니트'},{id:4,name:'팬츠'}]).slice(0, 4).map(cat => (
                  <li key={cat.id}><a href="#collection" onClick={(e) => { e.preventDefault(); setActiveCategory(cat.name); scrollToSection('collection'); }}>{cat.name}</a></li>
                ))}
              </ul>
            </div>
            {categories.length > 4 && (
              <div className="footer-col">
                <h4 style={{ opacity: 0 }}>&nbsp;</h4>
                <ul>
                  {categories.slice(4).map(cat => (
                    <li key={cat.id}><a href="#collection" onClick={(e) => { e.preventDefault(); setActiveCategory(cat.name); scrollToSection('collection'); }}>{cat.name}</a></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="footer-col">
              <h4>brand</h4>
              <ul>
                <li><a href="#brand" onClick={(e) => { e.preventDefault(); scrollToSection('brand'); }}>브랜드 스토리</a></li>
                <li><a href="#collection" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션</a></li>
                <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>자주 묻는 질문</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>고객센터</h4>
              <ul>
                <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>배송 안내</a></li>
                <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); }}>교환 · 반품</a></li>
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
              <span><strong>통신판매업신고번호</strong> 제 2025-부산중구-0216호</span>
              <span><strong>개인정보보호책임자</strong> 김결</span>
              <span><strong>무통장입금계좌</strong> 국민은행 473801-04-176193 (제니스)</span>
              <span><strong>운영시간</strong> 평일 10:00 ~ 오후 4:00</span>
            </div>
            <a href="https://pf.kakao.com/_xdfQsX" target="_blank" rel="noopener noreferrer" className="footer-kakao">
              카카오 채팅 상담 &rarr;
            </a>
          </div>
          <div className="footer-bottom">
            <p className="footer-legal">&copy; 2025 La Ligne Hommes. All rights reserved.</p>
            <nav className="footer-legal-links"><a href="#">개인정보 처리방침</a><a href="/terms">이용약관</a></nav>
          </div>
        </div>
      </footer>
      <SpeedDial />
    </div>
  );
};

export default Main;
