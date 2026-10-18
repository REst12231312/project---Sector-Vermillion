@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js не найден. Установите Node.js 18 или новее и повторите запуск.
    pause
    exit /b 1
)

if not exist "backend\node_modules" (
    echo Не найдены зависимости сервера. Сначала выполните: npm --prefix backend install
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo Не найдены зависимости сайта. Сначала выполните: npm --prefix frontend install
    pause
    exit /b 1
)

start "Sector Vermillion API" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
start "Sector Vermillion сайт" cmd /k "cd /d ""%~dp0frontend"" && npm start"

timeout /t 5 /nobreak >nul
start "" http://localhost:3000

endlocal
