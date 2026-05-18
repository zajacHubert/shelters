---
starter_id: next
package_manager: npm
project_name: shelter-needs
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: verified
  path_taken: custom
  quality_override: false
  self_check_answers:
    typed: true
    from_official_starter: true
    conventions: true
    docs_current: true
    can_judge_agent: true
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
---

## Why this stack

Next.js with TypeScript passes all four agent-friendly criteria and fits the ShelterNeeds profile: solo developer, 3-week after-hours timeline, web-app with email/password authentication (FR-001, FR-002). App Router imposes file-based routing conventions so an AI agent can reason about the codebase structure without reading every file. The TypeScript-first setup aligns with the project's explicit type preference. Cloudflare Pages deployment gives edge-close hosting with a generous free tier suitable for a medium-scale shelter coordination platform. Auth will be wired via NextAuth or Supabase Auth — the only manual step compared to the 10x-astro-starter alternative, which ships Supabase auth out of the box. GitHub Actions handles CI with auto-deploy on merge to main, keeping the release cycle as frictionless as possible for a solo contributor working after hours.
