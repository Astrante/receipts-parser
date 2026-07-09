# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Web app for scanning QR codes on **Serbian fiscal receipts** (the `suf.purs.gov.rs` system), parsing them into structured data, storing them in the browser, and **splitting a receipt's items between multiple buyers**. UI strings are bilingual (Russian + English). Comments are mostly in Russian.

## Commands

There are **three separate npm packages** (root, `frontend/`, `backend/`) — each needs its own `npm install`.

```bash
# Local dev (run in two terminals):
npm run frontend          # Vite dev server → http://localhost:5173
npm run backend:dev       # Express proxy with nodemon → http://localhost:3001

# Single-process shortcuts (from root):
npm run dev               # backend only, with nodemon
npm run backend           # backend, no reload
npm run frontend:build    # build the Vite app

# Tests (Vitest, from root — runs both suites):
npm test                  # frontend + backend, one shot
# Inside frontend/ or backend/:
npm run test              # that package only
npm run test:watch        # watch mode

# Inside frontend/:
npm run dev               # dev server (proxies /api → localhost:3001, see vite.config.js)
npm run build             # production build → frontend/dist
npm run lint              # ESLint (currently clean; keep it that way)

# Production build for Vercel:
npm run vercel-build      # cd frontend && npm install && npm run build
```

CI (`.github/workflows/ci.yml`) runs install → lint → build → test on push/PR to `main`.

## Deployment shape (Vercel)

Production runs entirely on Vercel. `vercel.json` builds `frontend/`, serves static assets from `frontend/dist`, and rewrites `/api/*` to serverless functions. So in production there is **no separate Express backend** — the frontend calls same-origin `/api/receipts/parse`, handled by `api/receipts/parse.js`.

## The parser — one canonical module (important)

Receipt parsing scrapes `suf.purs.gov.rs`. There is now a **single** parser: `backend/src/services/receiptParser.js`, imported by **both** runtimes:
- `api/receipts/parse.js` (Vercel serverless) — thin handler (CORS + HTTP), imports `parseReceiptFromURL`.
- `backend/src/proxy/receiptProxy.js` (local Express proxy) — same.

Flow inside `parseReceiptFromURL(url)`:
1. Extract the `vl` query param from the QR URL.
2. `GET https://suf.purs.gov.rs/v/?vl=...` with browser-like headers, then extract `viewModel.InvoiceNumber('...')`, `viewModel.Token('...')`, store name (`shopFullNameLabel`, HTML-entity decoded), and date (`sdcDateTimeLabel`).
3. `POST https://suf.purs.gov.rs/specifications` with `invoiceNumber` + `token` (form-encoded).
4. Map each item into a Product. Unit is inferred as `KG` if the name contains `/KG/`, else `KOM`.

The scraping is split into **pure, unit-tested helpers** — `extractInvoiceAndToken`, `extractStoreName`, `extractDate`, `buildReceipt` (see `backend/src/services/receiptParser.test.js`). `parseReceiptFromURL` **throws** typed errors (`URL is required`, `Invalid receipt URL`, `Failed to fetch receipt page`, `Failed to parse receipt data from HTML`, `Failed to fetch receipt specifications`, `Invalid receipt data format`); the handler maps the known ones to HTTP 400, else 500.

When changing parsing behavior, edit `backend/src/services/receiptParser.js` — it takes effect in **both** dev and prod. (`.vercelignore` no longer drops `backend/src`, so the module ships to Vercel.)

## Frontend architecture (clean / layered)

```
src/
├── core/                      # framework-agnostic logic
│   ├── domain/                # entity FACTORIES, not classes: createReceipt / createProduct / createBuyer
│   │                          # + pure logic: calculateBuyerShare (Buyer), getUnitPrice & reconcileDistribution (Product),
│   │                          #   calculateReceiptTotal (Receipt); constants (tax rates, units)
│   ├── services/              # ReceiptParserService (→ apiClient), QRScannerService (html5-qrcode), apiClient
│   ├── repositories/          # ReceiptRepository, BuyerRepository — localStorage via StorageAdapter
│   └── utils/                 # number (parseAmount), uuid, format (formatDateTime/formatNumber/formatMoney),
│                              #   errors (getUserFriendlyError), receiptShare (base64 /shared/:data, JSON import/export)
├── presentation/
│   ├── components/            # React UI by feature (ReceiptList, ReceiptDetail, SplitReceipt, SharedReceipt,
│   │   └── shared/            #   Scan/AddByLink/Import sheets) + shared/ (BottomSheet, DropdownMenu, Spinner, ConfirmDialog)
│   └── hooks/                 # useReceiptSplit, useAddReceipt (see below)
└── store/receiptStore.js      # Zustand store
```

**`apiClient` request routing** (`core/services/apiClient.js`): driven by `VITE_BACKEND_URL` — set it → that base URL; unset + dev → `http://localhost:3001`; unset + prod → same-origin `/api`. It also branches on whether the base already ends in `/api`. When touching API calls, respect this rather than hardcoding a URL.

**Split model:** each `Product` carries a `distribution: { buyerId: quantityShare }` map whose shares must sum to `product.quantity`. A buyer's share (`calculateBuyerShare` in `domain/Buyer.js`) = Σ over products of `distribution[buyerId] * (product.total / product.quantity)`. After any change, run the map through `reconcileDistribution` (`domain/Product.js`) — it forces Σ shares = quantity exactly (first buyer absorbs the residual) and kills float drift. All split UI logic lives in the **`useReceiptSplit(id)`** hook (addBuyer, updateDistribution, handleBlur, handleInputChange, removeBuyer, temp-input state) — consumed by both `ReceiptDetail` and `SplitReceipt`. The **`useAddReceipt()`** hook centralizes the parse/import → `addReceipt` flow (`addFromUrl`, `addFromJsonFile`) for the scan/add-by-link/import sheets.

**Date (de)serialization:** `StorageAdapter` uses a custom JSON reviver that turns any string property ending in `Date`/`At` or named `date`/`createdAt` back into a `Date`. Keep new date-like properties named to match, or they'll persist as strings.

### Receipt storage — single source of truth

`ReceiptRepository` (localStorage key `receipts`) is the **only** persistence layer; every store action writes through it and state is initialized from it on store creation. A one-time migration reads the legacy Zustand-`persist` key (`receipt-storage`) if the canonical key is empty, imports it, then deletes it. **Always mutate receipts via the store actions** (`addReceipt` / `update*` / `deleteReceipt`), never via the repository directly. (The store no longer holds `activeReceipt`/`error`/`isLoading` — components derive what they need from `receipts`.)

## Conventions

- **Money:** use `formatMoney(amount)` (RSD, Serbian locale → `1.234,56 RSD`) or `formatNumber(amount)` (plain `1.234,56`) from `core/utils/format.js`. Don't use `.toFixed(2)` directly.
- **IDs:** use `uuid()` from `core/utils/uuid.js` (has a fallback for non-secure/HTTP contexts where `crypto.randomUUID` is unavailable).
- **Numeric input from users:** parse with `parseAmount` (`core/utils/number.js`) — it accepts both `.` and `,` as the decimal separator (iOS shows the locale separator). Quantity inputs use `inputMode="decimal"`.
- **Styling:** Tailwind with a custom palette in `tailwind.config.js` — `forest`, `beige`, `terracotta`, `slate`, `charcoal`, `darkSlate` — use these tokens (and arbitrary values like `text-[11px]`) rather than inline `style={{}}`. Plus `slide-in-up` / `fade-in-scale` keyframe animations.

## Ignore

`.sfdx/` is Salesforce CLI tooling metadata — unrelated to this app; it's gitignored and excluded from Vercel uploads.
