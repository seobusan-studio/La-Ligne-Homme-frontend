import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LALIGN_TERMS_TEXT } from '../constants/TermsConstants';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#111111',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Malgun Gothic", sans-serif',
      colorScheme: 'light' as any,
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: '64px', background: '#ffffff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem',
      }}>
        <span
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: '1.1rem', letterSpacing: '0.1em', color: '#111' }}
        >
          La Ligne Hommes
        </span>
        <span
          onClick={() => navigate(-1)}
          style={{ cursor: 'pointer', fontSize: '0.78rem', letterSpacing: '0.15em', color: '#777', textTransform: 'uppercase' }}
        >
          ← 뒤로가기
        </span>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.4em', color: '#b89a6a', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Legal
        </p>
        <h1 style={{ fontSize: '2rem', fontWeight: 300, fontFamily: 'Georgia, serif', marginBottom: '0.5rem', color: '#111' }}>
          이용약관
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '3rem', borderBottom: '1px solid #e0e0e0', paddingBottom: '2rem' }}>
          공정거래위원회 표준약관 제10023호 준수 · 최종 개정일 2025년 1월 1일
        </p>

        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'keep-all',
          lineHeight: '2',
          fontSize: '0.88rem',
          color: '#333',
          fontFamily: 'inherit',
        }}>
          {LALIGN_TERMS_TEXT}
        </pre>
      </main>

      {/* Footer */}
      <footer style={{ background: '#111', color: '#fff', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>
          &copy; 2025 La Ligne Hommes. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default TermsPage;
