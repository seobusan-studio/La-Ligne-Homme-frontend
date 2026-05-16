import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminMain.css';

// 카테고리 한글 명칭과 백엔드 DB ID 매핑 테이블
const CATEGORY_MAP: Record<string, number> = {
  '아우터': 1,
  '티셔츠 / 셔츠': 2,
  '가디건 / 니트': 3,
  '팬츠': 4
};

const AdminMain: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // 백엔드 DB 연동 데이터 상태창들
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]); 

  // 상품 탭 내부 뷰포트 전환 제어 상태
  const [productViewMode, setProductViewMode] = useState<'list' | 'create'>('list');
  
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // 등록 폼 입력 상태 필드
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('아우터');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  // 대시보드 실시간 정산 지표 상태
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRefund: 0,
    netProfit: 0,
    orderCount: 0,
  });

  // 백엔드 전용 전역 데이터 싱크로나이저 엔진
  const loadBackendData = async () => {
    try {
      const resStats = await fetch('http://localhost:8080/api/order/admin/settlement');
      const resultStats = await resStats.json();
      if (resultStats.status === 'SUCCESS' && resultStats.data) {
        setStats(resultStats.data);
      }
    } catch (e) { console.log('정산 통계 통신 대기 중...'); }

    try {
      const resProd = await fetch('http://localhost:8080/api/products');
      const resultProd = await resProd.json();
      if (resultProd.data) {
        setProducts(resultProd.data);
      } else if (Array.isArray(resultProd)) {
        setProducts(resultProd);
      }
    } catch (e) { console.log('상품 데이터 통신 대기 중...'); }

    try {
      const resOrders = await fetch('http://localhost:8080/api/admin/orders');
      const resultOrders = await resOrders.json();
      if (resultOrders.data) setOrders(resultOrders.data);
      else if (Array.isArray(resultOrders)) setOrders(resultOrders);
    } catch (e) { console.log('주문 API 통신 대기 중...'); }

    try {
      const resUsers = await fetch('http://localhost:8080/api/admin/users');
      const resultUsers = await resUsers.json();
      if (resultUsers.data) setUsers(resultUsers.data);
      else if (Array.isArray(resultUsers)) setUsers(resultUsers);
    } catch (e) { console.log('회원 API 통신 대기 중...'); }

    try {
      const resSubs = await fetch('http://localhost:8080/api/admin/subscribers');
      const resultSubs = await resSubs.json();
      if (resultSubs.data) setSubscribers(resultSubs.data);
      else if (Array.isArray(resultSubs)) setSubscribers(resultSubs);
    } catch (e) { console.log('뉴스레터 구독자 API 통신 대기 중...'); }
  };

  // 🌟 무한 난사 대재앙 차단 인프라 보존
  useEffect(() => {
    loadBackendData();
  }, [activeTab]);

  // 실시간 주문 배송 상태 변경 처리 라우트
  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        alert(`주문 번호 [${orderId}]의 상태가 [${newStatus}](으)로 DB에 반영되었습니다.`);
        loadBackendData();
      } else {
        alert('배송 상태 업데이트 실패');
      }
    } catch (err) {
      alert('백엔드 상태 변경 API 서버가 꺼져있습니다.');
    }
  };

  // 실시간 회원 권한 조정 처리 라우트
  const handleUserRoleToggle = async (email: string, currentRole: string) => {
    const targetRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!window.confirm(`[${email}] 계정 권한을 ${targetRole}(으)로 변경하시겠습니까?`)) return;

    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${email}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });
      if (response.ok) {
        alert('회원 권한 정보가 성공적으로 변경되었습니다.');
        loadBackendData();
      } else {
        alert('권한 조정 처리 실패');
      }
    } catch (err) {
      alert('백엔드 회원 제어 API 서버가 꺼져있습니다.');
    }
  };

  // 다중 이미지 파일 일괄 처리 벨트
  const handleMultipleFiles = (files: File[]) => {
    const validImages = files.filter(file => file.type.startsWith('image/'));
    if (validImages.length === 0) return;
    setImageFiles(prev => [...prev, ...validImages]);
    const newPreviews = validImages.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFiles(Array.from(e.target.files));
    }
  };

  const resetRegisterForm = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    setProdName('');
    setProdPrice('');
    setProdStock('');
    setProdDesc('');
    setProductViewMode('list');
  };

  // 진짜 스프링부트 백엔드로 다중 멀티파트 데이터 전송
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      alert('상품명과 가격은 필수 기입 항목입니다.');
      return;
    }

    const formData = new FormData();
    const productRequestDto = {
      categoryId: CATEGORY_MAP[prodCategory] || 1,
      name: prodName,
      description: prodDesc,
      basePrice: parseInt(prodPrice, 10),
      isVisible: true,
      options: []
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(productRequestDto)], { type: 'application/json' })
    );

    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('http://localhost:8080/api/products', {
        method: 'POST',
        headers: { 'X-Admin-Id': '1' },
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.status !== 'ERROR') {
        alert('스프링 부트 백엔드 본체 및 DB로 상품 등록 완료!');
        resetRegisterForm();
        loadBackendData();
      } else {
        alert(`등록 실패: ${result.message || '서버 명세 에러'}`);
      }
    } catch (err) {
      alert('서버 에러가 포착되었습니다.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <section className="stats-grid">
              <div className="stats-card">
                <h3>총 매출액</h3>
                <p className="card-value">₩ {stats.totalSales.toLocaleString()}</p>
                <span className="card-badge sales">결제 완료 기준</span>
              </div>
              <div className="stats-card">
                <h3>총 환불액</h3>
                <p className="card-value refund">₩ {stats.totalRefund.toLocaleString()}</p>
                <span className="card-badge refund">취소 완료 기준</span>
              </div>
              <div className="stats-card highlight">
                <h3>당기 순이익</h3>
                <p className="card-value profit">₩ {stats.netProfit.toLocaleString()}</p>
                <span className="card-badge profit">매출 - 환불</span>
              </div>
              <div className="stats-card">
                <h3>주문 건수</h3>
                <p className="card-value">{stats.orderCount} 건</p>
                <span className="card-badge count">실결제 기준</span>
              </div>
            </section>

            <section className="dashboard-detail-section">
              <h2>최근 주문 동향 (실시간 연동)</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>주문 번호</th>
                    <th>주문자</th>
                    <th>결제 금액</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(order => (
                    <tr key={order.id || order.orderId}>
                      <td>{order.id || order.orderId}</td>
                      <td>{order.customer || order.customerName || '비회원'}</td>
                      {/* 🌟 [교정 완료] order.map 스코프에 맞춰 대시보드 주문 금액 표기 명세를 수정했습니다. */}
                      <td className="price-cell">₩ {(order.price || order.totalPrice || 0).toLocaleString()}</td>
                      <td>
                        <span className={`status-tag ${order.status === '배송완료' ? 'done' : 'ing'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'#555'}}>최근 들어온 실시간 주문이 없습니다.</td></tr>}
                </tbody>
              </table>
            </section>
          </>
        );

      case 'products':
        if (productViewMode === 'create') {
          return (
            <div className="wide-register-panel">
              <header className="wide-panel-header">
                <h2>새로운 컬렉션 상품 등록</h2>
                <div className="wide-header-actions">
                  <button type="button" className="btn-admin-cancel" onClick={resetRegisterForm}>취소하고 돌아가기</button>
                  <button type="button" className="btn-admin-submit" onClick={handleFormSubmit}>상품 게시하기</button>
                </div>
              </header>

              <form onSubmit={handleFormSubmit} className="wide-panel-body">
                <div className="wide-media-section">
                  <div 
                    className={`wide-dropzone ${dragActive ? 'active' : ''} ${imagePreviews.length > 0 ? 'has-preview' : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                  >
                    {imagePreviews.length > 0 ? (
                      <div className="wide-preview-main-box">
                        <img src={imagePreviews[0]} alt="메인 대표 썸네일" />
                        <span className="main-badge">대표 썸네일 (1:1 Aspect)</span>
                      </div>
                    ) : (
                      <div className="upload-placeholder-content">
                        <svg className="upload-icon" viewBox="0 0 24 24" width="44" height="44">
                          <path fill="currentColor" d="M19.5 4.5h-15a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3Zm-15 1.5h15a1.5 1.5 0 0 1 1.5 1.5v5.44l-3.32-2.49a1.5 1.5 0 0 0-2 0l-4.51 3.38-2.67-1.78a1.5 1.5 0 0 0-1.83.13l-3.67 3.3V7.5A1.5 1.5 0 0 1 4.5 6Z"/>
                        </svg>
                        <p>고해상도 룩북 사진들을 드래그하여 드롭하세요</p>
                        <label htmlFor="file-upload-input" className="wide-file-label">컴퓨터에서 복수 선택</label>
                        <input id="file-upload-input" type="file" accept="image/*" multiple className="hidden-file-input" onChange={handleFileChange} />
                      </div>
                    )}
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="wide-thumbs-grid">
                      {imagePreviews.map((url, idx) => (
                        <div key={idx} className={`wide-thumb-card ${idx === 0 ? 'main-active' : ''}`}>
                          <img src={url} alt={`슬라이드 ${idx}`} />
                          <span className="thumb-idx-indicator">{idx === 0 ? '대표' : `${idx + 1}`}</span>
                        </div>
                      ))}
                      <label htmlFor="file-upload-more" className="wide-thumb-add-card">+</label>
                      <input id="file-upload-more" type="file" accept="image/*" multiple className="hidden-file-input" onChange={handleFileChange} />
                    </div>
                  )}
                </div>

                <div className="wide-info-section">
                  <div className="wide-input-group">
                    <label>상품명</label>
                    <input type="text" placeholder="제품 성명 입력..." value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                  </div>

                  <div className="wide-input-row-grid">
                    <div className="wide-input-group">
                      <label>카테고리 분류</label>
                      <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
                        <option value="아우터">아우터</option>
                        <option value="티셔츠 / 셔츠">티셔츠 / 셔츠</option>
                        <option value="가디건 / 니트">가디건 / 니트</option>
                        <option value="팬츠">팬츠</option>
                      </select>
                    </div>
                    <div className="wide-input-group">
                      <label>판매가 (₩)</label>
                      <input type="number" placeholder="단가 입력..." value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                    </div>
                  </div>

                  <div className="wide-input-group">
                    <label>초기 창고 입고량 (개)</label>
                    <input type="number" placeholder="수량 입력..." value={prodStock} onChange={(e) => setProdStock(e.target.value)} required />
                  </div>

                  <div className="wide-input-group full-height-textarea">
                    <label>제품 실루엣 상세 기술서</label>
                    <textarea 
                      placeholder="원단의 드레이프성, 브랜드 가치, 케어 라벨 명세 가이드를 자유롭게 기술해 주세요." 
                      value={prodDesc} 
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={7}
                    />
                  </div>
                </div>
              </form>
            </div>
          );
        }

        return (
          <section className="dashboard-detail-section">
            <div className="section-header-box">
              <h2>상품 리스트 관리 (실시간 DB 연동)</h2>
              <button className="btn-admin-action" onClick={() => setProductViewMode('create')}>+ 신규 상품 등록</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>상품명</th>
                  <th>기본가격</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod.id}>
                    <td>{prod.id}</td>
                    <td className="bold-cell">{prod.name}</td>
                    <td className="price-cell">₩ {(prod.basePrice || prod.price || prod.base_price || 0).toLocaleString()}</td>
                    <td><span className="status-tag done">진열중</span></td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'#555'}}>DB에 등록된 상품이 없습니다.</td></tr>}
              </tbody>
            </table>
          </section>
        );

      case 'orders':
        return (
          <section className="dashboard-detail-section">
            <h2>주문 및 배송 내역 (실시간 DB 연동)</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>주문 번호</th>
                  <th>주문자</th>
                  <th>주문 일자</th>
                  <th>결제 금액</th>
                  <th>배송 상태 변경</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id || order.orderId}>
                    <td>{order.id || order.orderId}</td>
                    <td>{order.customer || order.customerName || '비회원'}</td>
                    <td>{order.date || order.createdAt || '-'}</td>
                    <td className="price-cell">₩ {(order.price || order.totalPrice || 0).toLocaleString()}</td>
                    <td>
                      <select 
                        value={order.status} 
                        className="admin-select" 
                        onChange={(e) => handleOrderStatusChange(order.id || order.orderId, e.target.value)}
                      >
                        <option value="배송준비중">배송준비중</option>
                        <option value="배송중">배송중</option>
                        <option value="배송완료">배송완료</option>
                        <option value="주문취소">주문취소</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', color:'#555'}}>조회할 배송 내역이 없습니다.</td></tr>}
              </tbody>
            </table>
          </section>
        );

      case 'users':
        return (
          <section className="dashboard-detail-section">
            <h2>회원 계정 관리 (실시간 DB 연동)</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>이메일</th>
                  <th>고객성명</th>
                  <th>계정권한</th>
                  <th>가입일자</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.email}>
                    <td>{u.email}</td>
                    <td>{u.name || u.username}</td>
                    <td>
                      <span className={`role-tag ${u.role === 'ADMIN' ? 'admin' : 'user'}`}>{u.role}</span>
                    </td>
                    <td>{u.joinDate || u.createdAt || '-'}</td>
                    <td>
                      <button className="btn-table-sm" onClick={() => handleUserRoleToggle(u.email, u.role)}>권한 전환</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', color:'#555'}}>가입된 가입자 명단이 없습니다.</td></tr>}
              </tbody>
            </table>
          </section>
        );

      case 'marketing':
        return (
          <section className="dashboard-detail-section">
            <h2>뉴스레터 구독자 리스트 (실시간 DB 연동)</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>구독 이메일 주소</th>
                  <th>구독 등록일</th>
                  <th>마케팅 상태</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub, idx) => (
                  <tr key={sub.email || idx}>
                    <td className="bold-cell">{sub.email}</td>
                    <td>{sub.date || sub.createdAt || '-'}</td>
                    <td><span className="status-tag done">구독활성화</span></td>
                  </tr>
                ))}
                {subscribers.length === 0 && <tr><td colSpan={3} style={{textAlign:'center', color:'#555'}}>DB에 수집된 뉴스레터 구독자가 없습니다.</td></tr>}
              </tbody>
            </table>
          </section>
        );

      default:
        return <div>존재하지 않는 구역입니다.</div>;
    }
  };

  return (
    <div className="admin-dashboard-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">La Ligne Homme <span>Backoffice</span></div>
        <nav className="admin-menu">
          <button className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>대시보드 홈</button>
          <button className={`menu-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>상품 관리</button>
          <button className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>주문 / 배송</button>
          <button className={`menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>회원 관리</button>
          <button className={`menu-item ${activeTab === 'marketing' ? 'active' : ''}`} onClick={() => setActiveTab('marketing')}>마케팅 / 뉴스레터</button>
          <div className="menu-divider"></div>
          <button className="menu-item exit-btn" onClick={() => navigate('/')}>일반 메인 홈으로</button>
        </nav>
      </aside>

      <main className="admin-main-content">
        <header className="admin-content-header">
          <div>
            <h1 style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {activeTab === 'dashboard' ? 'Dashboard Overview' : `${activeTab} Management`}
            </h1>
            <p className="subtitle">라 린느 옴므 브랜드 시스템 제어 콘솔입니다.</p>
          </div>
          <div className="admin-profile"><span>최고 관리자 마스터</span></div>
        </header>

        {renderTabContent()}
      </main>
    </div>
  );
};

export default AdminMain;