# Sector: Vermillion

Игровой сайт по Warhammer 40,000 с React-интерфейсом и отдельным Node.js API на Express.

## Структура

- `frontend/` — React-приложение.
- `backend/app.js` и `backend/index.js` — настройка Express и запуск API.
- `backend/routes/` — HTTP-маршруты.
- `backend/services/` — авторизация и игровая бизнес-логика.
- `backend/storage.js` — чтение и запись JSON-хранилища.
- `backend/data/gameData.js` — игровые справочники; `progress.json`, `users.json` и ключ авторизации хранятся отдельно в той же папке и не добавляются в Git.

## Запуск в Windows PowerShell

Установи зависимости один раз:

```powershell
cd frontend
npm install
cd ..\backend
npm install
```

Затем запусти API и сайт в отдельных окнах PowerShell:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm start
```

Интерфейс откроется на `http://localhost:3000`, API — на `http://localhost:4000`. Игровые записи API сохраняет в `backend/data/progress.json`.

При первом открытии создай аккаунт по ссылке регистрации. Имя пользователя должно быть длиной 3–24 символа (латиница, цифры, `_`), пароль — не короче 8 символов. Пароли хранятся в виде хешей; игровые API доступны только с действующим токеном входа. Данные аккаунтов, прогресс и ключ подписи токена находятся в `backend/data/` и не добавляются в Git.
