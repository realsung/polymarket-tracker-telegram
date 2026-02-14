# Deployment

## Local 실행

### 개발 모드

```bash
npm install
npm run dev
```

`tsx watch`를 사용하여 소스 파일 변경 시 자동으로 재시작됩니다.

### 프로덕션 모드

```bash
npm run build
npm start
```

TypeScript를 JavaScript로 컴파일한 뒤 `node dist/index.js`로 실행합니다.

## Docker

### docker compose (권장)

```bash
# 빌드 및 실행
docker compose up -d

# 로그 확인
docker compose logs -f bot

# 중지
docker compose down

# 재빌드 후 실행
docker compose up -d --build
```

### docker build 직접 실행

```bash
# 이미지 빌드
docker build -t polymarket-bot .

# 컨테이너 실행
docker run -d \
  --name polymarket-bot \
  --restart unless-stopped \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  polymarket-bot
```

### Docker 구성 상세

```dockerfile
# Multi-stage 빌드
FROM node:22-alpine AS builder     # TypeScript 컴파일
FROM node:22-alpine AS production  # 런타임 (dev deps 제외)
```

- `better-sqlite3`는 네이티브 모듈이므로 `python3`, `make`, `g++`가 빌드 시 필요
- 프로덕션 스테이지에서는 빌드 도구를 제거하여 이미지 크기 최소화
- `/app/data` 볼륨으로 SQLite DB를 영속화

## Process Manager (PM2)

Docker를 사용하지 않는 경우 PM2로 프로세스를 관리할 수 있습니다:

```bash
npm install -g pm2

npm run build
pm2 start dist/index.js --name polymarket-bot

# 상태 확인
pm2 status

# 로그 확인
pm2 logs polymarket-bot

# 재시작
pm2 restart polymarket-bot

# 시스템 부팅 시 자동 시작
pm2 startup
pm2 save
```

## Monitoring

### 로그 확인

봇은 stdout으로 주요 이벤트를 로깅합니다:

```
🚀 Starting Polymarket Wallet Tracker Bot...
[ActivityMonitor] Starting polling...
[ActivityMonitor] Initialized cursor for 0xABCDEF... at 1707900000
[ActivityMonitor] Found 3 activities for 0xABCDEF...
[TelegramBot] Bot is running
✅ Bot is fully operational
```

### Health Check

텔레그램에서 `/status` 명령으로 봇 상태를 확인할 수 있습니다:
- 감시 중인 지갑 수
- 봇 동작 상태

### Crash Recovery

봇이 비정상 종료되더라도:
1. `poll_cursor` 테이블에 지갑별 마지막 처리 timestamp가 저장되어 있으므로 누락 없이 이어서 처리
2. `docker compose`의 `restart: unless-stopped`로 자동 재시작

## DB Backup

```bash
# 봇 실행 중 백업 (WAL 파일 포함)
cp data/bot.db data/bot.db-wal data/bot.db-shm backup/

# 또는 봇 중지 후 안전하게 백업
docker compose down
cp data/bot.db backup/
docker compose up -d
```

## Security Considerations

- `.env` 파일에 봇 토큰이 포함되므로 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함됨)
- 공개 그룹에서 봇을 사용할 경우, 지갑 주소가 다른 사용자에게 노출될 수 있습니다
