# 🐾 ShelterNeeds — Specyfikacja MVP

> Prosta aplikacja webowa, dzięki której schroniska komunikują czego potrzebują, a darczyńcy mogą pomóc w kilka sekund.

---

## 1. Główny problem

Schroniska nie mają prostego sposobu, żeby powiedzieć światu: „potrzebujemy tego i tego, w tej ilości, teraz". Darczyńcy chcą pomóc, ale nie wiedzą co kupić ani gdzie. Efekt: schroniska dostają rzeczy których nie potrzebują, albo nie dostają nic.

Dodatkowo każde schronisko jest gdzie indziej — darczyńca powinien móc łatwo znaleźć schronisko w swoim mieście i od razu działać.

---

## 2. Minimalny zestaw funkcjonalności

### 🏠 Rejestracja schroniska

- Rejestracja przez podanie: nazwy schroniska, miasta, adresu e-mail i hasła
- Po rejestracji schronisko dostaje własną publiczną stronę z listą potrzeb

### 📋 Zarządzanie listą potrzeb

- Dodawanie pozycji z polami:
  - **Nazwa** _(wymagane)_ — np. „Sucha karma dla kotów"
  - **Status pilności** _(wymagane)_ — `🔴 Pilne` / `🟡 Potrzebne` / `🟢 Mile widziane`
  - **Potrzebna ilość** _(wymagane)_ — np. „20 kg", „50 sztuk"
  - **Link do Allegro** _(opcjonalne)_
- Edycja i usuwanie pozycji

### 🗺️ Widok publiczny dla darczyńców

- Strona główna z listą schronisk, filtrowaną po mieście
- Strona schroniska: lista potrzeb posortowana według pilności, przycisk „Kup na Allegro →" przy każdej pozycji z linkiem
- Bez logowania — dostęp publiczny

### 🔐 Panel schroniska

- Logowanie e-mail + hasło
- Każde schronisko widzi i edytuje tylko swoje dane

---

## 3. Co NIE wchodzi w zakres MVP

| Funkcja                         | Powód                                                          |
| ------------------------------- | -------------------------------------------------------------- |
| Adopcja zwierząt                | Poza zakresem — aplikacja dotyczy tylko zaopatrzenia schronisk |
| Konta darczyńców                | Niepotrzebne — pomoc anonimowa, bez rejestracji                |
| Płatności i zakupy w aplikacji  | Złożoność prawna; link do Allegro wystarczy                    |
| Powiadomienia e-mail / push     | Można dodać po MVP                                             |
| Zdjęcia produktów               | Niepotrzebne na tym etapie                                     |
| Mapa schronisk                  | Filtr po mieście wystarczy                                     |
| Historia zmian / logi           | Niepotrzebne na tym etapie                                     |
| Aplikacja mobilna (iOS/Android) | Responsywna wersja web na razie wystarczy                      |
| Weryfikacja schronisk           | Na etapie MVP model oparty na zaufaniu                         |

---

## 4. Kryteria sukcesu

- [ ] Co najmniej **3 schroniska** z różnych miast aktywnie korzystają z aplikacji
- [ ] Każde schronisko aktualizuje listę **co najmniej raz w tygodniu**
- [ ] Darczyńca może znaleźć schronisko i kliknąć link do Allegro **w mniej niż 60 sekund**, bez zakładania konta
- [ ] Schronisko może się zarejestrować i dodać pierwszą potrzebę **w mniej niż 5 minut**
- [ ] Aplikacja działa poprawnie w przeglądarce na telefonie i komputerze

---
