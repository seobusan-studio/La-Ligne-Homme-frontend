import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminMain.css';

// 💡 [기존 코드 사수 및 오타 완벽 교정 완료]
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

  // 백엔드 DB에서 실시간으로 긁어올 동적 카테고리 저장소
  const [categories, setCategories] = useState<any[]>([]);
  // 관리자가 카테고리를 실시간 신설/제거하기 위한 어드민 인풋 필드
  const [newCatName, setNewCatName] = useState('');
  const [newCatOrder, setNewCatOrder] = useState('1');

  // 어드민 상품 리스트 제어용 실시간 서칭 키워드 및 카테고리 필터값
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<number | 'all'>('all');

  // 첫 줄이 FREE로 오염되는 것을 방지하기 위해 빈 문자열("")로 담백하게 스타트합니다.
  const [optionsList, setOptionsList] = useState<any[]>([
    { size: '', color: '기본', extraPrice: 0, stockQuantity: 0 }
  ]);

  // 상품 탭 내부 뷰포트 전환 제어 상태
  const [productViewMode, setProductViewMode] = useState<'list' | 'create'>('list');
  
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setMidnightPreviews] = useState<string[]>([]); // 이름 가이드는 원형 사수

  // HTML5 드래그 앤 드롭 순서 변경을 위한 드래그 타겟 인덱스 추적 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 주문 / 배송 내역 전용 페이지네이션 상태 제어 엔진 (15개 한정 규격 사수)
  const [orderCurrentPage, setOrderCurrentPage] = useState<number>(1);
  const ORDERS_PER_PAGE = 15;

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
    dailySales: {}
  });

  // 현재 어떤 주문 번호의 상세 내역이 펼쳐져 있는지 기억하는 상태창
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // 상세 목록 내부 인풋 필드 제어용 실시간 운송장 데이터 상태창
  const [courierNameInput, setCourierNameInput] = useState<string>('');
  const [trackingNumberInput, setTrackingNumberInput] = useState<string>('');

  // 복수의 주문 알림 패킷을 유실 없이 적체 보관하기 위한 배열형 상태창
  const [notifications, setNotifications] = useState<any[]>([]);

  // 중복 알림 및 X버튼 먹통 방멸용 정밀 가드 레프
  const knownOrderIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);

  // 백엔드 전역 데이터 싱크로나이저 엔진
  const loadBackendData = async () => {
    try {
      const resCat = await fetch('http://localhost:8080/api/categories');
      const resultCat = await resCat.json();
      if (resultCat.data) {
        setCategories(resultCat.data);
        if (resultCat.data.length > 0 && !prodName) {
          setProdCategory(resultCat.data[0].name);
        }
      }
    } catch (e) { console.log('동적 카테고리 원장 통신 대기 중...'); }

    try {
      const response = await fetch('http://localhost:8080/api/order/admin/settlement');
      
      // 🌟 [강력한 가드] 상태 코드가 403(권한없음)인 경우를 별도로 잡아냅니다.
      if (response.status === 403) {
        console.error("🚨 403 에러 발생: 관리자 권한이 없습니다. 서버의 인터셉터를 확인하십시오.");
        return; // 여기서 멈추고 서버의 '권한 체크 로직'을 의심해야 합니다.
      }

      const resultStats = await response.json();
      
      if (resultStats && resultStats.data) {
        setStats({
          totalSales: resultStats.data.totalSales ?? 0,
          totalRefund: resultStats.data.totalRefund ?? 0,
          netProfit: (resultStats.data.totalSales ?? 0) - (resultStats.data.totalRefund ?? 0),
          orderCount: resultStats.data.orderCount ?? 0,
          dailySales: resultStats.data.dailySales ?? {}
        });
        console.log("✅ 정산 데이터 로드 성공:", resultStats.data);
      }
    } catch (e) { 
      console.log('❌ 정산 통계 API 호출 실패 (서버 주소나 CORS 문제 확인):', e); 
    }

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
      const resOrders = await fetch('http://localhost:8080/api/admin/orders/list');
      const resultOrders = await resOrders.json();
      
      if (resultOrders && resultOrders.data) {
        const incomingOrders = resultOrders.data;
        
        if (isFirstLoadRef.current) {
          const initialIds = incomingOrders.map((o: any) => Number(o.id || o.orderId));
          knownOrderIdsRef.current = new Set(initialIds);
          setOrders(incomingOrders);
          isFirstLoadRef.current = false;
        } else {
          const newAlertCards: any[] = [];
          
          incomingOrders.forEach((ord: any) => {
            const currentId = Number(ord.id || ord.orderId);
            
            if (!knownOrderIdsRef.current.has(currentId)) {
              knownOrderIdsRef.current.add(currentId);
              
              const uniqueKeyId = `alert_${currentId}_${Date.now()}_${Math.random()}`;
              
              newAlertCards.push({
                id: currentId,
                keyId: uniqueKeyId,
                message: `📦 NEW ORDER ARRIVED!\n새로운 주문이 실시간 수주되었습니다.\n• 주문 번호: No.${currentId}\n• 주문자: ${ord.customer || ord.customerName || '비회원'}\n• 결제 금액: ₩${Number(ord.price || ord.totalPrice || 0).toLocaleString()}`
              });
            }
          });

          if (newAlertCards.length > 0) {
            setNotifications(prevAlerts => [...prevAlerts, ...newAlertCards]);
          }
          setOrders(incomingOrders);
        }
      }
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

  useEffect(() => {
    console.log("⚡ [디버그] loadBackendData 호출 시도!");
    loadBackendData();

    const dynamicScheduler = setInterval(() => {
      loadBackendData();
    }, 3000);

    return () => clearInterval(dynamicScheduler);
  }, []);

  const handleCreateCategory = async () => {
    if (!newCatName) return alert('카테고리 이름을 명시해 주십시오.');
    try {
      const response = await fetch('http://localhost:8080/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, sortOrder: parseInt(newCatOrder || '1', 10) })
      });
      if (response.ok) {
        alert(`[${newCatName}] 카테고리가 실시간으로 추가 개통되었습니다.`);
        setNewCatName('');
        loadBackendData();
      }
    } catch (e) { alert('카테고리 생성 백엔드 통신 실패'); }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`[${name}] 카테고리를 정말 폐쇄하시겠습니까? 관련 상품 매핑에 주의하십시오.`)) return;
    try {
      const response = await fetch(`http://localhost:8080/api/categories/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('카테고리가 시스템 데이터베이스에서 안전하게 제거되었습니다.');
        loadBackendData();
      }
    } catch (e) { alert('카테고리 삭제 백엔드 통신 실패'); }
  };

  const handleAddOptionRow = () => {
    setOptionsList(prev => [...prev, { size: '', color: '기본', extraPrice: 0, stockQuantity: 0 }]);
  };

  const handleRemoveOptionRow = (index: number) => {
    setOptionsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    setOptionsList(prev => prev.map((opt, i) => i === index ? { ...opt, [field]: value } : opt));
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        alert(`주문 번호 [${orderId}]의 상태가 [${newStatus}](으)로 변경 완료되었습니다.`);
        loadBackendData();
      } else {
        alert('배송 상태 업데이트 실패');
      }
    } catch (err) {
      alert('백엔드 상태 변경 API 서버가 꺼져있습니다.');
    }
  };

  const handleSaveTracking = async (orderId: number, currentStatus: string) => {
    if (!courierNameInput.trim() || !trackingNumberInput.trim()) {
      alert("배송 처리를 위해 택배사 선택과 운송장 번호를 정확히 기입해 주십시오.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentStatus,
          courierName: courierNameInput.trim(),
          trackingNumber: trackingNumberInput.trim()
        })
      });
      if (response.ok) {
        alert(`주문 번호 [${orderId}]의 운송장 정보가 데이터베이스 원장에 안전하게 영속화되었습니다.`);
        loadBackendData();
      } else {
        alert('운송장 정보 저장 실패');
      }
    } catch (err) {
      alert('백엔드 통신 실패 또는 API 서버 확인 요망');
    }
  };

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

  const handleProductEditStart = async (prod: any) => {
    try {
      const res = await fetch(`http://localhost:8080/api/products/${prod.id}`);
      const result = await res.json();
      const fullProd = result.data || prod; 

      setEditingProductId(fullProd.id);
      setProdName(fullProd.name);
      setProdDesc(fullProd.description || '');
      setProdPrice(String(fullProd.price || fullProd.basePrice || fullProd.base_price || 0));
      
      const targetCat = categories.find(c => c.id === fullProd.categoryId || c.id === fullProd.category_id);
      setProdCategory(targetCat ? targetCat.name : '아우터');
      
      const backendOptions = fullProd.options || fullProd.productOptions;
      if (backendOptions && backendOptions.length > 0) {
        setOptionsList(backendOptions.map((opt: any) => ({
          size: opt.size,
          color: opt.color || '기본',
          extraPrice: opt.extraPrice || 0,
          stockQuantity: opt.stockQuantity || 0
        })));
      } else {
        setOptionsList([{ size: '', color: '기본', extraPrice: 0, stockQuantity: fullProd.totalStock || 0 }]);
      }
      
      if (fullProd.imageUrls && fullProd.imageUrls.length > 0) {
        const fullUrls = fullProd.imageUrls.map((url: string) => 
          url.startsWith('http') ? url : `http://localhost:8080${url}`
        );
        setMidnightPreviews(fullUrls);
      } else if (fullProd.imageUrl) {
        const fullUrl = fullProd.imageUrl.startsWith('http') ? fullProd.imageUrl : `http://localhost:8080${fullProd.imageUrl}`;
        setMidnightPreviews([fullUrl]);
      } else {
        setMidnightPreviews([]);
      }
      setImageFiles([]); 
      setProductViewMode('create');
    } catch (err) {
      alert('상품 상세 정보를 백엔드에서 가져오는데 실패했습니다.');
    }
  };

  const handleMultipleFiles = (files: File[]) => {
    const validImages = files.filter(file => file.type.startsWith('image/'));
    if (validImages.length === 0) return;

    const newPreviews = validImages.map(file => {
      const blobUrl = URL.createObjectURL(file);
      (file as any).blobUrl = blobUrl; 
      return blobUrl;
    });

    setImageFiles(prev => [...prev, ...validImages]);
    setMidnightPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleDeleteImage = (indexToKill: number, urlToKill: string) => {
    if (urlToKill.startsWith('blob:')) {
      URL.revokeObjectURL(urlToKill);
      setImageFiles(prev => prev.filter((file: any) => file.blobUrl !== urlToKill));
    }
    setMidnightPreviews(prev => prev.filter((_, i) => i !== indexToKill));
  };

  const onDragStartThumb = (index: number) => {
    setDraggedIndex(index);
  };

  const onDragOverThumb = (e: React.DragEvent, index: number) => {
    e.preventDefault(); 
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedPreviews = [...imagePreviews];
    const [draggedPreviewItem] = updatedPreviews.splice(draggedIndex, 1);
    updatedPreviews.splice(index, 0, draggedPreviewItem);
    setMidnightPreviews(updatedPreviews);

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
    setMidnightPreviews([]);
    setProdName('');
    setProdPrice('');
    setProdStock('');
    setProdStock(''); 
    setProdDesc('');
    setOptionsList([{ size: '', color: '기본', extraPrice: 0, stockQuantity: 0 }]);
    setEditingProductId(null); 
    setProductViewMode('list');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      alert('상품명 및 가격은 필수 기입 항목입니다.');
      return;
    }

    if (optionsList.length === 0 || optionsList.some(opt => !opt.size || !opt.size.trim())) {
      alert('모든 옵션 행의 규격명(사이즈)을 정확히 기입해 주십시오.');
      return;
    }

    const remainingExistingImages = imagePreviews
      .filter(url => !url.startsWith('blob:'))
      .map(url => url.replace('http://localhost:8080', ''));

    const matchedCategory = categories.find(c => c.name === prodCategory);
    const targetCategoryId = matchedCategory ? matchedCategory.id : (categories[0]?.id || 1);

    const formData = new FormData();
    const productRequestDto = {
      categoryId: targetCategoryId, 
      name: prodName,
      description: prodDesc,
      basePrice: parseInt(prodPrice, 10),
      isVisible: true,
      options: optionsList.map(opt => ({
        size: opt.size.trim(),
        color: opt.color || '기본',
        extraPrice: parseInt(String(opt.extraPrice || 0), 10),
        stockQuantity: parseInt(String(opt.stockQuantity || 0), 10),
        isSellable: true
      })),
      existingImages: remainingExistingImages 
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(productRequestDto)], { type: 'application/json' })
    );

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
        alert(`처리 실패: ${result.message || '서ver 명세 에러'}`);
      }
    } catch (err) {
      alert('서ver 에러가 포착되었습니다.');
    }
  };

  const toggleOrderDetails = (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      const targetOrder = orders.find(o => (o.id || o.orderId) === orderId);
      setCourierNameInput(targetOrder?.courierName || '');
      setTrackingNumberInput(targetOrder?.trackingNumber || '');
      setExpandedOrderId(orderId);
    }
  };

  const handleDismissNotification = (keyIdToKill: string) => {
    setNotifications(prev => prev.filter(item => item.keyId !== keyIdToKill));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <section className="stats-grid">
              <div className="stats-card">
                <h3>총 매출액</h3>
                <p className="card-value">₩ {(stats.totalSales ?? 0).toLocaleString()}</p>
                <span className="card-badge sales">결제 완료 기준</span>
              </div>
              <div className="stats-card">
                <h3>총 환불액</h3>
                <p className="card-value refund">₩ {(stats.totalRefund ?? 0).toLocaleString()}</p>
                <span className="card-badge refund">취소 완료 기준</span>
              </div>
              <div className="stats-card Highlands">
                <h3>당기 순이익</h3>
                <p className="card-value profit">₩ {(stats.netProfit ?? 0).toLocaleString()}</p>
                <span className="card-badge profit">매출 - 환불</span>
              </div>
              <div className="stats-card">
                <h3>주문 건수</h3>
                <p className="card-value">{stats.orderCount ?? 0} 건</p>
                <span className="card-badge count">실결제 기준</span>
              </div>
            </section>

            <section className="dashboard-detail-section">
              <h2>최근 주문 동향</h2>
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
                  {[...orders].sort((a, b) => Number(b.id || b.orderId) - Number(a.id || a.orderId)).slice(0, 5).map(order => (
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
                      {imagePreviews.map((url, idx) => (
                        <div 
                          key={url} 
                          className={`wide-thumb-card ${idx === 0 ? 'main-active' : ''}`}
                          draggable
                          onDragStart={() => onDragStartThumb(idx)}
                          onDragOver={(e) => onDragOverThumb(e, idx)}
                          onDragEnd={onDragEndThumb}
                          style={{ cursor: 'move', userSelect: 'none', position: 'relative' }}
                        >
                          <img src={url} alt={`슬라이드 ${idx}`} />
                          <span className="thumb-idx-indicator">{idx === 0 ? '대표' : `${idx + 1}`}</span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); 
                              handleDeleteImage(idx, url);
                            }}
                            className="thumb-delete-btn"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(20, 20, 20, 0.85)',
                              color: '#ffcccc',
                              border: '1px solid #444',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              zIndex: 10,
                              transition: 'all 0.2s'
                            }}
                            title="사진 제외하기"
                          >
                            &times;
                          </button>
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
                      <label>카테고리 분류 (실시간 DB 동기화)</label>
                      <select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="wide-input-group">
                      <label>기본 판매가 (₩)</label>
                      <input type="number" placeholder="단가 입력..." value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                    </div>
                  </div>

                  <div className="wide-input-group" style={{ border: '1px solid #333', padding: '15px', borderRadius: '6px', background: '#111' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ margin: 0, fontWeight: '600', color: '#fff' }}>상품 세부 규격 및 입고 재고 옵션 설정</label>
                      <button type="button" onClick={handleAddOptionRow} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>+ 규격 추가</button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', padding: '0 2px', fontSize: '11px', fontWeight: '600', color: '#888', letterSpacing: '0.05em' }}>
                      <span style={{ flex: 2 }}>사이즈</span>
                      <span style={{ flex: 1.5 }}>색상</span>
                      <span style={{ flex: 1.2 }}>추가금</span>
                      <span style={{ flex: 1.2 }}>수량</span>
                      {optionsList.length > 1 && <span style={{ width: '50px' }}></span>}
                    </div>

                    {optionsList.map((opt, index) => (
                      <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <input type="text" placeholder="사이즈명 (예: M, L, 260)" value={opt.size} onChange={(e) => handleOptionChange(index, 'size', e.target.value)} style={{ flex: 2, background: '#222', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px' }} required />
                        <input type="text" placeholder="색상 명세" value={opt.color} onChange={(e) => handleOptionChange(index, 'color', e.target.value)} style={{ flex: 1.5, background: '#222', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px' }} />
                        <input type="number" placeholder="추가금" value={opt.extraPrice} onChange={(e) => handleOptionChange(index, 'extraPrice', e.target.value)} style={{ flex: 1.2, background: '#222', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px' }} />
                        <input type="number" placeholder="재고량" value={opt.stockQuantity} onChange={(e) => handleOptionChange(index, 'stockQuantity', e.target.value)} style={{ flex: 1.2, background: '#222', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px' }} required />
                        {optionsList.length > 1 && (
                          <button type="button" onClick={() => handleRemoveOptionRow(index)} style={{ background: '#5c1e1e', color: '#ffcccc', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>삭제</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="wide-input-group full-height-textarea">
                    <label>제품 실루엣 상세 기술서</label>
                    <textarea 
                      placeholder="원단의 드레이프성, 브랜드 가치, 케어 라벨 명세 가이드를 자유롭게 기술해 주세요." 
                      value={prodDesc} 
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={5}
                    />
                  </div>
                </div>
              </form>
            </div>
          );
        }

        const filteredProducts = products.filter(prod => {
          if (filterCategoryId !== 'all') {
            const prodCatId = prod.categoryId || prod.category_id;
            if (prodCatId !== filterCategoryId) return false;
          }
          if (searchKeyword.trim() !== '') {
            if (!prod.name.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
          }
          return true;
        });

        return (
          <section className="dashboard-detail-section">
            <div className="category-admin-board" style={{ background: '#141414', padding: '18px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #262626' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', letterSpacing: '0.03em', color: '#fff', textTransform: 'uppercase' }}>🔧 실시간 동적 카테고리 제어 보드</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                <input type="text" placeholder="새 카테고리명 (예: 신발, 모자)" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} style={{ background: '#222', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', width: '220px' }} />
                <input type="number" placeholder="전시 순서 (숫)" value={newCatOrder} onChange={(e) => setNewCatOrder(e.target.value)} style={{ background: '#222', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', width: '110px' }} />
                <button type="button" onClick={handleCreateCategory} style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}>+ 실시간 개통</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {categories.map((cat: any) => (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#222', padding: '4px 10px', borderRadius: '20px', border: '1px solid #333', fontSize: '13px' }}>
                    <span style={{ color: '#bbb' }}>[{cat.sortOrder}]</span>
                    <span style={{ fontWeight: '500', color: '#fff' }}>{cat.name}</span>
                    <button type="button" onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0 2px', fontWeight: 'bold' }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-header-box">
              <h2>상품 리스트 관리</h2>
              <button className="btn-admin-action" onClick={() => setProductViewMode('create')}>+ 신규 상품 등록</button>
            </div>

            <div className="admin-filter-bar" style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
              <select 
                value={filterCategoryId} 
                onChange={(e) => setFilterCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
              >
                <option value="all">전체 카테고리</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <input 
                type="text" 
                placeholder="🔍 등록된 상품명으로 실시간 서칭..." 
                value={searchKeyword} 
                onChange={(e) => setSearchKeyword(e.target.value)} 
                style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '10px 14px', borderRadius: '6px', width: '280px', fontSize: '13px' }}
              />

              {searchKeyword || filterCategoryId !== 'all' ? (
                <button 
                  type="button" 
                  onClick={() => { setSearchKeyword(''); setFilterCategoryId('all'); }} 
                  style={{ background: '#222', color: '#bbb', border: '1px solid #333', padding: '9px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  필터 조건 초기화
                </button>
              ) : null}
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
                {filteredProducts.map(prod => (
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
                {filteredProducts.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', color:'#555'}}>검색 결과 및 필터 조건에 부합하는 상품이 존재하지 않습니다.</td></tr>}
              </tbody>
            </table>
          </section>
        );

      case 'orders':
        const sortedOrders = [...orders].sort((a, b) => Number(b.id || b.orderId) - Number(a.id || a.orderId));
        const totalOrderPages = Math.ceil(sortedOrders.length / ORDERS_PER_PAGE);
        const indexOfLastOrder = orderCurrentPage * ORDERS_PER_PAGE;
        const indexOfFirstOrder = indexOfLastOrder - ORDERS_PER_PAGE;
        const currentOrdersSlice = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder);

        return (
          <section className="dashboard-detail-section">
            <h2>주문 및 배송 내역</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>주문 번호</th>
                  <th>주문자</th>
                  <th>주문 일자</th>
                  <th>결제 금액</th>
                  <th>배송 상태 변경</th>
                  <th>상세 목록</th> 
                </tr>
              </thead>
              <tbody>
                {currentOrdersSlice.map(order => {
                  const oId = order.id || order.orderId;
                  const isExpanded = expandedOrderId === oId;

                  return (
                    <React.Fragment key={oId}>
                      <tr>
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
                            <option value="주문접수">주문접수</option>
                            <option value="결제완료">결제완료</option>
                            <option value="배송준비중">배송준비중</option>
                            <option value="배송중">배송중</option>
                            <option value="배송완료">배송완료</option>
                            <option value="주문취소">주문취소</option>
                          </select>
                        </td>
                        <td>
                          <button 
                            type="button" 
                            className="btn-table-sm" 
                            onClick={() => toggleOrderDetails(oId)}
                            style={{ backgroundColor: isExpanded ? '#444' : '#222', borderColor: '#555', color: '#fff' }}
                          >
                            {isExpanded ? '닫기' : '상세보기'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ backgroundColor: '#111111', padding: '20px', border: '1px solid #222' }}>
                            <div style={{ textAlign: 'left' }}>
                              
                              {/* 🌟 [교정완결구역 - 텍배사 이름 직접 입력 인풋을 정석 셀렉트 드롭다운 박스로 완전 대체] */}
                              <div style={{
                                marginBottom: '20px',
                                padding: '14px',
                                backgroundColor: '#161616',
                                border: '1px solid #333',
                                borderRadius: '4px'
                              }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#8f8576', letterSpacing: '0.03em' }}>
                                  📦 DELIVERY TRACKING INPUT (운송장 정보 직접 입력)
                                </h4>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                    <label style={{ fontSize: '11px', color: '#888' }}>택배사 이름</label>
                                    <select 
                                      value={courierNameInput}
                                      onChange={(e) => setCourierNameInput(e.target.value)}
                                      style={{ 
                                        background: '#222', 
                                        border: '1px solid #444', 
                                        color: '#fff', 
                                        padding: '8px', 
                                        borderRadius: '4px', 
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        height: '35px'
                                      }}
                                    >
                                      <option value="">-- 국내 배송 택배사 선택 --</option>
                                      <option value="우체국택배">우체국택배</option>
                                      <option value="CJ대한통운">CJ대한통운</option>
                                      <option value="한진택배">한진택배</option>
                                      <option value="로젠택배">로젠택배</option>
                                      <option value="롯데택배">롯데택배</option>
                                    </select>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                    <label style={{ fontSize: '11px', color: '#888' }}>운송장 번호</label>
                                    <input 
                                      type="text" 
                                      placeholder="숫자만 입력" 
                                      value={trackingNumberInput}
                                      onChange={(e) => setTrackingNumberInput(e.target.value)}
                                      style={{ background: '#222', border: '1px solid #444', color: '#fff', padding: '8px', borderRadius: '4px', fontSize: '12px', height: '17px' }}
                                    />
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => handleSaveTracking(oId, order.status)}
                                    style={{
                                      alignSelf: 'flex-end',
                                      background: '#8f8576',
                                      color: '#000',
                                      border: 'none',
                                      padding: '9px 20px',
                                      borderRadius: '4px',
                                      fontWeight: '600',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      height: '35px'
                                    }}
                                  >
                                    저장
                                  </button>
                                </div>
                              </div>

                              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#8f8576', letterSpacing: '0.03em' }}>
                                🚚 SHIPPING ADDRESS INFO (고객 배송 명세서)
                              </h4>
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                                gap: '10px', 
                                marginBottom: '20px', 
                                padding: '14px', 
                                backgroundColor: '#161616', 
                                border: '1px solid #222',
                                fontSize: '12px',
                                color: '#eee'
                              }}>
                                <div><strong style={{ color: '#888' }}>수령인 연락처 :</strong> {order.receiverPhone || '-'}</div>
                                <div><strong style={{ color: '#888' }}>배송지 상세주소 :</strong> {order.deliveryAddress || '-'}</div>
                                <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#888' }}>배송 요청사항 :</strong> {order.deliveryMemo || '없음'}</div>
                              </div>

                              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#8f8576', letterSpacing: '0.03em' }}>
                                📦 ORDER ITEMS DETAIL (주문서 상세 내역)
                              </h4>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '5px' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #262626', color: '#888' }}>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>상품명</th>
                                    <th style={{ textAlign: 'center', padding: '8px', width: '150px' }}>옵션 (사이즈/색상)</th>
                                    <th style={{ textAlign: 'center', padding: '8px', width: '80px' }}>수량</th>
                                    <th style={{ textAlign: 'right', padding: '8px', width: '120px' }}>단가</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items && order.items.map((item: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #1a1a1a', color: '#ccc' }}>
                                      <td style={{ padding: '8px', textAlign: 'left', fontWeight: '500' }}>{item.productName}</td>
                                      <td style={{ padding: '8px', textAlign: 'center', color: '#aaa' }}>{item.size} / {item.color || '기본'}</td>
                                      <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity} 개</td>
                                      <td style={{ padding: '8px', textAlign: 'right', color: '#fff' }}>₩ {Number(item.price).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                  {(!order.items || order.items.length === 0) && (
                                    <tr>
                                      <td colSpan={4} style={{ textAlign: 'center', padding: '12px', color: '#555' }}>
                                        수집된 주문 상세 상품 내역 패킷이 존재하지 않습니다.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {orders.length === 0 && <tr><td colSpan={6} style={{textAlign:'center', color:'#555'}}>조회할 배송 내역이 없습니다.</td></tr>}
              </tbody>
            </table>

            {/* 백오피스 테마와 조화를 이루는 미니멀 페이지네이션 컨트롤 바 렌더링 구역 사수 */}
            {totalOrderPages > 1 && (
              <div className="admin-pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '24px' }}>
                <button
                  type="button"
                  disabled={orderCurrentPage === 1}
                  onClick={() => setOrderCurrentPage(prev => Math.max(prev - 1, 1))}
                  style={{
                    padding: '8px 14px',
                    background: '#111',
                    color: orderCurrentPage === 1 ? '#444' : '#8f8576',
                    border: '1px solid #222',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: orderCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  PREV
                </button>
                {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setOrderCurrentPage(pageNum)}
                    style={{
                      padding: '8px 14px',
                      background: orderCurrentPage === pageNum ? '#8f8576' : '#111',
                      color: orderCurrentPage === pageNum ? '#000' : '#fff',
                      border: '1px solid #222',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={orderCurrentPage === totalOrderPages}
                  onClick={() => setOrderCurrentPage(prev => Math.min(prev + 1, totalOrderPages))}
                  style={{
                    padding: '8px 14px',
                    background: '#111',
                    color: orderCurrentPage === totalOrderPages ? '#444' : '#8f8576',
                    border: '1px solid #222',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: orderCurrentPage === totalOrderPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  NEXT
                </button>
              </div>
            )}
          </section>
        );

      case 'users':
        return (
          <section className="dashboard-detail-section">
            <h2>회원 계정 관리</h2>
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

      case 'sales':
        return (
          <section className="dashboard-detail-section">
            <h2>매출 정산 관리</h2>
            <div className="stats-grid" style={{ marginBottom: '30px' }}>
              <div className="stats-card">
                <h3>총 매출액</h3>
                <p className="card-value">₩ {(stats.totalSales ?? 0).toLocaleString()}</p>
              </div>
              <div className="stats-card">
                <h3>총 환불액</h3>
                <p className="card-value refund">₩ {(stats.totalRefund ?? 0).toLocaleString()}</p>
              </div>
              <div className="stats-card">
                <h3>당기 순이익</h3>
                <p className="card-value profit">₩ {(stats.netProfit ?? 0).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="admin-table-box" style={{ background: '#111', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{ color: '#fff', fontSize: '15px', marginBottom: '15px' }}>일별 매출 현황</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>매출액</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.dailySales || {}).sort((a,b) => b[0].localeCompare(a[0])).map(([date, amount]) => (
                    <tr key={date}>
                      <td>{date}</td>
                      <td className="price-cell">₩ {Number(amount).toLocaleString()}</td>
                    </tr>
                  ))}
                  {Object.keys(stats.dailySales || {}).length === 0 && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', color: '#555' }}>데이터가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'marketing':
        return (
          <section className="dashboard-detail-section">
            <h2>뉴스레터 구독자 리스트</h2>
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
      
      {/* 실시간 누적 적체형 알림 판넬 트랙 */}
      <div style={{
        position: 'fixed',
        top: '25px',
        right: '25px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 99999,
        maxHeight: '85vh',
        overflowY: 'auto',
        pointerEvents: 'none' 
      }}>
        {notifications.map(item => (
          <div 
            key={item.keyId} 
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
              padding: '18px 24px',
              border: '1px solid #8f8576',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              width: '360px',
              borderRadius: '0px',
              pointerEvents: 'auto', 
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ whiteSpace: 'pre-line', fontSize: '13px', lineHeight: '1.6', letterSpacing: '0.02em' }}>
                {item.message}
              </div>
              <button 
                type="button" 
                onClick={() => handleDismissNotification(item.keyId)} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8f8576',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  padding: '0 0 0 12px',
                  lineHeight: '1'
                }}
                title="확인 후 알림 닫기"
              >
                &times;
              </button>
            </div>
            <div style={{ marginTop: '12px', height: '2px', backgroundColor: '#8f8576', width: '100%' }} />
          </div>
        ))}
      </div>

      <aside className="admin-sidebar">
        <div className="admin-logo">La Ligne Homme <span>Backoffice</span></div>
        <nav className="admin-menu">
          <button className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>대시보드 홈</button>
          <button className={`menu-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>상품 관리</button>
          <button className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => { setActiveTab('orders'); setOrderCurrentPage(1); }}>주문 / 배송</button>
          <button className={`menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>회원 관리</button>
          <button className={`menu-item ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>매출 관리</button>
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
            <p className="subtitle">라 린느 옴므 브랜드 system 제어 콘솔입니다.</p>
          </div>
          <div className="admin-profile"><span>최고 관리자 마스터</span></div>
        </header>

        {renderTabContent()}
      </main>
    </div>
  );
};

export default AdminMain;