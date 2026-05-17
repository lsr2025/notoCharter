# NotoCharter™ — Project Completion Questionnaire

**For:** lsr2025 (Project Owner)
**From:** oluwatosindot (Developer)
**Date:** 2026-05-17

---

> **How to use this file:**
> - Tick `[ ]` → `[x]` next to each question you have answered
> - Type your answer in the `Answer:` line directly below the question
> - You can edit this file directly on GitHub — no software needed
> - Questions marked 🔴 **BLOCKING** must be answered before I can continue

---

## Section 1 — DMR Excel Template 🔴 BLOCKING

- [ ] **Q1.** Can you share the `Mining_Charter_Report_Template.xlsx` file? *(This is the official DMR workbook. Without it I cannot build the export engine correctly.)*
  > **Answer:**

- [ ] **Q2.** How many sheets does the template have — is it 28 or 29? *(The codebase references both.)*
  > **Answer:**

- [ ] **Q3.** Are there any DMR-specific formulas or named ranges in the template that must be preserved? *(e.g., auto-calculated totals, compliance threshold cells)*
  > **Answer:**

- [ ] **Q4.** Does the template use colour-coding or conditional formatting the DMR expects? *(e.g., cells turn red if below threshold)*
  > **Answer:**

- [ ] **Q5.** Is there a completed sample submission (even anonymised) I can use as a reference to verify the export output?
  > **Answer:**

---

## Section 2 — Supabase Project 🔴 BLOCKING

- [ ] **Q6.** Has a Supabase project already been created for NotoCharter™?
  > **Answer:**

- [ ] **Q7.** If yes — what is the Project URL and anon key? *(Safe to share — not the service role key)*
  > **Answer:**

- [ ] **Q8.** If no — should I create the Supabase project? *(Requires a Supabase account. Free tier for dev, Pro $25/month for production.)*
  > **Answer:**

- [ ] **Q9.** What is the intended production Supabase tier?
  - [ ] Free
  - [ ] Pro ($25/month)
  - [ ] Team
  > **Answer:**

- [ ] **Q10.** Should I run all database migrations, RLS policies, and seed data from scratch, or is there an existing schema to import?
  > **Answer:**

---

## Section 3 — Production Hosting 🔴 BLOCKING

- [ ] **Q11.** Where should the app be deployed for production?
  - [ ] Vercel (already configured in the project)
  - [ ] Cloudflare Pages (mentioned in the project spec)
  - [ ] Somewhere else — specify below
  > **Answer:**

- [ ] **Q12.** Is there a custom domain for the app? *(e.g., notocharter.npc-cimpor.co.za)*
  > **Answer:**

- [ ] **Q13.** Do you have the production `.env` variables? *(Supabase URL + anon key + service role key for edge functions)*
  > **Answer:**

---

## Section 4 — PDF Executive Summary

- [ ] **Q14.** Is a PDF export required for this delivery?
  - [ ] Yes
  - [ ] No
  > **Answer:**

- [ ] **Q15.** If yes — what should the PDF contain?
  - [ ] Full compliance scorecard summary (scores per element, overall tier, ring-fenced pass/fail)
  - [ ] Cover sheet + scorecard only (1–2 pages)
  - [ ] Full narrative report with all module data
  > **Answer:**

- [ ] **Q16.** Is there a logo or branding template for the PDF? *(Please share logo file and any brand colour codes if yes)*
  > **Answer:**

---

## Section 5 — Offline / PWA Mode

- [ ] **Q17.** Is offline capability required? *(i.e., users enter compliance data without internet and sync later)*
  - [ ] Yes
  - [ ] No
  > **Answer:**

- [ ] **Q18.** If yes — which modules need offline support?
  - [ ] All modules
  - [ ] Specific modules only — list below
  > **Answer:**

- [ ] **Q19.** Is the PWA install prompt ("Add to home screen") required?
  - [ ] Yes
  - [ ] No
  > **Answer:**

---

## Section 6 — CSV / Bulk Data Import

- [ ] **Q20.** Do users need to import data from CSV files? *(e.g., bulk upload supplier spend, EE data from payroll exports)*
  - [ ] Yes
  - [ ] No
  > **Answer:**

- [ ] **Q21.** If yes — which modules need CSV import?
  - [ ] Procurement
  - [ ] HRD
  - [ ] Employment Equity
  - [ ] All modules
  > **Answer:**

- [ ] **Q22.** Is there a specific CSV format or template the client already uses? *(e.g., from their ERP or HR system)*
  > **Answer:**

---

## Section 7 — Users, Roles & Mining Rights

- [ ] **Q23.** How many users will be on the live system at go-live?
  > **Answer:**

- [ ] **Q24.** What are the mining right reference numbers for NPC-Cimpor? *(e.g., LP 30/5/1/2/10905 PR — needed to seed the database correctly)*
  > **Answer:**

- [ ] **Q25.** Who is the first admin / compliance officer user? *(Name + email — needed to create the initial account)*
  > **Answer:**

- [ ] **Q26.** Should the system be pre-populated with demo/test data for client review, or start completely empty?
  - [ ] Pre-populate with demo data
  - [ ] Start empty
  > **Answer:**

---

## Section 8 — Scoring & Compliance Rules

- [ ] **Q27.** Has the scoring logic been verified against the official DMR scorecard?
  - [ ] Yes — confirmed correct
  - [ ] No — needs review
  - [ ] Partially — see answer below
  > **Answer:**

- [ ] **Q28.** Are there any transitional arrangements or grace periods in the current reporting year that affect scoring thresholds?
  > **Answer:**

- [ ] **Q29.** Is the SED module (Diamonds & Precious Metals Acts) applicable to NPC-Cimpor? *(It is built — just confirming it should appear.)*
  - [ ] Yes — keep it
  - [ ] No — hide or remove it
  > **Answer:**

---

## Section 9 — Audit & POPIA Compliance

- [ ] **Q30.** What is the data retention policy for audit logs? *(e.g., keep all records / purge after X years)*
  > **Answer:**

- [ ] **Q31.** Is there a POPIA requirement for how employee data is stored and accessed?
  - [ ] Yes — details below
  - [ ] No
  > **Answer:**

- [ ] **Q32.** Does the audit trail need to be exportable as part of a DMR submission or internal audit pack?
  - [ ] Yes
  - [ ] No
  > **Answer:**

---

## Section 10 — Timeline & Sign-off 🔴 BLOCKING

- [ ] **Q33.** What is the hard DMR submission deadline? *(Day / Month / Year)*
  > **Answer:**

- [ ] **Q34.** Is there a UAT (user acceptance testing) period before go-live?
  - [ ] Yes — duration below
  - [ ] No
  > **Answer:**

- [ ] **Q35.** Who signs off that the XLSX export matches the DMR template exactly?
  - [ ] You (project owner)
  - [ ] The client (NPC-Cimpor)
  - [ ] A DMR consultant
  > **Answer:**

- [ ] **Q36.** Are there any features or pages not currently in the codebase that are expected at delivery?
  > **Answer:**

---

## Quick Priority Guide for lsr2025

If time is short, please prioritise these first:

| # | Question | Why it's urgent |
|---|---|---|
| Q1 | Share the DMR Excel template | Unblocks the entire export engine |
| Q6–Q13 | Supabase + hosting details | Unblocks backend deployment |
| Q33 | Hard DMR deadline | Determines build order and scope |

Thank you — I will proceed as answers come in.

---
*NotoCharter™ dev session — 2026-05-17*
