---
project: 'ShelterNeeds'
version: 1
status: draft
created: 2026-05-18
context_type: greenfield
product_type: web-app
target_scale:
  users: medium
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: null
  after_hours_only: true
---

## Vision & Problem Statement

Schroniska dla zwierząt nie mają prostego kanału do komunikowania aktualnych, skwantyfikowanych potrzeb szerokiej publiczności. Darczyńcy chcą pomagać, ale nie wiedzą co kupić ani gdzie — efektem jest niedopasowanie: schroniska dostają niepotrzebne rzeczy lub nie dostają nic.

Insight: schroniska są małymi organizacjami bez zasobów IT — istniejące rozwiązania (social media, e-mail, telefon) są zbyt wolne i nieefektywne dla non-tech koordynatora. Prosta, dedykowana aplikacja webowa może rozwiązać problem bez wymagania budżetu technicznego.

## User & Persona

### Primary persona

**Darczyńca** — osoba prywatna, która chce pomóc schronisku w swoim mieście, ale nie zna aktualnych potrzeb. Moment: impulsywna chęć pomocy, zazwyczaj po przypadkowym przypomnieniu (social media, rozmowa). Cel: znaleźć schronisko w swoim mieście i kliknąć "kup" w mniej niż 60 sekund, bez zakładania konta.

### Secondary persona

**Koordynator schroniska** — osoba zarządzająca zaopatrzeniem w schronisku (niekoniecznie techniczna). Cel: zarejestrować schronisko i utrzymywać aktualną listę potrzeb. Moment: gdy zapasy się kończą lub zmieniają priorytety.

## Success Criteria

### Primary

- Darczyńca może znaleźć schronisko w swoim mieście i kliknąć link do Allegro w mniej niż 60 sekund, bez zakładania konta.

### Secondary

- Co najmniej 3 schroniska z różnych miast aktywnie korzystają z aplikacji, każde aktualizuje listę potrzeb co najmniej raz w tygodniu.

### Guardrails

- Koordynator może zarejestrować schronisko i dodać pierwszą potrzebę w mniej niż 5 minut.
- Aplikacja działa poprawnie w przeglądarce na telefonie i komputerze (responsywność).

## User Stories

### US-01: Darczyńca znajduje potrzebę i klika link

- **Given** darczyńca wchodzi na stronę główną i filtruje po swoim mieście
- **When** wybiera schronisko i przegląda listę potrzeb
- **Then** widzi pozycje posortowane według pilności i może kliknąć "Kup na Allegro →" przy każdej pozycji z linkiem

#### Acceptance Criteria

- Lista schronisk filtruje się po wpisaniu miasta
- Potrzeby na stronie schroniska są posortowane: pilne → potrzebne → mile widziane
- Kliknięcie linku otwiera stronę Allegro w nowej karcie
- Cały flow zajmuje mniej niż 60 sekund bez logowania

## Functional Requirements

### Rejestracja i autentykacja

- FR-001: Koordynator może zarejestrować schronisko podając nazwę, miasto, adres e-mail i hasło. Priority: must-have

  > Socrates: Kontrargument rozważony: "brak weryfikacji = ryzyko fake schronisk". Rozwiązanie: utrzymane; MVP oparty na zaufaniu — świadoma decyzja, weryfikacja po MVP.

- FR-002: Koordynator może zalogować się do panelu schroniska za pomocą e-mail i hasła. Priority: must-have

  > Socrates: Kontrargument rozważony: "magic link byłby prostszy dla non-tech". Rozwiązanie: utrzymane; e-mail+hasło jest wystarczające i prostsze do implementacji w MVP.

- FR-003: Koordynator może wylogować się z panelu. Priority: must-have
  > Socrates: Brak kontrargumentu — FR stoi.
  > Socrates: Brak kontrargumentu — FR stoi.

### Zarządzanie potrzebami

- FR-004: Koordynator może dodać pozycję potrzeby z polami: nazwa (wymagane), status pilności (wymagane: pilne / potrzebne / mile widziane), potrzebna ilość (wymagane), link do Allegro (opcjonalne). Priority: must-have

  > Socrates: Kontrargument rozważony: "pilność bez reguły to CRUD z etykietkami — koordynator decyduje subiektywnie". Rozwiązanie: utrzymane; reguła pilności zdefiniowana w sekcji Business Logic.

- FR-005: Koordynator może edytować istniejącą pozycję potrzeby. Priority: must-have

  > Socrates: Brak kontrargumentu — FR stoi.

- FR-006: Koordynator może usunąć pozycję potrzeby. Priority: must-have
  > Socrates: Brak kontrargumentu — FR stoi.

### Zarządzanie kontem schroniska

- FR-010: Koordynator może edytować dane schroniska (nazwa, miasto, adres e-mail, hasło). Zmiana wymaga potwierdzenia aktualnym hasłem. Priority: must-have

  > Socrates: Kontrargument rozważony: "skoro e-mail to login, zmiana e-maila powinna wymagać weryfikacji poprzez wysyłkę linku". Rozwiązanie: utrzymane w MVP — potwierdzenie aktualnym hasłem jest wystarczającym guardrailem bez infrastruktury e-mail transakcyjnego.

- FR-011: Koordynator może usunąć konto schroniska wraz ze wszystkimi powiązanymi potrzebami. Operacja wymaga potwierdzenia aktualnym hasłem i jest nieodwracalna. Priority: must-have
  > Socrates: Brak kontrargumentu — FR stoi.

### Widok publiczny

- FR-007: Darczyńca może przeglądać listę schronisk filtrowaną po mieście bez logowania. Priority: must-have

  > Socrates: Kontrargument rozważony: "widok bezużyteczny do cold start". Rozwiązanie: utrzymane; cold start jest problemem operacyjnym (dotarcie do schronisk), nie produktowym.

- FR-008: Darczyńca może wejść na stronę schroniska i zobaczyć listę potrzeb posortowaną według pilności. Priority: must-have

  > Socrates: j.w. (cold start) — utrzymane.

- FR-009: Darczyńca może kliknąć link "Kup na Allegro" przy pozycji potrzeby, która ma podany link. Priority: must-have
  > Socrates: Brak kontrargumentu — FR stoi.

## Non-Functional Requirements

- Darczyńca widzi listę schronisk lub potrzeb schroniska w ≤ 2 sekundy od wejścia na stronę (p95, zmierzone z sieci mobilnej).
- Aplikacja działa poprawnie na dwóch ostatnich wersjach głównych przeglądarek desktopowych (Chrome, Firefox, Safari) oraz na mobilnym Chrome i Safari.
- Hasła koordynatorów nie są przechowywane w formie plaintext; dane każdego schroniska są dostępne wyłącznie dla właściciela konta (izolacja per schronisko).

## Business Logic

Aplikacja eksponuje potrzeby schroniska darczyńcom w kolejności malejącej pilności, zgodnie z klasyfikacją ustawioną przez koordynatora (pilne → potrzebne → mile widziane).

Reguła operuje na dwóch wejściach: (1) pozycja potrzeby z polem pilności ustawionym przez koordynatora, (2) zapytanie darczyńcy o schronisko. Wyjście: posortowana lista potrzeb widoczna bez logowania. Darczyńca zawsze widzi najpilniejsze potrzeby na górze bez własnej analizy — wartość pochodzi z egzekwowania tej kolejności, nie z samego przechowywania rekordów.

## Access Control

- **Darczyńca**: dostęp publiczny — brak logowania, brak rejestracji. Wszystkie strony schronisk i listy potrzeb są widoczne bez konta.
- **Koordynator schroniska**: e-mail + hasło. Każde schronisko widzi i edytuje wyłącznie swoje dane (flat model — brak separacji admin/member w MVP).
- Brak kont darczyńców — pomoc jest anonimowa.
- Brak roli admin w MVP — model oparty na zaufaniu przy rejestracji schronisk.

## Non-Goals

- Brak adopcji zwierząt — aplikacja dotyczy wyłącznie zaopatrzenia schronisk.
- Brak kont darczyńców — pomoc jest anonimowa, bez rejestracji.
- Brak płatności / zakupów w aplikacji — złożoność prawna; link do Allegro wystarczy.
- Brak powiadomień e-mail / push — można dodać po MVP.
- Brak mapy schronisk — filtr po mieście jest wystarczający dla MVP.
- Brak weryfikacji schronisk — MVP oparty na zaufaniu; weryfikacja do rozważenia po osiągnięciu skali.

## Open Questions

_(brak otwartych pytań)_
