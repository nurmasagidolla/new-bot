# Cloutlab Telegram Bot

Telegram-бот студии разработки Cloutlab: витрина услуг, заявки, уведомления из панели, привязка кабинета, рассылки, API для внутренней панели.

- Сайт: https://cloutlab.studio
- Бот: [@cloutlab_bot](https://t.me/cloutlab_bot)
- Языки: русский, английский

---

## Стек

- **Node.js 22** + **TypeScript** (CommonJS)
- **grammY** — Telegram Bot API
- **SQLite** (`@karinjs/sqlite3` + WAL) — хранение состояния
- **age-encryption** — шифрование заявок (X25519)
- **Docker** + **docker-compose**
- **vitest** + **supertest** — тесты (33 passed)

---

## Запуск (Docker)

### 1. Скопировать `.env` и заполнить

```bash
cp .env.example .env
nano .env