# Architecture

## Overview

봇은 세 가지 핵심 컴포넌트로 구성됩니다:

1. **ActivityMonitor** — Polymarket Data API를 폴링하여 거래 감지
2. **TelegramBot** — 사용자 명령어 처리 및 알림 전송
3. **SQLite Database** — 지갑 목록, 거래 이력, 폴링 커서 저장

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Telegram    │◄────│   TelegramBot    │     │  Polymarket         │
│  Users       │────►│   (grammy)       │     │  Data API           │
└─────────────┘     └──────┬───────────┘     │  /activity          │
                           │                  └────────┬────────────┘
                           │     ┌────────────┐        │
                           │     │   index.ts  │        │
                           │     │  (wiring)   │        │
                           │     └─────┬──────┘        │
                           │           │               │
                    ┌──────▼───────────▼───────────────▼──────┐
                    │            ActivityMonitor                │
                    │  (per-wallet API polling loop)            │
                    └──────────────┬───────────────────────────┘
                                   │
                    ┌──────────────▼──────┐
                    │   SQLite (WAL)      │
                    │  - watched_wallets  │
                    │  - trades           │
                    │  - poll_cursor      │
                    └─────────────────────┘
```

## Data Flow

### 1. 거래 감지 흐름

```
setInterval → 각 watched wallet에 대해:
  → GET /activity?user={address}&type=TRADE&start={lastTimestamp}
  → 새 활동 필터링 (중복 제거)
  → Callback emit
    ├── DB에 거래 기록
    └── 텔레그램 알림 전송
  → poll_cursor 업데이트
```

1. `ActivityMonitor`가 `setInterval`로 주기적으로 실행
2. DB에서 모든 watched wallet 주소를 로드
3. 각 주소에 대해 Polymarket Data API `/activity` 엔드포인트 호출
4. `start` 파라미터로 마지막 폴링 시점 이후의 TRADE만 조회
5. 새 거래를 콜백으로 emit → `index.ts`에서 DB 저장 + 알림 전송
6. `poll_cursor` 테이블에 마지막 timestamp 저장

### 2. 사용자 명령어 흐름

```
User → /watch 0x... label → TelegramBot → Queries.addWallet() → DB
User → /history 10        → TelegramBot → Queries.getTradeHistory() → 포맷 → 응답
```

## Polymarket Data API

### /activity Endpoint

```
GET https://data-api.polymarket.com/activity?user={address}&type=TRADE&start={timestamp}
```

| Parameter | 용도 |
|-----------|------|
| `user` | 조회할 지갑 주소 |
| `type` | `TRADE`만 필터링 |
| `start` | 이 Unix timestamp 이후의 활동만 조회 |
| `sortBy` | `TIMESTAMP` (시간순 정렬) |
| `sortDirection` | `ASC` (오래된 것부터) |
| `limit` | 한 번에 가져올 개수 (최대 500) |

### 응답 필드 (TRADE type)

| Field | 설명 |
|-------|------|
| `transactionHash` | 트랜잭션 해시 |
| `timestamp` | Unix timestamp |
| `side` | `BUY` / `SELL` |
| `size` | 토큰 수량 |
| `usdcSize` | USDC 금액 |
| `price` | 거래 가격 |
| `title` | 마켓 질문 |
| `outcome` | 아웃컴 이름 (Yes/No) |
| `slug` | 마켓 슬러그 |
| `eventSlug` | 이벤트 슬러그 |
| `conditionId` | 마켓 조건 ID |

API가 BUY/SELL, 마켓 메타데이터를 모두 파싱하여 제공하므로, 온체인 이벤트 디코딩이나 별도 마켓 리졸버가 필요하지 않습니다.

## Database Schema

### watched_wallets

| Column | Type | 설명 |
|--------|------|------|
| id | INTEGER PK | 자동 증가 |
| chat_id | TEXT | 텔레그램 채팅 ID |
| address | TEXT | 지갑 주소 (lowercase) |
| label | TEXT | 사용자 지정 라벨 |
| added_at | TEXT | 추가 시각 |

`UNIQUE(chat_id, address)` 제약으로 중복 방지.

### trades

| Column | Type | 설명 |
|--------|------|------|
| id | INTEGER PK | 자동 증가 |
| chat_id | TEXT | 알림 수신 채팅 ID |
| wallet_address | TEXT | 거래 지갑 주소 |
| tx_hash | TEXT | 트랜잭션 해시 |
| timestamp | INTEGER | Unix timestamp |
| side | TEXT | BUY / SELL |
| outcome | TEXT | Yes / No |
| question | TEXT | 마켓 질문 |
| slug | TEXT | 마켓 슬러그 |
| token_amount | REAL | 토큰 수량 |
| usdc_amount | REAL | USDC 금액 |
| price | REAL | 거래 가격 |
| created_at | TEXT | DB 기록 시각 |

### poll_cursor

| Column | Type | 설명 |
|--------|------|------|
| key | TEXT PK | 커서 식별자 (`activity_{address}`) |
| last_timestamp | INTEGER | 마지막 처리 timestamp |

## Error Handling

### Exponential Backoff

API 에러 발생 시 지수 백오프를 적용합니다:

```
2s → 4s → 8s → 16s → 32s → 60s (cap)
```

성공 시 즉시 2s로 리셋됩니다.

### Crash Recovery

- 각 지갑별로 `poll_cursor`에 마지막 처리 timestamp를 저장
- 봇 재시작 시 마지막 시점부터 이어서 조회
- 초기 실행 시 현재 시각부터 시작 (과거 거래 폭주 방지)

### Duplicate Prevention

`isTradeProcessed(txHash, walletAddress)`로 동일 거래를 DB에서 확인하여 중복 알림을 방지합니다.
