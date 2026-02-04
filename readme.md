# 4 in a Row - Gra dla dwóch graczy

Klasyczna gra logiczna "4 w rzędzie" dla dwóch graczy, działająca w przeglądarce bez potrzeby serwera.

## Opis gry

Gra polega na naprzemiennym umieszczaniu pionków na planszy 6x6. Wygrywa gracz, który jako pierwszy ułoży 4 swoje pionki w linii - poziomo, pionowo lub ukośnie.

### Zasady
- Plansza ma rozmiar 6x6 pól
- Pionki można umieszczać na dowolnym wolnym polu (nie "spadają" na dół)
- Raz umieszczony pionek nie może być przesunięty
- Gracze wykonują ruchy naprzemiennie
- Wygrywa ten, kto pierwszy ułoży 4 pionki w linii

## Funkcjonalności

- **Tryb hot-seat** - dwóch graczy na jednym urządzeniu
- **Personalizacja graczy** - własne nazwy i kolory pionków (color picker)
- **Tryb podpowiedzi AI** - ciągłe podpowiadanie najlepszego ruchu (włącz/wyłącz)
- **Zliczanie wyników** - punkty w ramach sesji
- **Historia meczów** - zapisywana w localStorage z datami
- **Reset progresu** - możliwość usunięcia całej historii

## Technologie

- **HTML5** - struktura aplikacji
- **CSS3** - stylowanie z animacjami i responsywnością
- **JavaScript (ES6)** - logika gry w architekturze modułowej (IIFE)
- **localStorage** - przechowywanie danych bez serwera

## Struktura projektu

```
4inarow/
├── index.html          # Główny plik HTML
├── css/
│   └── style.css       # Style CSS
├── js/
│   ├── storage.js      # Moduł zarządzania localStorage
│   ├── game.js         # Moduł logiki gry
│   ├── ai.js           # Moduł AI (podpowiedzi)
│   └── app.js          # Moduł główny aplikacji
└── readme.md           # Dokumentacja
```

## Architektura

Projekt wykorzystuje wzorzec **Module Pattern** (IIFE) dla enkapsulacji:

### `Storage` - Zarządzanie danymi
- Zapis/odczyt ustawień graczy
- Historia meczów (max 100 ostatnich)
- Wynik bieżącej sesji
- Reset wszystkich danych

### `Game` - Logika gry
- Zarządzanie stanem planszy
- Walidacja ruchów
- Algorytm wykrywania wygranej (4 w linii)
- Wykrywanie remisu

### `AI` - Podpowiedzi ruchów
- Algorytm **Minimax z Alpha-Beta Pruning**
- Głębokość przeszukiwania: 4 poziomy
- Funkcja heurystyczna oceniająca pozycję
- Priorytetyzacja ruchów centralnych i blokowania

### `App` - Interfejs użytkownika
- Renderowanie widoków
- Obsługa zdarzeń
- Koordynacja między modułami

## Algorytm AI

Moduł AI wykorzystuje klasyczny algorytm **Minimax** z optymalizacją **Alpha-Beta Pruning**:

1. **Minimax** - algorytm przeszukujący drzewo gry, zakładając optymalną grę obu stron
2. **Alpha-Beta Pruning** - przycinanie gałęzi drzewa, które nie wpłyną na wynik
3. **Heurystyka** - ocena pozycji na podstawie:
   - Liczby pionków w linii (2, 3, 4)
   - Możliwości blokowania przeciwnika
   - Pozycji centralnych (bonus)

Źródła:
- [Connect Four Algorithm](https://roboticsproject.readthedocs.io/en/latest/ConnectFourAlgorithm.html)
- [Alpha-Beta Pruning - Wikipedia](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)

## Uruchomienie

Otwórz plik `index.html` w przeglądarce. Gra nie wymaga serwera ani instalacji.

```bash
# Opcjonalnie - uruchom przez prosty serwer HTTP
python3 -m http.server 8000
# lub
npx serve .
```

## Jak grać

1. **Menu główne** - Wpisz nazwy graczy i wybierz kolory pionków
2. **Rozpocznij grę** - Kliknij "Rozpocznij grę"
3. **Rozgrywka** - Klikaj na wolne pola aby umieścić pionek
4. **Podpowiedzi** - Kliknij "Włącz podpowiedzi" aby AI ciągle pokazywało najlepszy ruch (zielone podświetlenie)
5. **Wygrana/Remis** - Po zakończeniu możesz rozpocząć nową rundę
6. **Historia** - Sprawdź wyniki poprzednich meczów

## Dane w localStorage

Gra przechowuje następujące dane:
- `4inrow_players` - nazwy i kolory graczy
- `4inrow_history` - historia meczów z datami
- `4inrow_current_score` - wynik bieżącej sesji

## Responsywność

Gra działa na urządzeniach mobilnych i desktopowych. Interfejs automatycznie dostosowuje się do rozmiaru ekranu.

## Licencja

Projekt do użytku prywatnego.
