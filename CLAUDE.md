# Drugi Mózg 🧠

Mój drugi mózg — stały zbiór zasad, według których Claude ma pracować
we wszystkich moich projektach, nie tylko w tym repozytorium. To, czego
nie chcę powtarzać przy każdej rozmowie.

> Nazwa pliku musi brzmieć `CLAUDE.md` — tylko taki plik Claude Code
> wczytuje automatycznie na starcie sesji. „Drugi Mózg" to nazwa tego,
> co jest w środku.

> Kopia tego pliku w `~/.claude/CLAUDE.md` na moim komputerze obowiązuje
> we wszystkich projektach. Kopia w katalogu głównym repozytorium
> obowiązuje w tym jednym projekcie. Treść jest ta sama.

## 1. Komunikacja

- Rozmawiaj ze mną **po polsku**, prostym językiem — nie jestem programistką.
- Zamiast żargonu pisz, co dana rzecz realnie robi i co mam kliknąć.
- Gdy czegoś nie da się zrobić (brak uprawnień, błąd, ślepa uliczka) —
  powiedz to wprost i od razu. Nie udawaj, że się udało, i nie owijaj.
- Nie zasypuj mnie opcjami. Zaproponuj jedno rozwiązanie i uzasadnij krótko.

## 2. Pytaj, zanim zbudujesz

- Jeśli polecenie jest ogólne (np. „stwórz nowy projekt"), **najpierw zapytaj**,
  o co dokładnie chodzi. Nie zgaduj i nie buduj czegoś dużego na wyczucie.
- Drobne decyzje techniczne podejmuj sam — nie pytaj o rzeczy, które i tak
  nic dla mnie nie znaczą.

## 3. Kod

- **Node.js** jako domyślny wybór. Bez etapu budowania (build), bez
  frameworków frontendowych, jeśli wystarczy zwykły HTML/CSS/JS.
- **Minimum zależności.** Zanim dodasz pakiet z npm, sprawdź, czy Node nie
  ma tego wbudowanego. Każda zależność to coś, co może się zepsuć.
- Styl: `'use strict'`, wcięcia 2 spacje, krótkie funkcje.
- Komentarze w kodzie po polsku i **bez polskich znaków** (`zdjecia`, nie
  `zdjęcia`) — tak samo teksty w interfejsie i wypisywane w terminalu.
  Nazwy zmiennych i funkcji po angielsku.
- Ta zasada nie dotyczy dokumentacji (README, ten plik) — tam pisz
  normalną polszczyzną z ogonkami.

## 4. Projekt ma być łatwy w uruchomieniu

- Każdy projekt uruchamialny **dwuklikiem**: `Uruchom X (Mac).command`
  i `Uruchom X (Windows).bat`, które same instalują zależności za
  pierwszym razem.
- `README.md` po polsku: co to jest, jak uruchomić krok po kroku, co
  zobaczę na ekranie.
- Jeśli z aplikacji korzystam z telefonu — kod QR w terminalu, żeby nie
  przepisywać adresów.

## 5. Prywatność i bezpieczeństwo

- Moje dane (zdjęcia, notatki, pliki) zostają **na moim komputerze**.
  Żadnych chmur i usług zewnętrznych bez mojej wyraźnej zgody.
- Nigdy nie zapisuj w repozytorium haseł, tokenów ani kluczy.
- Nowe repozytoria twórz jako **prywatne**, chyba że powiem inaczej.

## 6. Git

- Domyślnie pracuj na gałęzi `claude/...`. Z gałęzi `main` **wolno Ci
  korzystać, ale za każdym razem najpierw poproś mnie o zgodę** —
  także wtedy, gdy repozytorium jest puste albo zmiana wydaje się
  drobna. Zgoda dotyczy jednego pushu, nie wszystkich następnych.
- Tytuł commita po angielsku, jednym zdaniem; opis pod spodem może być
  po polsku.
- **Nie twórz pull requestów**, dopóki wyraźnie o to nie poproszę.
- Nie usuwaj plików i nie nadpisuj mojej pracy bez pytania.

## 7. Kończenie pracy

- Zanim powiesz, że gotowe — sprawdź, że to naprawdę działa.
- Napisz krótko: co powstało, gdzie to jest i co mam zrobić dalej.
- Jeśli czegoś nie dokończyłeś, powiedz czego i dlaczego.
