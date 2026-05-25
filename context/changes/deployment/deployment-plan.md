---
change_id: deployment-plan
title: Cloudflare Workers deployment — first deploy and ongoing workflow
status: complete
created: 2026-05-24
updated: 2026-05-24
archived_at: null
---

## Cel

Opisuje wszystkie kroki potrzebne do pierwszego wdrożenia aplikacji Next.js na Cloudflare Workers oraz procedurę każdego kolejnego deployu.

---

## Pierwsze wdrożenie (one-time setup)

### 1. Konto Cloudflare

1. Utwórz konto na [cloudflare.com](https://cloudflare.com) (lub zaloguj się do istniejącego).
2. Zanotuj **Account ID** — widoczny w dashboardzie po prawej stronie po wejściu w Workers & Pages.

### 2. API Token

1. Wejdź w **My Profile → API Tokens → Create Token**.
2. Użyj szablonu **"Edit Cloudflare Workers"**.
3. Ogranicz token do jednego konta (Account Resources: Include → twoje konto).
4. Skopiuj token — będzie widoczny tylko raz.

> ⚠️ Token z szerokimi uprawnieniami (Account Owner) działa, ale jest złą praktyką. Szablon "Edit Cloudflare Workers" wystarczy.

### 3. Sekrety GitHub

W repozytorium: **Settings → Secrets and variables → Actions → New repository secret**

| Nazwa                   | Wartość              |
| ----------------------- | -------------------- |
| `CLOUDFLARE_API_TOKEN`  | Token z kroku 2      |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID z kroku 1 |

### 4. Pierwsze wdrożenie lokalne (opcjonalne)

Pozwala zweryfikować konfigurację przed pierwszym CI runem:

```bash
npm install
npx wrangler login          # zaloguj się przeglądarką
npm run deploy              # opennextjs-cloudflare build + wrangler deploy
```

Po sukcesie wrangler wypisze URL: `https://<worker-name>.<subdomain>.workers.dev`

### 5. Weryfikacja

```bash
curl -I https://shelter-needs.shelters-test.workers.dev
# Oczekiwany wynik: HTTP/2 200
```

---

## Konfiguracja projektu (już wykonana)

Poniższe pliki były ustawione jednorazowo i nie wymagają zmian przy kolejnych deployach:

| Plik                           | Rola                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| `wrangler.jsonc`               | Nazwa workera, compatibility_date, bindingi (ASSETS, IMAGES, itp.) |
| `open-next.config.ts`          | Konfiguracja adaptera OpenNext + wymuszenie `npm run build`        |
| `next.config.ts`               | Konfiguracja Next.js + inicjalizacja OpenNext dla lokalnego dev    |
| `tsconfig.app.json`            | Oddzielny tsconfig dla plików aplikacji (bez CLI i testów)         |
| `.npmrc`                       | Registry npm, `ignore-scripts=true`, `minimum-release-age`         |
| `.github/workflows/deploy.yml` | Pipeline CI/CD                                                     |

---

## Workflow kolejnych deployów (automatyczny)

Każdy push do brancha `master` uruchamia automatycznie `.github/workflows/deploy.yml`:

```
push → master
  └── Job: deploy (ubuntu-latest)
        ├── checkout
        ├── setup-node@v4 (Node 22)
        ├── setup-bun@v2 (Bun 1.3.8)       ← wymagane przez wrangler (bun.lock detection)
        ├── npm install --no-audit           ← usuwa minimum-release-age, fresh lockfile
        └── npm run deploy
              ├── opennextjs-cloudflare build
              │     └── next build (npm run build)
              └── opennextjs-cloudflare deploy -- --keep-vars
                    └── wrangler deploy
```

Czas trwania: ~2–3 minuty.

### Wymagania środowiskowe CI

| Wymaganie                      | Powód                                                                     |
| ------------------------------ | ------------------------------------------------------------------------- |
| Node.js 22+                    | `wrangler@4.x` wymaga Node ≥ 22                                           |
| Bun 1.3.8                      | Wrangler wykrywa `bun.lock` w repo i wywołuje `bun` podczas deployu       |
| `minimum-release-age` usunięty | Blokuje pakiety opublikowane < 7 dni temu (wrangler, @opennextjs)         |
| `package-lock.json` usunięty   | Wygenerowany na Windows pinuje win32 binaries; Linux wymaga fresh install |

---

## Deploy manualny (hotfix)

Workflow obsługuje `workflow_dispatch` — można uruchomić ręcznie:

1. GitHub → Actions → "Deploy to Cloudflare Workers"
2. Kliknij **Run workflow** → wybierz branch → **Run workflow**

Lub lokalnie:

```bash
# Upewnij się że jest zainstalowany wrangler i jesteś zalogowany
npm run deploy
```

---

## Zmienne środowiskowe produkcyjne

### Build-time (`NEXT_PUBLIC_*`)

Zmienne potrzebne podczas budowania Next.js — dodaj je jako `env:` w `deploy.yml`:

```yaml
- name: Deploy to Cloudflare Workers
  run: npm run deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    NEXT_PUBLIC_API_URL: ${{ vars.NEXT_PUBLIC_API_URL }} # przykład
```

### Runtime secrets

Zmienne dostępne w Worker runtime (np. klucze API, connection strings) — ustaw je w Cloudflare Dashboard:

**Workers & Pages → shelter-needs → Settings → Variables and Secrets**

Flaga `--keep-vars` w skrypcie `deploy` zachowuje istniejące sekrety przy każdym deploymen — nie są nadpisywane.

---

## Rollback

```bash
# Lista ostatnich deploymentów
npx wrangler deployments list --name shelter-needs

# Rollback do konkretnej wersji
npx wrangler rollback <deployment-id> --name shelter-needs
```

Lub w dashboardzie: **Workers & Pages → shelter-needs → Deployments → Rollback**

---

## Znane pułapki

| Problem                                              | Przyczyna                                  | Fix                                                          |
| ---------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `bun: not found`                                     | Wrangler wykrywa `bun.lock`, wywołuje bun  | `setup-bun` w workflow (już wdrożone)                        |
| `Node.js v20 is not supported`                       | wrangler@4.x wymaga Node 22+               | `node-version: "22"` w workflow (już wdrożone)               |
| `minimum-release-age` blokuje pakiet                 | Pakiet opublikowany < 7 dni temu           | `sed -i '/minimum-release-age/d' .npmrc` w CI                |
| Windows optional binaries brakuje                    | `package-lock.json` z Windows pinuje win32 | `rm -f package-lock.json` przed `npm install`                |
| E401 Artifactory                                     | Firmowy npm proxy w lockfile               | Usuń/nie commituj `package-lock.json`                        |
| `buildCommand` nie działa w `defineCloudflareConfig` | Param nie jest obsługiwany                 | Spread `defineCloudflareConfig()` + top-level `buildCommand` |
