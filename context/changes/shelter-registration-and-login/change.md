---
change_id: shelter-registration-and-login
title: Coordinator registers a shelter and logs in to the panel
status: implemented
created: 2026-05-26
updated: 2026-05-26
archived_at: null
---

## Notes

Roadmap S-01. Koordynator rejestruje schronisko podając nazwę, miasto, e-mail i hasło; loguje się do panelu; wylogowuje się. Opiera się na fundamencie F-01 (schemat DB) i F-02 (auth utilities + Server Actions + middleware). Ten slice buduje UI na wierzchu gotowych Server Actions — formularze rejestracji i logowania z walidacją UX, obsługą błędów i guardrailem "rejestracja w <5 minut".

Unlocks: S-02 (panel potrzeb wymaga zalogowanego koordynatora).
