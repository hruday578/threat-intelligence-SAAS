# AertEM Company-Aware Threat Intelligence & Deduplication Handoff

## 1. Executive Summary

The complete company-aware threat intelligence pipeline and conservative deduplication model have been implemented, tested, and integrated directly into the existing AertEM architecture. The implementation preserves all existing UI designs, database models, and workflows while augmenting the intelligence ingestion and classification pipeline with AI-driven threat modeling, search planning, conservative deduplication, per-article classification, and multi-publisher event corroboration.

---

## 2. Pipeline Workflow & Architecture

The system executes the end-to-end intelligence cycle without requiring separate applications:

```
[Company Domain Input]
        │
        ▼
[Public Domain Context & AI Threat Suggestion]
        │ (Taxonomy 2.0: Cyber, Physical, Supply Chain, Geo, Regulatory)
        ▼
[Independent User Review & Selection]
        │ (Company Threats, Facility Location Threats, Critical Vendor Threats)
        ▼
[Unified Search Planner]
        │ (Compiles targeted Event Registry / NewsAPI.ai queries with keyword + concept caps)
        ▼
[News Ingestion via Event Registry]
        │ (Lang inside $query.$and, simple keyword search mode)
        ▼
[AertEM Conservative Deduplication Model]
        │ (Pre-LLM: Canonical URLs, text body hashing; Near-dupes ≥0.82 flagged for review)
        ▼
[Batch/Independent LLM Classification via /api/ai-proxy]
        │ (Prompt-injection security directives, untrusted user data tagging)
        ▼
[Event Correlation & Multi-Publisher Corroboration]
        │ (Correlates articles into timelines, distinguishes independent coverage)
        ▼
[Interactive Presentation in Sources & Intel Ledger]
        │ (Badges: Dedup counts, Review Candidates, Corroboration level)
        ▼
[Persisted to Supabase / Local Storage Audit Log]
```

---

## 3. Component & Service Inventory

### Services (`src/services/`)
- [`threatTaxonomy.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/services/threatTaxonomy.js): Versioned 2.0 taxonomy covering Cybersecurity, Physical Security, Supply Chain, Geopolitical, and Regulatory domains with severity weights and concept mapping.
- [`threatRecommendations.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/services/threatRecommendations.js): Domain validation, identity context extraction (brand name, inferred industry type), and LLM prompt builder for contextual threat modeling.
- [`searchPlanner.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/services/searchPlanner.js): Deterministic search compiler that partitions accepted company, location, and vendor threats into targeted query bundles with full provenance tracking.
- [`deduplication.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/services/deduplication.js): Colab POC implementation featuring URL canonicalization, exact text body hashing, and conservative near-duplicate detection (≥0.82 threshold preserved for analyst review).
- [`articleClassifier.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/services/articleClassifier.js): Independent per-article LLM classification with strict prompt-injection defenses.
- [`eventCorrelation.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/services/eventCorrelation.js): Incident correlation engine linking multi-source coverage into cohesive event timelines.
- [`newsIngestion.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/services/newsIngestion.js): Event Registry payload generator conforming strictly to Event Registry API rules (`getArticles`, `$query.$and`).

### Frontend UI Integration
- [`App.jsx`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/App.jsx):
  - Ingestion pipeline wired to `handleExecute`
  - Deduplication statistics banner in the Intel Ledger header
  - Live visual badges: `Review Candidate`, `+N dups`, `✓ Corroborated`, `✓ High Corroboration`
  - Integration with `/api/news-proxy` and `/api/ai-proxy`
- [`RiskAssessmentPage.jsx`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/src/RiskAssessmentPage.jsx):
  - Company domain validation badge
  - "✨ Generate AI Threat Suggestions" for company, facility locations, and vendors
  - Card-based accept/reject selection interface preserving domain independence

### Test Suites (`scripts/`)
- [`test-deduplication.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/scripts/test-deduplication.js): 29 unit and integration tests for URL normalization, hash pruning, near-duplicate preservation, and payload format.
- [`test-company-aware.js`](file:///c:/Users/MY%20PC/.gemini/antigravity/scratch/scripts/test-company-aware.js): 44 integration tests verifying end-to-end domain extraction, suggestion schemas, search planner provenance, prompt injection guards, and event correlation.

---

## 4. Verification & Test Results

| Test Suite | Tests Run | Passed | Failed | Status |
| :--- | :---: | :---: | :---: | :---: |
| Deduplication & API Safety (`scripts/test-deduplication.js`) | 29 | 29 | 0 | **PASSED** ✅ |
| Company-Aware Pipeline Integration (`scripts/test-company-aware.js`) | 44 | 44 | 0 | **PASSED** ✅ |
| Production Build Verification (`npm run build`) | 125 modules | 125 | 0 | **PASSED** ✅ |

---

## 5. Environment & Configuration Guide

To execute queries against Event Registry and run LLM classification:

1. **Event Registry / NewsAPI.ai Key**:
   Set `VITE_NEWSAPI_KEY` or `NEWSAPI_AI_KEY` in `.env`:
   ```env
   VITE_NEWSAPI_KEY=your_eventregistry_key_here
   ```
2. **AI Provider Key**:
   Configured directly in the AertEM header UI or via `GROQ_API_KEY`, `OPENROUTER_API_KEY`, or `DEEPSEEK_API_KEY` for `/api/ai-proxy`.
3. **Start Development Server**:
   ```powershell
   npm run dev
   ```
