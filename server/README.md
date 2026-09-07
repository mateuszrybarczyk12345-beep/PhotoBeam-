# PhotoBeam 📷 – zdjecia i filmy z telefonu na komputer przez WiFi

Prosta aplikacja: telefon (dowolny – dziala jako strona/PWA w przegladarce,
bez Google Play/App Store) wysyla zdjecia i filmy bezposrednio do lokalnego
serwera uruchomionego na Twoim komputerze, o ile oba urzadzenia sa w tej
samej sieci WiFi. Zadien plik nie wychodzi do internetu.

## Jak to dziala

- Na komputerze uruchamiasz maly serwer Node.js (`server/`).
- Serwer wypisuje w terminalu adres oraz **kod QR**.
- Na telefonie skanujesz kod QR aparatem – otwiera sie strona w przegladarce.
- Strona to progresywna aplikacja webowa (PWA) – mozna ja dodac do ekranu
  glownego telefonu i uzywac jak zwyklej apki.
- W naglowku widac **wskaznik polaczenia** (zielona kropka = polaczono z
  komputerem, czerwona = brak polaczenia) – od razu widac, czy wysylka
  w ogole zadziala.
- Robisz zdjecie, **nagrywasz film** albo wybierasz pliki z galerii i
  wysylasz – trafiaja do folderu `server/uploads/RRRR-MM-DD/` na komputerze.
- Kazde uruchomienie serwera generuje losowy kod dostepu wbudowany w link/QR,
  wiec ktos inny w tej samej sieci WiFi (np. w kawiarni) nie wyslee ani nie
  pobierze Twoich plikow bez zeskanowania Twojego kodu.

## Uruchomienie

Wymagany [Node.js](https://nodejs.org) (wersja 18+) - instaluje sie jak
zwykly program, raz.

### Bez terminala (zalecane)

W folderze `server/` jest gotowy plik startowy - wystarczy dwuklik:

- **macOS**: `Uruchom PhotoBeam (Mac).command`
- **Windows**: `Uruchom PhotoBeam (Windows).bat`

Za pierwszym razem plik sam zainstaluje potrzebne zaleznosci (moze to
potrwac chwile), a przy kolejnych uruchomieniach od razu odpali serwer.

> macOS moze przy pierwszym uruchomieniu pokazac ostrzezenie
> "nie mozna otworzyc, poniewaz pochodzi od niezidentyfikowanego
> dewelopera" - kliknij plik prawym przyciskiem myszy, wybierz
> "Otworz", a nastepnie potwierdz w oknie, ktore sie pojawi
> (trzeba to zrobic tylko raz).

### Recznie, przez terminal

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
3. Otworz link – zobaczysz strone "PhotoBeam".
4. Opcjonalnie: w menu przegladarki wybierz "Dodaj do ekranu glownego",
   zeby dzialalo jak normalna aplikacja.
5. Nacisnij **"Zdjecie"**, **"Nagraj film"** albo **"Z galerii"**, wybierz
   pliki, a nastepnie **"Wyslij"**.

## Struktura projektu

```
server/
  server.js          – serwer Express: odbior uploadow, QR, statyczne pliki
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
  uploads/            – tu ladują odebrane zdjecia (tworzone automatycznie)
```

## Konfiguracja

- Inny port: `PORT=8080 npm start`
- Limit rozmiaru pojedynczego pliku: 300 MB (filmy sa duze), max 30 plikow
  na raz (do zmiany w `server/server.js`).

## Bezpieczenstwo

To narzedzie jest pomyslane do uzytku w zaufanej sieci domowej. Token w
adresie chroni przed przypadkowym/losowym dostepem w tej samej sieci, ale
nie zastepuje pelnego uwierzytelniania – nie wystawiaj tego serwera poza
lokalna siec (np. przez przekierowanie portow na routerze) bez dodatkowych
zabezpieczen.
