# 긴급 보안 수정 배포 안내

이 변경은 백엔드 `codex/security-critical-fixes` 변경과 함께 배포해야 합니다.

- 로그인 응답의 `accessToken`, `expiresAt`를 보관하고 모든 API 호출에 공통 인증 처리를 적용합니다.
- 예전 버전의 서명 없는 로그인 정보는 시작 시 제거합니다. 배포 후 모든 기존 사용자는 다시 로그인해야 합니다.
- 관리자 화면은 서버 프로필이 ADMIN인 경우에만 표시합니다. 실제 권한 검사는 백엔드가 수행합니다.
- 마이페이지는 `GET /api/orders/me`, 취소는 `POST /api/orders/{id}/cancel-request`를 사용합니다.
- 일반 주문 API는 무통장입금만 허용합니다. 응답은 `data: {orderId, orderNumber, amount, status}`입니다.
- 프론트 환경변수 `VITE_API_URL`을 새 백엔드의 HTTPS 주소로 설정합니다. 백엔드 서명 비밀값 `JWT_SECRET`은 프론트에 넣지 않습니다.
- 인증 만료/변경 후에는 재로그인이 필요합니다. 결제 요청을 자동 재시도하지 않습니다.

검증 명령:

```text
npm run test:security
npm run build
```

인증 요청 테스트 9개와 TypeScript/Vite 빌드 통과. 모의 API를 사용한 로컬 브라우저에서 로그인, 본인 주문 조회, 조작된 저장소 권한의 관리자 화면 진입 차단을 확인했습니다. 실제 결제와 운영 API 호출은 하지 않았습니다.

토큰은 기존 로그인 유지 선택에 따라 localStorage 또는 sessionStorage에 저장됩니다. 브라우저 로그아웃은 저장값을 삭제하며, 서버의 개별 토큰 폐기/자동 갱신은 이번 변경에 포함되지 않습니다. 최대 유효시간은 백엔드 설정(기본 24시간)이며 비밀번호 변경 시 이전 토큰은 무효화됩니다.
