# Configuration

## Environment Variables

`.env.example`을 `.env`로 복사한 뒤 필수 값을 입력합니다.

```bash
cp .env.example .env
```

### Required

| 변수 | 예시 | 설명 |
|------|------|------|
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` | [BotFather](https://t.me/BotFather)에서 생성한 봇 토큰 |

### Optional

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `ADMIN_CHAT_ID` | *(empty)* | 관리자 텔레그램 채팅 ID |
| `POLL_INTERVAL_MS` | `10000` | API 폴링 간격 (밀리초, 최소 1000) |
| `DB_PATH` | `./data/bot.db` | SQLite 데이터베이스 파일 경로 |

## Telegram Bot Token 생성

1. Telegram에서 [@BotFather](https://t.me/BotFather)에게 메시지 전송
2. `/newbot` 명령 입력
3. 봇 이름과 사용자명 설정
4. 발급된 토큰을 `TELEGRAM_BOT_TOKEN`에 입력

## Chat ID 확인 방법

1. 봇에게 아무 메시지를 보냄
2. 브라우저에서 `https://api.telegram.org/bot<TOKEN>/getUpdates` 접속
3. 응답의 `result[0].message.chat.id` 값이 Chat ID

또는 [@userinfobot](https://t.me/userinfobot)에게 `/start`를 보내면 바로 확인 가능.

## Polling Interval 조정

`POLL_INTERVAL_MS`는 Polymarket Data API 폴링 주기를 설정합니다.

| 값 | 용도 |
|----|------|
| `5000` (5초) | 빠른 알림이 필요한 경우 (API 요청량 증가) |
| `10000` (10초) | 기본값, 일반적인 사용에 적합 |
| `30000` (30초) | API 요청을 줄이고 싶은 경우 |
| `60000` (1분) | 최소한의 API 사용 |

감시 중인 지갑이 N개면 매 폴링마다 N번의 API 요청이 발생합니다. 많은 지갑을 추적하는 경우 간격을 넓히는 것을 권장합니다.

## Database

SQLite를 사용하며, WAL(Write-Ahead Logging) 모드로 동작합니다.

- DB 파일은 `DB_PATH`에 지정된 경로에 자동 생성됩니다
- 부모 디렉토리가 없으면 자동으로 생성됩니다
- Docker 환경에서는 `/app/data` 볼륨에 마운트하여 영속성을 보장합니다

### DB 파일 구성

```
data/
├── bot.db       # 메인 데이터베이스
├── bot.db-wal   # WAL 파일 (자동 생성)
└── bot.db-shm   # 공유 메모리 파일 (자동 생성)
```

> `-wal`과 `-shm` 파일은 SQLite가 자동으로 관리합니다. DB를 백업할 때는 세 파일 모두 복사하거나, 봇을 중지한 상태에서 `bot.db`만 복사하세요.
