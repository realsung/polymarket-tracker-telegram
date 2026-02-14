# Polymarket Telegram Alert Bot

Polymarket 지갑 주소를 모니터링하여, 예측 시장 거래(매수/매도) 발생 시 텔레그램으로 실시간 알림을 보내는 봇입니다.

[Polymarket Data API](https://docs.polymarket.com/api-reference/core/get-user-activity)를 사용하여 거래 활동을 폴링합니다.

## Features

- **Polymarket Data API 기반** — `/activity` 엔드포인트로 거래 감지 (RPC 불필요)
- **다중 지갑 추적** — 여러 지갑 주소를 동시에 모니터링
- **자동 마켓 매핑** — API 응답에 마켓 제목, 아웃컴(Yes/No), 가격이 포함
- **텔레그램 알림** — BUY/SELL, 수량, 가격, 마켓 링크가 포함된 상세 알림
- **중복 방지** — tx_hash 기반 중복 알림 방지
- **Crash Recovery** — timestamp 커서를 DB에 저장하여 재시작 시 이어서 처리

## Quick Start

### 사전 준비

- Node.js 22+
- Telegram Bot Token ([BotFather](https://t.me/BotFather)에서 생성)

### 설치

```bash
git clone <repo-url>
cd polymarket-telegram-alert-bot
npm install
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 필수 값을 입력합니다:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_chat_id
POLL_INTERVAL_MS=10000
DB_PATH=./data/bot.db
```

| 변수 | 필수 | 설명 |
|------|------|------|
| `TELEGRAM_BOT_TOKEN` | O | 텔레그램 봇 토큰 |
| `ADMIN_CHAT_ID` | X | 관리자 채팅 ID |
| `POLL_INTERVAL_MS` | X | API 폴링 간격 (기본: 10000ms) |
| `DB_PATH` | X | SQLite DB 파일 경로 (기본: `./data/bot.db`) |

### 실행

```bash
# 개발 모드 (hot reload)
npm run dev

# 프로덕션
npm run build
npm start
```

### Docker

```bash
docker compose up -d
```

## Bot Commands

| 명령어 | 설명 |
|--------|------|
| `/start` | 환영 메시지 및 사용법 |
| `/watch <address> [label]` | 지갑 주소 모니터링 시작 |
| `/unwatch <address>` | 지갑 주소 모니터링 중지 |
| `/list` | 감시 중인 지갑 목록 |
| `/history [count]` | 최근 거래 이력 (기본 10, 최대 50) |
| `/status` | 봇 상태 확인 |

## Alert Example

```
🟢 BOUGHT Yes

📊 Market: "Will Trump win the 2024 election?"
💰 Amount: 1,000.00 shares @ $0.6500
💵 Total: $650.00

👛 Wallet: GCR (0xABC...DEF)

View Market | View Tx
```

## Architecture

자세한 아키텍처 설명은 [docs/architecture.md](docs/architecture.md)를 참고하세요.

```
src/
├── types/index.ts              # 타입 정의 (API 응답, Trade, DB 행)
├── config.ts                   # 환경 변수 로딩
├── db/
│   ├── database.ts             # SQLite 초기화 (WAL, 테이블, 인덱스)
│   └── queries.ts              # Prepared statement 기반 CRUD
├── services/
│   └── activityMonitor.ts      # Polymarket Data API 폴링 루프
├── bot/
│   ├── alertFormatter.ts       # 텔레그램 알림 HTML 포맷터
│   └── telegramBot.ts          # grammy 기반 봇 명령어 핸들러
└── index.ts                    # 진입점 (모든 컴포넌트 연결)
```

## Documentation

- [Architecture](docs/architecture.md) — 시스템 아키텍처 및 데이터 흐름
- [Configuration](docs/configuration.md) — 환경 변수 및 설정 상세
- [Deployment](docs/deployment.md) — Docker 배포 및 운영 가이드

## License

ISC
