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
      fetch(`http://localhost:8080/api/banners/${type.toLowerCase()}`)
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
                  <img key={banner.id} src={(banner?.imageUrl || '').startsWith('http') ? banner.imageUrl : `http://localhost:8080${banner?.imageUrl || ''}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, opacity: currentHeroIdx === idx ? 1 : 0, transition: 'opacity 0.8s ease-in-out', zIndex: currentHeroIdx === idx ? 11 : 0 }} />
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
              <button className="btn-secondary fade-in">전체 보기</button>
            </div>
            <nav className="category-nav fade-in">
              {dynamicCategoryTabs.map(cat => (
                <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)} type="button">{cat}</button>
              ))}
            </nav>
            <div className="collection-grid" role="list">
              {products.length > 0 ? (
                (() => {
                  const filtered = products.filter(p => p.isVisible !== false && p.status !== 'STOPPED' && (activeCategory === '전체' || (p.categoryId || (p as any).category_id) === (categories.find(c => c.name === activeCategory)?.id || CATEGORY_ID_MAP[activeCategory])));
                  if (filtered.length === 0) return <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-sub)', padding: '4rem 0' }}>해당 카테고리에 등록된 상품이 없습니다.</p>;
                  return filtered.slice(0, 6).map((p, idx) => (
                    <article key={p.id} className="product-card fade-in visible">
                      <a href={`/product/${p.id}`} onClick={(e) => { e.preventDefault(); navigate(`/product/${p.id}`); }}>
                        <div className="product-img-wrap">
                          <div className="product-img-inner" style={p.imageUrl ? { backgroundImage: `url("${p.imageUrl.startsWith('http') ? p.imageUrl : `http://localhost:8080${p.imageUrl}`}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}></div>
                        </div>
                      </a>
                      <p className="product-name">{p.name}</p>
                      <p className="product-price">₩ {(p.price || p.basePrice || 0).toLocaleString()}</p>
                    </article>
                  ));
                })()
              ) : <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-sub)', padding: '4rem 0' }}>상품을 불러오는 중입니다...</p>}
            </div>
          </div>
        </section>

        <section className="editorial" aria-labelledby="editorial-heading">
          <div className="editorial-visual" aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
            <div className="editorial-bg" style={{ zIndex: 1 }}></div>
            {editorialBanners.length > 0 && (
              <div style={{ position: 'absolute', left: '50%', top: '15%', transform: 'translateX(-50%)', width: '38%', height: '68%', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', zIndex: 10, overflow: 'hidden', backgroundColor: 'rgba(17, 17, 17, 0.2)' }}>
                {editorialBanners.map((banner, idx) => (
                  <img key={banner.id} src={(banner?.imageUrl || '').startsWith('http') ? banner.imageUrl : `http://localhost:8080${banner?.imageUrl || ''}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, opacity: currentEditorialIdx === idx ? 1 : 0, transition: 'opacity 0.8s ease-in-out', zIndex: currentEditorialIdx === idx ? 11 : 0 }} />
                ))}
              </div>
            )}
          </div>
          <div className="editorial-content">
            <p className="editorial-kicker fade-in">The La Ligne Philosophy</p>
            <h2 id="editorial-heading" className="editorial-title fade-in fade-in-delay-1">선 하나에 담긴<br /><em>절제의 미학</em></h2>
            <p className="editorial-body fade-in fade-in-delay-2">과잉을 걷어낸 자리에 남는 것, 그것이 라 린느 옴므가 추구하는 스타일입니다.</p>
            <a href="#collection" className="btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection('collection'); }}>컬렉션 탐색하기</a>
          </div>
        </section>

        <section className="values" aria-labelledby="values-heading">
          <div className="container">
            <p className="section-label fade-in">Our Principles</p>
            <h2 id="values-heading" className="section-title fade-in fade-in-delay-1">brand가 지키는 것들</h2>
            <div className="values-grid">
              <div className="value-item fade-in"><p className="value-number">01</p><h3 className="value-title">Silhouette First</h3><p className="value-body">실루엣이 먼저입니다. 몸의 선을 살리는 패턴 작업에서 모든 디자인이 시작됩니다.</p></div>
              <div className="value-item fade-in fade-in-delay-1"><p className="value-number">02</p><h3 className="value-title">Material Integrity</h3><p className="value-body">소재의 진정성을 믿습니다. 엄선된 원단만이 라 린느 옴므의 이름을 달 수 있습니다.</p></div>
              <div className="value-item fade-in fade-in-delay-2"><p className="value-number">03</p><h3 className="value-title">Timeless Over Trendy</h3><p className="value-body">한 시즌이 아닌 10년을 입을 수 있는 옷을 만듭니다. 시대를 초월하는 클래식함이 목표입니다.</p></div>
            </div>
          </div>
        </section>

        <section className="faq" id="faq" aria-labelledby="faq-heading">
          <div className="container">
            <div className="faq-inner">
              <p className="section-label fade-in">FAQ</p>
              <h2 id="faq-heading" className="section-title fade-in fade-in-delay-1">자주 묻는 질문</h2>
              <div className="faq-list fade-in fade-in-delay-2">
                <details><summary>배송은 얼마나 걸리나요?</summary><p>결제 확인 후 영업일 기준 2~3일 이내 출고됩니다.</p></details>
                <details><summary>교환 및 반품이 가능한가요?</summary><p>상품 수령 후 7일 이내 가능합니다.</p></details>
              </div>
            </div>
          </div>
        </section>

        <section className="final-cta" id="contact" aria-labelledby="final-cta-heading">
          <div className="container">
            <p className="section-label fade-in">La Ligne Hommes</p>
            <h2 id="final-cta-heading" className="section-title fade-in fade-in-delay-1">당신의 선을 완성할<br /><em>시간입니다</em></h2>
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
                <li><a href="#">배송 안내</a></li>
                <li><a href="#">교환 · 반품</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-biz">
            <div className="footer-biz-info">
              <span><strong>상호명</strong> 제니스</span><span><strong>대표</strong> 김결</span><span><strong>주소</strong> 중구 광복로49번길 33</span><span><strong>전화</strong> 050.6977.2787</span><span><strong>이메일</strong> busanfull6567@naver.com</span><span><strong>사업자등록번호</strong> 737-68-00698</span>
            </div>
            <a href="https://pf.kakao.com/_xdfQsX" target="_blank" rel="noopener noreferrer" className="footer-kakao">카카오 채팅 상담 &rarr;</a>
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
