# Lazania 📷 – zdjecia z telefonu na komputer przez WiFi

Prosta aplikacja: telefon (dowolny – dziala jako strona/PWA w przegladarce,
bez Google Play/App Store) wysyla zdjecia bezposrednio do lokalnego serwera
uruchomionego na Twoim komputerze, o ile oba urzadzenia sa w tej samej
sieci WiFi. Zadne zdjecie nie wychodzi do internetu.

## Jak to dziala

- Na komputerze uruchamiasz maly serwer Node.js (`server/`).
- Serwer wypisuje w terminalu adres oraz **kod QR**.
- Na telefonie skanujesz kod QR aparatem – otwiera sie strona w przegladarce.
- Strona to progresywna aplikacja webowa (PWA) – mozna ja dodac do ekranu
  glownego telefonu i uzywac jak zwyklej apki.
- Wybierasz zdjecia z galerii albo robisz nowe zdjecie i wysylasz – trafiaja
  do folderu `server/uploads/RRRR-MM-DD/` na komputerze.
- Kazde uruchomienie serwera generuje losowy kod dostepu wbudowany w link/QR,
  wiec ktos inny w tej samej sieci WiFi (np. w kawiarni) nie wyslee ani nie
  pobierze Twoich zdjec bez zeskanowania Twojego kodu.

## Uruchomienie

Wymagany [Node.js](https://nodejs.org) (wersja 18+).

```bash
cd server
npm install
npm start
```

W terminalu zobaczysz cos w stylu:

```
📷  Serwer odbioru zdjec uruchomiony!

   Zdjecia beda zapisywane w: /.../server/uploads

   Adresy w sieci lokalnej (telefon musi byc w tej samej sieci WiFi):
     http://192.168.1.23:3000/?token=ab12cd34

   Zeskanuj ponizszy kod QR aparatem telefonu, zeby otworzyc aplikacje:

   [ QR KOD ]
```

## Na telefonie

1. Polacz telefon z tym samym WiFi co komputer.
2. Zeskanuj kod QR z terminala aparatem telefonu (lub wpisz adres recznie).
3. Otworz link – zobaczysz strone "Lazania".
4. Opcjonalnie: w menu przegladarki wybierz "Dodaj do ekranu glownego",
   zeby dzialalo jak normalna aplikacja.
5. Nacisnij **"Zrob zdjecie"** albo **"Z galerii"**, wybierz zdjecia,
   a nastepnie **"Wyslij zdjecia"**.

## Struktura projektu

```
server/
  server.js          – serwer Express: odbior uploadow, QR, statyczne pliki
  package.json
  public/             – frontend PWA
    index.html
    app.js
    style.css
    manifest.json
    sw.js
    icons/icon.svg
  uploads/            – tu ladują odebrane zdjecia (tworzone automatycznie)
```

## Konfiguracja

- Inny port: `PORT=8080 npm start`
- Limit rozmiaru pojedynczego zdjecia: 50 MB, max 30 zdjec na raz
  (do zmiany w `server/server.js`).

## Bezpieczenstwo

To narzedzie jest pomyslane do uzytku w zaufanej sieci domowej. Token w
adresie chroni przed przypadkowym/losowym dostepem w tej samej sieci, ale
nie zastepuje pelnego uwierzytelniania – nie wystawiaj tego serwera poza
lokalna siec (np. przez przekierowanie portow na routerze) bez dodatkowych
zabezpieczen.
