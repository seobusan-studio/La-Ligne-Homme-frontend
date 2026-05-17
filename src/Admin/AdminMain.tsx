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

  // 🌟 HTML5 드래그 앤 드롭 순서 변경을 위한 드래그 타겟 인덱스 추적 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 등록 폼 입력 상태 필드
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('아우터');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  // 수정 모드 판별을 위한 수정 대상 상품 PK 기억 필드
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

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

  // 무한 난사 대재앙 차단 인프라 보존
  useEffect(() => {
    loadBackendData();
  }, [activeTab]);

  // 실시간 주문 배송 상태 변경 처리 라우트 (오리지널 보존)
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

  // 실시간 회원 권한 조정 처리 라우트 (오리지널 보존)
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

  // 진열중 ↔ 보관함 실시간 토글 처리 핸들러 (오리지널 보존)
  const handleProductToggle = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}/toggle`, {
        method: 'PATCH'
      });
      if (response.ok) {
        loadBackendData();
      } else {
        alert('진열 상태 스위칭 실패');
      }
    } catch (e) {
      alert('백엔드 서버 연동 실패');
    }
  };

  // 상품 Soft Delete 삭제 처리 핸들러 (오리지널 보존)
  const handleProductDelete = async (id: number) => {
    if (!window.confirm('정말 이 상품을 삭제하시겠습니까? 데이터는 안전하게 보관함 처리(Soft Delete) 됩니다.')) return;
    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('상품이 목록에서 성공적으로 안전 제거되었습니다.');
        loadBackendData();
      } else {
        alert('삭제 프로세스 처리 실패');
      }
    } catch (e) {
      alert('백엔드 서버 통신 실패');
    }
  };

  // 🌟 [교정] 수정 진입 시 단건 썸네일뿐만 아니라 백엔드가 확장해서 넘겨준 '전체 이미지 목록(imageUrls)'을 통째로 복귀 바인딩합니다.
  const handleProductEditStart = (prod: any) => {
    setEditingProductId(prod.id);
    setProdName(prod.name);
    setProdDesc(prod.description || '');
    setProdPrice(String(prod.price || prod.basePrice || prod.base_price || 0));
    setProdStock(String(prod.totalStock || 0));
    
    const catName = Object.keys(CATEGORY_MAP).find(key => CATEGORY_MAP[key] === prod.categoryId) || '아우터';
    setProdCategory(catName);
    
    if (prod.imageUrls && prod.imageUrls.length > 0) {
      const fullUrls = prod.imageUrls.map((url: string) => 
        url.startsWith('http') ? url : `http://localhost:8080${url}`
      );
      setImagePreviews(fullUrls);
    } else if (prod.imageUrl) {
      const fullUrl = prod.imageUrl.startsWith('http') ? prod.imageUrl : `http://localhost:8080${prod.imageUrl}`;
      setImagePreviews([fullUrl]);
    } else {
      setImagePreviews([]);
    }
    setImageFiles([]); 
    setProductViewMode('create');
  };

  // 🌟 [교정] 사진 추가 시 기존 배열을 다 밀어버리는 '덮어쓰기 완료' 버그를 격파하고 차곡차곡 쌓이도록 누적식 엔진으로 개조했습니다.
  const handleMultipleFiles = (files: File[]) => {
    const validImages = files.filter(file => file.type.startsWith('image/'));
    if (validImages.length === 0) return;

    // 새 파일 객체 누적 적재
    setImageFiles(prev => [...prev, ...validImages]);
    
    // 새 파일 블롭 주소 생성 후 기존 미리보기 리스트 뒤에 차례대로 결합
    const newPreviews = validImages.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // 🎯 HTML5 드래그 스타트 이벤트 캡처 (오리지널 보존)
  const onDragStartThumb = (index: number) => {
    setDraggedIndex(index);
  };

  // 🎯 HTML5 드래그 오버 시 프리뷰 배열과 멀티파트 파일 배열 순서를 일치시켜 재정렬하는 핵심 셔플러 (오리지널 보존)
  const onDragOverThumb = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedPreviews = [...imagePreviews];
    const [draggedPreviewItem] = updatedPreviews.splice(draggedIndex, 1);
    updatedPreviews.splice(index, 0, draggedPreviewItem);
    setImagePreviews(updatedPreviews);

    if (imageFiles.length > 0) {
      const updatedFiles = [...imageFiles];
      const [draggedFileItem] = updatedFiles.splice(draggedIndex, 1);
      updatedFiles.splice(index, 0, draggedFileItem);
      setImageFiles(updatedFiles);
    }

    setDraggedIndex(index); 
  };

  const onDragEndThumb = () => {
    setDraggedIndex(null);
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
    imagePreviews.forEach(url => {
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    setImageFiles([]);
    setImagePreviews([]);
    setProdName('');
    setProdPrice('');
    setProdStock('');
    setProdDesc('');
    setEditingProductId(null); 
    setProductViewMode('list');
  };

  // 진짜 스프링부트 백엔드로 다중 멀티파트 데이터 전송
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      alert('상품명과 가격은 필수 기입 항목입니다.');
      return;
    }

    // 🌟 [핵심 교정 추가] 최종 드래그 배치 정렬 완료 후 살아남은 기존 백엔드 정적 파일들의 순서 경로 추출
    const remainingExistingImages = imagePreviews
      .filter(url => !url.startsWith('blob:'))
      .map(url => url.replace('http://localhost:8080', ''));

    const formData = new FormData();
    const productRequestDto = {
      categoryId: CATEGORY_MAP[prodCategory] || 1,
      name: prodName,
      description: prodDesc,
      basePrice: parseInt(prodPrice, 10),
      isVisible: true,
      options: [
        { size: 'FREE', color: '기본', extraPrice: 0, stockQuantity: parseInt(prodStock || '0', 10), isSellable: true }
      ],
      existingImages: remainingExistingImages // 🌟 [핵심] 재배치된 순서값을 DTO 명세에 실어 백엔드로 정밀 토스합니다!
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(productRequestDto)], { type: 'application/json' })
    );

    // 드래그 정렬된 신규 파일 객체 순서 그대로 백엔드로 매핑 전송됩니다.
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      const apiUrl = editingProductId 
        ? `http://localhost:8080/api/products/${editingProductId}`
        : 'http://localhost:8080/api/products';
        
      const response = await fetch(apiUrl, {
        method: editingProductId ? 'PUT' : 'POST',
        headers: editingProductId ? {} : { 'X-Admin-Id': '1' },
        body: formData
      });

      const result = await response.json();
      if (response.ok && result.status !== 'ERROR') {
        alert(editingProductId ? '백엔드 본체 및 DB 상품 정보 수정 갱신 완료!' : '스프링 부트 백엔드 본체 및 DB로 상품 등록 완료!');
        resetRegisterForm();
        loadBackendData();
      } else {
        alert(`처리 실패: ${result.message || '서버 명세 에러'}`);
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
                <h2>{editingProductId ? '컬렉션 상품 정보 수정 편집기' : '새로운 컬렉션 상품 등록'}</h2>
                <div className="wide-header-actions">
                  <button type="button" className="btn-admin-cancel" onClick={resetRegisterForm}>취소하고 돌아가기</button>
                  <button type="button" className="btn-admin-submit" onClick={handleFormSubmit}>
                    {editingProductId ? '정보 수정하기' : '상품 게시하기'}
                  </button>
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
                      {/* 🌟 [교정] 인덱스(idx) 대신 이미지 주소 고유값(url)을 고유 key로 매핑하여 리액트 가상돔의 드래그 정렬 상태를 완벽히 고정 보존합니다. */}
                      {imagePreviews.map((url, idx) => (
                        <div 
                          key={url} 
                          className={`wide-thumb-card ${idx === 0 ? 'main-active' : ''}`}
                          draggable
                          onDragStart={() => onDragStartThumb(idx)}
                          onDragOver={(e) => onDragOverThumb(e, idx)}
                          onDragEnd={onDragEndThumb}
                          style={{ cursor: 'move', userSelect: 'none' }}
                        >
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
                  <th>이미지</th>
                  <th>상품명</th>
                  <th>기본가격</th>
                  <th>창고 총재고</th>
                  <th>진열 상태</th>
                  <th>관리 제어</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod.id}>
                    <td>{prod.id}</td>
                    <td>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        backgroundImage: `url("${prod.imageUrl ? (prod.imageUrl.startsWith('http') ? prod.imageUrl : `http://localhost:8080${prod.imageUrl}`) : '/images/default-product.jpg'}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '6px',
                        border: '1px solid #333'
                      }}></div>
                    </td>
                    <td className="bold-cell">{prod.name}</td>
                    <td className="price-cell">₩ {(prod.basePrice || prod.price || prod.base_price || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 500, color: '#bbb' }}>{prod.totalStock !== undefined ? `${prod.totalStock} 개` : '0 개'}</td>
                    <td>
                      <button 
                        type="button"
                        className={`status-tag ${prod.isVisible !== false ? 'done' : 'refund'}`}
                        onClick={() => handleProductToggle(prod.id)}
                        style={{ border: 'none', cursor: 'pointer', padding: '0.3rem 0.6rem', fontStyle: 'normal' }}
                      >
                        {prod.isVisible !== false ? '진열중' : '보관함'}
                      </button>
                    </td>
                    <td>
                      <button type="button" className="btn-table-sm" onClick={() => handleProductEditStart(prod)} style={{ marginRight: '6px', backgroundColor: '#222', borderColor: '#444' }}>수정</button>
                      <button type="button" className="btn-table-sm" onClick={() => handleProductDelete(prod.id)} style={{ backgroundColor: '#5c1e1e', borderColor: '#7c2e2e', color: '#ffcccc' }}>삭제</button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', color:'#555'}}>DB에 등록된 상품이 없습니다.</td></tr>}
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