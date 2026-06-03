import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpeedDial.css';

interface RecentItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

const SpeedDial: React.FC = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const ACTIONS = [
    {
      key: 'top',
      label: '맨 위로',
      icon: '↑',
      onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    },
    {
      key: 'recent',
      label: '최근 본 상품',
      icon: '👀',
      onClick: async () => {
        const SESSION_KEY = 'laligne_session';
        const sessionRaw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;

        if (session && session.id) {
          // 1. [로그인 회원] 백엔드 DB에서 최신 목록 인양
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products/recent?userId=${session.id}`);
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
              setRecentItems(result.data);
            }
          } catch (e) {
            console.error('DB 최근 본 상품 조회 실패:', e);
          }
        } else {
          // 2. [비회원/게스트] 로컬스토리지에서 인양
          const raw = localStorage.getItem('laligne_recent_views');
          if (raw) setRecentItems(JSON.parse(raw));
        }
        setIsDrawerOpen(true);
      },
    },
    {
      key: 'kakao',
      label: '카카오 상담',
      icon: '💬',
      onClick: () => window.open('https://pf.kakao.com/_xdfQsX', '_blank', 'noopener,noreferrer'),
    },
    {
      key: 'cart',
      label: '장바구니',
      icon: '🛒',
      onClick: () => navigate('/cart'),
    },
    {
      key: 'mypage',
      label: '마이페이지',
      icon: '👤',
      onClick: () => navigate('/mypage'),
    },
  ];

  return (
    <>
      <div className="speed-dial-container">
        {ACTIONS.map((action) => (
          <button
            key={action.key}
            type="button"
            className="speed-dial-btn"
            onClick={action.onClick}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>

      {/* 최근 본 상품 사이드 드로워 */}
      <div className={`recent-view-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>RECENTLY VIEWED</h3>
          <button className="close-btn" onClick={() => setIsDrawerOpen(false)}>×</button>
        </div>
        <div className="drawer-body">
          {recentItems.length > 0 ? (
            recentItems.map((item) => (
              <div 
                key={item.id} 
                className="recent-item-card"
                onClick={() => {
                  navigate(`/product/${item.id}`);
                  setIsDrawerOpen(false);
                }}
              >
                <div 
                  className="recent-item-img" 
                  style={{ backgroundImage: `url("${item.imageUrl.startsWith('http') ? item.imageUrl : `${import.meta.env.VITE_API_URL}${item.imageUrl}`}")` }}
                ></div>
                <div className="recent-item-info">
                  <p className="name">{item.name}</p>
                  <p className="price">₩{item.price.toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-msg">최근 본 상품이 없습니다.</p>
          )}
        </div>
      </div>
      
      {/* 배경 오버레이 */}
      {isDrawerOpen && <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}></div>}
    </>
  );
};

export default SpeedDial;
