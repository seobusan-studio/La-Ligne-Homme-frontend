import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SpeedDial.css';

const ACTIONS = [
  {
    key: 'top',
    label: '맨 위로',
    icon: '↑',
    onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
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
    onClick: null,
  },
  {
    key: 'mypage',
    label: '마이페이지',
    icon: '👤',
    onClick: null,
  },
];

const SpeedDial: React.FC = () => {
  const navigate = useNavigate();

  const getHandler = (key: string, staticHandler: (() => void) | null) => {
    if (key === 'cart') return () => navigate('/cart');
    if (key === 'mypage') return () => navigate('/mypage');
    return staticHandler!;
  };

  return (
    <div className="speed-dial-container">
      {ACTIONS.map((action) => (
        <button
          key={action.key}
          type="button"
          className="speed-dial-btn"
          onClick={() => getHandler(action.key, action.onClick)()}
          aria-label={action.label}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};

export default SpeedDial;
