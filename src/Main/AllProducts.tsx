import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AllProducts.css';
import SpeedDial from '../components/SpeedDial/SpeedDial';

interface Product {
  id: number;
  name: string;
  brandName: string;
  price: number;
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

const AllProducts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [loading, setLoading] = useState(true);

  // 초기 카테고리 설정 (메인에서 타고 왔을 경우 대응)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category');
    if (catParam) {
      setActiveCategory(catParam);
    }
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    // 카테고리 로드
    fetch(`${import.meta.env.VITE_API_URL}/api/categories`)
      .then(res => res.json())
      .then(result => {
        if (result.data) setCategories(result.data);
      });

    // 전체 상품 로드
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => res.json())
      .then(result => {
        if (result.data) {
          setProducts(result.data);
        } else if (Array.isArray(result)) {
          setProducts(result);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const dynamicCategoryTabs = ['전체', ...categories.map((c: any) => c.name)];

  const filteredProducts = products.filter(p => {
    if (p.isVisible === false || p.status === 'STOPPED') return false;
    if (activeCategory === '전체') return true;
    
    const matchedCat = categories.find(c => c.name === activeCategory);
    const targetId = matchedCat ? matchedCat.id : CATEGORY_ID_MAP[activeCategory];
    
    return (p.categoryId || (p as any).category_id) === targetId;
  });

  return (
    <div className="all-products-page">
      <header className="all-products-header">
        <nav className="container">
          <div className="header-inner">
            <span className="back-btn" onClick={() => navigate('/')}>← BACK TO MAIN</span>
            <h1 className="logo" onClick={() => navigate('/')}>LA LIGNE HOMMES</h1>
          </div>
        </nav>
      </header>

      <main className="container">
        <section className="all-products-content">
          <div className="page-title-area">
            <p className="page-eyebrow">Collection</p>
            <h2 className="page-title">{activeCategory}</h2>
          </div>

          <nav className="all-category-tabs">
            {dynamicCategoryTabs.map(cat => (
              <button 
                key={cat} 
                className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat);
                  navigate(`/all-products?category=${cat}`, { replace: true });
                }}
              >
                {cat}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="all-loading">컬렉션을 불러오는 중입니다...</div>
          ) : (
            <div className="all-products-grid">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <article key={product.id} className="all-product-card" onClick={() => navigate(`/product/${product.id}`)}>
                    <div className="all-product-img-wrap">
                      <div 
                        className="all-product-img"
                        style={{ backgroundImage: `url("${product.imageUrl?.startsWith('http') ? product.imageUrl : `${import.meta.env.VITE_API_URL}${product.imageUrl}`}")` }}
                      ></div>
                    </div>
                    <div className="all-product-info">
                      <p className="brand">{product.brandName || 'LA LIGNE HOMMES'}</p>
                      <h3 className="name">{product.name}</h3>
                      <p className="price">₩ {product.price.toLocaleString()}</p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="no-products">해당 카테고리에 상품이 존재하지 않습니다.</div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="all-products-footer">
        <p>&copy; 2025 La Ligne Hommes. All rights reserved.</p>
      </footer>
      <SpeedDial />
    </div>
  );
};

export default AllProducts;
