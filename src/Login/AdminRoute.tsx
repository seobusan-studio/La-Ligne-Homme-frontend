import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute: React.FC = () => {
  const SESSION_KEY = 'laligne_session';
  
  // 1. 로컬스토리지 또는 세션스토리지에서 로그인 데이터 가져오기
  const savedSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);

  if (!savedSession) {
    // 로그인이 안 되어 있으면 홈으로 튕김
    return <Navigate to="/login" replace />;
  }

  try {
    const userData = JSON.parse(savedSession);
    
    // 2. 권한이 ADMIN이 아니면 홈으로 강제 리다이렉트
    if (userData.role !== 'ADMIN') {
      alert('관리자만 접근 가능한 페이지입니다.');
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  // 3. 관리자가 맞으면 원래 가려던 하위 관리자 페이지(Dashboard 등)를 그대로 보여줌
  return <Outlet />;
};

export default AdminRoute;