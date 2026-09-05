#!/bin/bash
# Dwuklik na ten plik uruchamia serwer PhotoBeam - bez wpisywania komend.
cd "$(dirname "$0")"

echo "📷 PhotoBeam"
echo ""

if [ ! -d "node_modules" ]; then
  echo "Pierwsze uruchomienie - instaluje zaleznosci (moze to potrwac chwile)..."
  echo ""
  npm install
  echo ""
fi

npm start

echo ""
read -p "Serwer zatrzymany. Nacisnij Enter, aby zamknac to okno..." x
