---
change_id: needs-management-panel
title: Coordinator adds, edits, and deletes needs
status: archived
created: 2026-05-26
updated: 2026-05-27
archived_at: 2026-05-27T12:30:00Z
---

## Notes

Roadmap S-02. Koordynator dodaje, edytuje i usuwa pozycje potrzeb z polami: nazwa, pilność (pilne / potrzebne / mile_widziane), ilość, link do Allegro (opcjonalne). Opiera się na S-01 (zalogowany koordynator) i F-01 (DB queries: getNeedsByShelter, createNeed, updateNeed, deleteNeed — gotowe). Ten slice buduje Server Actions + UI na wierzchu gotowych query helpers.

Unlocks: S-03 (widok publiczny czyta te same potrzeby).
