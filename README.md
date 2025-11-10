# 🧭 Nauta — Order Management App

Nauta is a lightweight order management app built with **Next.js + React + TailwindCSS** and **React Query**.  
It includes a local mock backend and supports optimistic updates, filters, pagination, and tests.

---

## 🚀 Features

- Orders table with filters (status, provider), pagination, and ETA sorting.
- Inline status updates with optimistic UI and rollback on error.
- URL-synced filters (`status`, `provider`, `page`).
- Loading skeletons and empty state view.
- ETA highlighting: Overdue and Soon (≤72h).
- Order details modal (GET /orders/:id).
- Local mock with latency and error simulation.
- Vitest tests for list/empty and mutation error handling.

---

## 🧱 Tech Stack

- **Next.js 14** (App Router) + **React 18**
- **@tanstack/react-query**
- **TailwindCSS**
- **Vitest** + **@testing-library/react**

---

## ⚙️ Setup

```bash
npm install
npx tailwindcss init -p
npm run dev
npm run test
```

Optional environment variables:

```bash
# .env.local
NEXT_PUBLIC_MOCK_DELAY_MS=500
NEXT_PUBLIC_MOCK_ERROR_RATE=0.15
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🧩 Structure

```
src/
  app/
    (orders)/
      OrdersTable.tsx
      OrderDetailModal.tsx
      orders.api.ts
    globals.css
  components/ui/
  lib/
    types.ts
    transitions.ts
    eta.ts
  tests/
    OrdersTable.test.tsx
    OrdersTable.error.test.tsx
    renderWithQueryClient.tsx
```

---

## 🔄 React Query

- `queryKey`: `['orders', { status, provider, page, limit, sort, order }]`
- `staleTime`: 30s to reduce refetches
- Optimistic update on `patchStatus`:
  - `onMutate`: snapshot + local update
  - `onError`: rollback + inline alert
  - `onSettled`: invalidate queries and clear alert

---

## 🧪 Tests

- ✅ List + empty state
- ❌ Mutation error (rollback + alert)
- Mocked `@/app/(orders)/orders.api` directly, no MSW needed.

---

## ♿ Accessibility

- `aria-label` on filters
- `role="status"` for alerts
- `data-testid` on skeleton rows

---

## 🧠 Decisions

- Local mock instead of MSW → fewer dependencies
- Inline alert instead of toast lib
- Simple modal without portal
- One-page table focusing on core UX

---

## ✅ Done

- Table + filters + pagination
- Optimistic updates with rollback
- URL sync + details modal
- ETA highlighting + tests

## ⏭️ Next

- Focus trap in modal
- Real backend integration
- Bulk actions + CSV export

---

## 🧠 Prompts & AI usage

For transparency, this project was **AI-assisted**. I used **ChatGPT (GPT-5)** as a development assistant to accelerate the project, while maintaining full control and understanding of the final implementation.

### Prompts used
- *"Build a complete React/Next.js orders table with filters, pagination, and optimistic updates using React Query."*
- *"Add URL synchronization for filters and pagination."*
- *"Generate Vitest tests for this table including an optimistic update error case."*
- *"Refactor code for accessibility and add English inline comments only for developers."*
- *"Review the challenge requirements and list which points are covered or missing."*

### How AI was used
- Used for generating initial scaffolding: base component, mock API, and test skeletons.
- Adapted all output to the **Next.js 14 App Router** structure, and updated patterns to **React Query v5**.
- Reworked filters, pagination, optimistic mutation, and accessibility logic by hand.
- Debugged ESM/CJS issues, fixed `next/navigation` mocks, and validated all tests manually.

### My personal work
- Designed the local mock layer manually with latency/error knobs instead of MSW.
- Chose inline alert feedback instead of an external toast library.
- Implemented filter synchronization via query params.
- Added detailed error recovery, optimistic rollback, and accessibility improvements.
- Wrote and maintained all Vitest test cases, including mutation error handling.

### Transparency statement
> This project was **AI-assisted, not AI-generated**. I used ChatGPT to boost productivity and explore approaches, but every part of the implementation was reviewed, refactored, and adapted manually. The architecture, design decisions, and final code reflect my own understanding and engineering judgment.

---
