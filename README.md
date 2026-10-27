# Cloutlab Telegram Bot

Telegram-бот студии разработки Cloutlab: витрина услуг, заявки, контакт с клиентами, API для внутренней панели.

- Сайт: https://cloutlab.studio
- Бот: @cloutlab_bot
- Языки: русский, английский

---

## 📦 Стек

- **Node.js 22** + **TypeScript** (CommonJS)
- **grammY** — Telegram Bot API
- **SQLite** (`sqlite3` + WAL) — хранение состояния
- **age-encryption** — шифрование заявок (X25519)
- **undici** — ProxyAgent для Telegram API (опционально)
- **Docker** + **docker-compose**

---

## 🚀 Запуск (Docker, рекомендуется)

### 1. Скопировать `.env` и заполнить

```bash
cp .env.example .env
nano .env