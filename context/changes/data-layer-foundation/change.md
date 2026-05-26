---
change_id: data-layer-foundation
title: Data layer foundation: shelters and needs schema, migrations, Workers-compatible DB
status: implementing
created: 2026-05-26
updated: 2026-05-26
archived_at: null
---

## Notes

Roadmap F-01. Warstwa danych gotowa: schemat tabel `shelters` i `needs` z polami wymaganymi przez PRD, izolacja per schronisko wyegzekwowana na poziomie zapytań — baza osiągalna z Cloudflare Workers runtime przez HTTP (PostgREST).

DB choice resolved: **Supabase (PostgreSQL)** — istniejący projekt użytkownika, klucze w `.env.local`. Client: `@supabase/supabase-js`. Kod (`src/db/`) kompletny. Oczekuje na: uruchomienie SQL schematu w Supabase dashboard (Phase 2).

Risk: Klucz publishable jest NEXT*PUBLIC* — wbudowany w bundle przy buildzie. Przy deploymencie dodać jako GitHub Actions vars (nie secrets) w `deploy.yml`.

Unlocks: F-02 (auth), S-03 (donor view).
