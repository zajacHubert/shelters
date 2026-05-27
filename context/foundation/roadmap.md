---
project: ShelterNeeds
version: 1
status: draft
created: 2026-05-25
updated: 2026-05-27
prd_version: 1
main_goal: speed
top_blocker: capacity
---

# Roadmap: ShelterNeeds

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

Schroniska nie mają prostego kanału do komunikowania aktualnych potrzeb zaopatrzeniowych szerokiej publiczności — darczyńcy chcą pomagać, ale nie wiedzą co kupić ani gdzie. ShelterNeeds rozwiązuje ten problem po obu stronach: koordynator aktualizuje listę potrzeb w kilka minut, a darczyńca znajduje schronisko i klika "kup" w mniej niż 60 sekund bez zakładania konta.

## North star

**S-03: Darczyńca odkrywa potrzeby i klika link do Allegro** — gwiazda przewodnia (czyli najmniejszy kompletny przepływ end-to-end, który po uruchomieniu potwierdza główną hipotezę PRD: że darczyńca może znaleźć schronisko i kliknąć link w mniej niż 60 sekund bez logowania) to widok publiczny schroniska. Waliduje primary Success Criterion i zamyka pętlę produktu.

## At a glance

| ID   | Change ID                      | Outcome (user can …)                                                                                                          | Prerequisites | PRD refs                                                                     | Status   |
| ---- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------- | -------- |
| F-01 | data-layer-foundation          | (fundament) warstwa danych gotowa: schemat tabel schronisk i potrzeb, migracje, izolacja per schronisko                       | —             | NFR (izolacja per schronisko, hasła nie w plaintext)                         | ready    |
| F-02 | auth-scaffold                  | (fundament) autentykacja e-mail+hasło działa: rejestracja z hashowaniem hasła, sesja, ochrona tras panelu koordynatora        | F-01          | FR-001, FR-002, FR-003, NFR (hasła nie w plaintext, izolacja per schronisko) | proposed |
| S-01 | shelter-registration-and-login | koordynator rejestruje schronisko i loguje się do panelu                                                                      | F-01, F-02    | FR-001, FR-002, FR-003, US-01                                                | proposed |
| S-02 | needs-management-panel         | koordynator dodaje, edytuje i usuwa pozycje potrzeb z polami: nazwa, pilność, ilość, link do Allegro                          | S-01          | FR-004, FR-005, FR-006, US-01                                                | done     |
| S-03 | donor-discovery-flow           | darczyńca przegląda schroniska po mieście, widzi potrzeby posortowane według pilności i klika link do Allegro — bez logowania | F-01          | FR-007, FR-008, FR-009, US-01                                                | done     |

## Streams

Tabela nawigacyjna — grupuje pozycje według wspólnego łańcucha zależności. Kanoniczne porządkowanie żyje w grafie zależności poniżej; tabela pokazuje proponowany porządek czytania przez równoległe tory.

| Stream | Temat                            | Łańcuch                           | Uwaga                                                                                                        |
| ------ | -------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| A      | Fundament + ścieżka koordynatora | `F-01` → `F-02` → `S-01` → `S-02` | Krytyczna ścieżka musi-mieć; cel `speed` — ten tor idzie pierwszy.                                           |
| B      | Widok darczyńcy (gwiazda)        | `S-03`                            | Rozgałęzia się od `F-01` w Streamie A; może biec równolegle z S-01 i S-02, jeśli pojawi się drugi deweloper. |

## Baseline

Stan bazy kodu na dzień 2026-05-25 (auto-zbadany + potwierdzony).
Fundament poniżej zakłada, że te warstwy są obecne i ich NIE przebudowuje.

- **Frontend:** partial — Next.js 15.5 + React 19 + Tailwind CSS v4 zainstalowane; tylko domyślny szablon (src/app/page.tsx)
- **Backend / API:** absent — brak tras API, brak server actions
- **Data:** absent — brak sterownika DB, ORM, plików schematu ani migracji
- **Auth:** absent — brak providera auth dla aplikacji webowej (auth-flow.ts należy do narzędzia CLI, nie do aplikacji webowej)
- **Deploy / infra:** present — wrangler.jsonc, open-next.config.ts, .github/workflows/deploy.yml (Cloudflare Workers + GitHub Actions CI/CD)
- **Observability:** absent — brak logowania, śledzenia błędów ani metryk dla aplikacji webowej

## Foundations

### F-01: Warstwa danych

- **Outcome:** (fundament) warstwa danych gotowa: schemat tabel `shelters` i `needs` z polami wymaganymi przez PRD, migracje, izolacja per schronisko wyegzekwowana na poziomie zapytań — baza osiągalna z Cloudflare Workers runtime.
- **Change ID:** data-layer-foundation
- **PRD refs:** NFR (izolacja per schronisko: "dane każdego schroniska dostępne wyłącznie dla właściciela konta"), NFR (hasła nie w plaintext: schemat wymaga pola `password_hash`, nie `password`)
- **Unlocks:** F-02 (tabela `users`/`shelters` wymagana przez warstwę auth), S-03 (widok darczyńcy czyta dane schronisk i potrzeb)
- **Prerequisites:** —
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** Który DB kompatybilny z Cloudflare Workers wybrać (Cloudflare D1, Supabase/PostgreSQL przez HTTP, Turso/libSQL)? — Owner: developer. Block: no.
- **Risk:** Cloudflare Workers nie wspiera połączeń TCP — wybór DB musi być HTTP-kompatybilny lub natywny dla Workers; nieprawidłowy wybór tutaj blokuje cały stos danych.
- **Status:** ready

### F-02: Szkielet autentykacji

- **Outcome:** (fundament) autentykacja e-mail+hasło działa: rejestracja z hashowaniem hasła, logowanie, zarządzanie sesją, ochrona tras panelu koordynatora — izolacja per schronisko wyegzekwowana przez middleware sesji.
- **Change ID:** auth-scaffold
- **PRD refs:** FR-001, FR-002, FR-003, NFR (hasła nie w plaintext: "hasła koordynatorów nie są przechowywane w formie plaintext"), NFR (izolacja per schronisko: "dane każdego schroniska dostępne wyłącznie dla właściciela konta")
- **Unlocks:** S-01 (rejestracja i logowanie koordynatora opierają się na tym fundamencie)
- **Prerequisites:** F-01
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** Która biblioteka auth jest kompatybilna z Next.js na Cloudflare Workers edge runtime (NextAuth.js v5, better-auth, Supabase Auth)? — Owner: developer. Block: no.
- **Risk:** Część bibliotek auth nie wspiera Cloudflare Workers edge runtime (brak Node.js globals); weryfikacja kompatybilności przed planowaniem zapobiegnie konieczności restartu F-02.
- **Status:** done

## Slices

### S-01: Rejestracja schroniska i logowanie koordynatora

- **Outcome:** koordynator może zarejestrować schronisko podając nazwę, miasto, e-mail i hasło; zalogować się do panelu; i wylogować.
- **Change ID:** shelter-registration-and-login
- **PRD refs:** FR-001, FR-002, FR-003, US-01
- **Prerequisites:** F-01, F-02
- **Parallel with:** S-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** UX formularza rejestracji decyduje o guardrailu "koordynator rejestruje schronisko w <5 minut" (PRD §Guardrails) — zbyt skomplikowany formularz blokuje wtórne kryterium sukcesu i zniechęca non-tech koordynatorów.
- **Status:** proposed

### S-02: Panel zarządzania potrzebami

- **Outcome:** koordynator może dodać pozycję potrzeby (nazwa, status pilności: pilne/potrzebne/mile widziane, potrzebna ilość, opcjonalny link do Allegro), edytować istniejącą pozycję i usunąć ją.
- **Change ID:** needs-management-panel
- **PRD refs:** FR-004, FR-005, FR-006, US-01
- **Prerequisites:** S-01
- **Parallel with:** S-03
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Pole pilności jest subiektywne i ustawiane przez koordynatora (PRD §Business Logic — świadoma decyzja projektowa); prawidłowe sortowanie w S-03 zależy od dyscypliny koordynatora, nie od walidacji aplikacji.
- **Status:** proposed

### S-03: Widok publiczny dla darczyńcy

- **Outcome:** darczyńca może przeglądać listę schronisk filtrowaną po mieście (bez logowania), wejść na stronę schroniska, zobaczyć potrzeby posortowane według pilności (pilne → potrzebne → mile widziane) i kliknąć "Kup na Allegro →" otwierający Allegro w nowej karcie.
- **Change ID:** donor-discovery-flow
- **PRD refs:** FR-007, FR-008, FR-009, US-01
- **Prerequisites:** F-01
- **Parallel with:** S-01, S-02
- **Blockers:** —
- **Unknowns:**
  - Jak osiągnąć ≤2s p95 na sieci mobilnej dla listy schronisk — SSR, SSG czy ISR? — Owner: developer. Block: no.
- **Risk:** NFR wymaga ≤2s p95 z sieci mobilnej — wybór strategii renderowania (SSR/SSG/ISR) ma znaczący wpływ na wydajność i powinien być podjęty w `/10x-plan donor-discovery-flow`, nie odkładany.
- **Status:** done

## Backlog Handoff

| Roadmap ID | Change ID                      | Suggested issue title                                                                                  | Ready for `/10x-plan` | Notes                                              |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------- | -------------------------------------------------- |
| F-01       | data-layer-foundation          | Warstwa danych: schemat schronisk i potrzeb, migracje, izolacja per schronisko (Workers-compatible DB) | yes                   | Uruchom `/10x-plan data-layer-foundation`          |
| F-02       | auth-scaffold                  | Szkielet auth: rejestracja, logowanie, sesja, ochrona tras (e-mail+hasło, Next.js + Workers)           | no                    | Poczekaj na F-01                                   |
| S-01       | shelter-registration-and-login | Koordynator: rejestracja schroniska, logowanie, wylogowanie                                            | no                    | Poczekaj na F-01, F-02                             |
| S-02       | needs-management-panel         | Koordynator: dodaj / edytuj / usuń potrzebę (nazwa, pilność, ilość, link do Allegro)                   | no                    | Poczekaj na S-01                                   |
| S-03       | donor-discovery-flow           | Darczyńca: lista schronisk po mieście, potrzeby według pilności, klik Allegro                          | no                    | Poczekaj na F-01; może biec równolegle z S-01/S-02 |

## Open Roadmap Questions

_(Brak otwartych pytań na poziomie roadmapy. PRD miał 0 otwartych pytań; decyzje techniczne w F-01 i F-02 są rozstrzygane podczas planowania przez `/10x-plan`.)_

## Parked

- **Adopcja zwierząt** — Why parked: PRD §Poza zakresem: "aplikacja dotyczy wyłącznie zaopatrzenia schronisk".
- **Konta darczyńców** — Why parked: PRD §Poza zakresem: "pomoc jest anonimowa, bez rejestracji".
- **Płatności / zakupy w aplikacji** — Why parked: PRD §Poza zakresem: "złożoność prawna; link do Allegro wystarczy".
- **Powiadomienia e-mail / push** — Why parked: PRD §Poza zakresem: "można dodać po MVP".
- **Mapa schronisk** — Why parked: PRD §Poza zakresem: "filtr po mieście jest wystarczający dla MVP".
- **Weryfikacja schronisk** — Why parked: PRD §Poza zakresem: "MVP oparty na zaufaniu; weryfikacja do rozważenia po osiągnięciu skali".
- **Observability (logging, error tracking)** — Why parked: main_goal=speed, jeden deweloper, budżet 3 tygodnie; wbudowane logi Cloudflare Workers są wystarczające dla MVP.

## Done

- **S-02: koordynator może dodać pozycję potrzeby (nazwa, status pilności: pilne/potrzebne/mile widziane, potrzebna ilość, opcjonalny link do Allegro), edytować istniejącą pozycję i usunąć ją.** — Archived 2026-05-27 → `context/archive/2026-05-26-needs-management-panel/`. Lesson: —.
- **S-03: darczyńca może przeglądać listę schronisk filtrowaną po mieście (bez logowania), wejść na stronę schroniska, zobaczyć potrzeby posortowane według pilności (pilne → potrzebne → mile widziane) i kliknąć "Kup na Allegro →" otwierający Allegro w nowej karcie.** — Archived 2026-05-27 → `context/archive/2026-05-27-donor-discovery-flow/`. Lesson: —.
