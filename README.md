# Sector: Vermillion

Игровой сайт по Warhammer 40,000 с React-интерфейсом и отдельным Node.js API на Express.

## Структура

- `frontend/` — React-приложение.
- `backend/` — Express API и серверная игровая логика.

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
