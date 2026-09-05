@echo off
REM Dwuklik na ten plik uruchamia serwer PhotoBeam - bez wpisywania komend.
cd /d "%~dp0"

echo PhotoBeam
echo.

if not exist node_modules (
  echo Pierwsze uruchomienie - instaluje zaleznosci ^(moze to potrwac chwile^)...
  echo.
  call npm install
  echo.
)

call npm start

echo.
pause
