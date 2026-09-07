# PhotoBeam 📷 – zdjęcia i filmy z telefonu na komputer przez WiFi

Prosta aplikacja: telefon (dowolny – działa jako strona/PWA w przeglądarce,
bez Google Play/App Store) wysyła zdjęcia i filmy bezpośrednio do lokalnego
serwera uruchomionego na Twoim komputerze, o ile oba urządzenia są w tej
samej sieci WiFi. Żaden plik nie wychodzi do internetu.

## Jak to działa

- Na komputerze uruchamiasz mały serwer Node.js (`server/`).
- Serwer wypisuje w terminalu adres oraz **kod QR**.
- Na telefonie skanujesz kod QR aparatem – otwiera się strona w przeglądarce.
- Strona to progresywna aplikacja webowa (PWA) – można ją dodać do ekranu
  głównego telefonu i używać jak zwykłej apki.
- W nagłówku widać **wskaźnik połączenia** (zielona kropka = połączono z
  komputerem, czerwona = brak połączenia) – od razu widać, czy wysyłka
  w ogóle zadziała.
- Robisz zdjęcie, **nagrywasz film** albo wybierasz pliki z galerii i
  wysyłasz – trafiają do folderu `server/uploads/RRRR-MM-DD/` na komputerze.
- Każde uruchomienie serwera generuje losowy kod dostępu wbudowany w link/QR,
  więc ktoś inny w tej samej sieci WiFi (np. w kawiarni) nie wyśle ani nie
  pobierze Twoich plików bez zeskanowania Twojego kodu.

## Uruchomienie

Wymagany [Node.js](https://nodejs.org) (wersja 18+) – instaluje się jak
zwykły program, raz.

### Bez terminala (zalecane)

W folderze `server/` jest gotowy plik startowy – wystarczy dwuklik:

- **macOS**: `Uruchom PhotoBeam (Mac).command`
- **Windows**: `Uruchom PhotoBeam (Windows).bat`

Za pierwszym razem plik sam zainstaluje potrzebne zależności (może to
potrwać chwilę), a przy kolejnych uruchomieniach od razu odpali serwer.

> macOS może przy pierwszym uruchomieniu pokazać ostrzeżenie
> "nie można otworzyć, ponieważ pochodzi od niezidentyfikowanego
> dewelopera" – kliknij plik prawym przyciskiem myszy, wybierz
> "Otwórz", a następnie potwierdź w oknie, które się pojawi
> (trzeba to zrobić tylko raz).

### Ręcznie, przez terminal

```bash
cd server
npm install
npm start
```

W terminalu zobaczysz coś w stylu:

```
📷  Serwer odbioru zdjec uruchomiony!

   Zdjecia beda zapisywane w: /.../server/uploads

   Adresy w sieci lokalnej (telefon musi byc w tej samej sieci WiFi):
     http://192.168.1.23:3000/?token=ab12cd34

   Zeskanuj ponizszy kod QR aparatem telefonu, zeby otworzyc aplikacje:

   [ QR KOD ]
```

## Na telefonie

1. Połącz telefon z tym samym WiFi co komputer.
2. Zeskanuj kod QR z terminala aparatem telefonu (lub wpisz adres ręcznie).
3. Otwórz link – zobaczysz stronę "PhotoBeam".
4. Opcjonalnie: w menu przeglądarki wybierz "Dodaj do ekranu głównego",
   żeby działało jak normalna aplikacja.
5. Naciśnij **"Zdjecie"**, **"Nagraj film"** albo **"Z galerii"**, wybierz
   pliki, a następnie **"Wyslij"**.

## Struktura projektu

```
server/
  server.js          – serwer Express: odbiór uploadów, QR, statyczne pliki
  package.json
  Uruchom PhotoBeam (Mac).command       – dwuklik = start serwera (macOS)
  Uruchom PhotoBeam (Windows).bat       – dwuklik = start serwera (Windows)
  public/             – frontend PWA
    index.html
    app.js
    style.css
    manifest.json
    sw.js
    icons/icon.svg
  uploads/            – tu lądują odebrane zdjęcia (tworzone automatycznie)
```

## Konfiguracja

- Inny port: `PORT=8080 npm start`
- Limit rozmiaru pojedynczego pliku: 300 MB (filmy są duże), maksymalnie
  30 plików na raz (do zmiany w `server/server.js`).

## Bezpieczeństwo

To narzędzie jest pomyślane do użytku w zaufanej sieci domowej. Token w
adresie chroni przed przypadkowym dostępem w tej samej sieci, ale nie
zastępuje pełnego uwierzytelniania – nie wystawiaj tego serwera poza
lokalną sieć (np. przez przekierowanie portów na routerze) bez dodatkowych
zabezpieczeń.

## Licencja

PhotoBeam jest **darmowy**, a jego kod dostępny publicznie na licencji
[PolyForm Noncommercial 1.0.0](LICENSE). Każdy może go używać, kopiować
i przerabiać do celów **niekomercyjnych** – prywatnie, w szkole, w
organizacji społecznej. **Zarabianie na tym programie jest zastrzeżone
dla autora.**

Copyright (c) 2026 Mateusz Rybarczyk (mr3dstudio)

---

Program powstał w **mr3dstudio** – druk 3D na zamówienie i darmowe
aplikacje. Więcej na [mr3dstudio.pl](https://mr3dstudio.pl).
