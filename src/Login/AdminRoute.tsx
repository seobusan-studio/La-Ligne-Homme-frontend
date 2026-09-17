import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { apiFetch, readSession } from '../lib/api';

const AdminRoute: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'admin' | 'login' | 'denied' | 'error'>('checking');
  useEffect(() => {
    let active = true;
    if (!readSession()) { setStatus('login'); return; }
    apiFetch(`${import.meta.env.VITE_API_URL}/api/users/profile`)
      .then(async response => {
        if (!active) return;
        if (response.status === 401) { setStatus('login'); return; }
        if (!response.ok) { setStatus('error'); return; }
        const result = await response.json();
        if (active) setStatus(result.success && result.data?.role === 'ADMIN' ? 'admin' : 'denied');
      })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, []);

  if (status === 'checking') return <p role="status">접근 권한을 확인하고 있습니다.</p>;
  if (status === 'login') return <Navigate to="/login" replace />;
  if (status === 'denied') return <Navigate to="/" replace />;
  if (status === 'error') return <p role="alert">접근 권한을 확인하지 못했습니다. 잠시 후 새로고침해 주세요.</p>;
  return <Outlet />;
};

export default AdminRoute;
