# Test Guide

Interactive manual-testing guides for the features you build — no database, no backend, no auth. Git + YAML is the source of truth.

## What is Test Guide?

When you ship a feature, testers need to know how to test it. Today that usually means a wiki page, a Jira comment, or a Slack message that goes stale the moment the UI changes.

Test Guide lets you describe how to test a feature once, as a YAML file committed alongside your code. Testers open a URL, click **Start Test**, and get an interactive, step-by-step guide rendered *inside the application itself* — highlighting the exact element to interact with at every step.

```
Developer builds feature
        ↓
Developer writes guides/releases/<release>/<TICKET>.yaml
        ↓
test-guide validate
        ↓
Commit → PR → Merge → CI builds guides → Deploy
        ↓
Copy the guide URL into the release notes
        ↓
Tester opens the URL, clicks Start Test
        ↓
The application opens with the guide running inside it
```

There is no database and no backend service for guide storage. Guides are YAML files in this repo; releases are just directories.

## Quick start

```bash
pnpm install
pnpm dev
```

This starts:

- the **viewer** at http://localhost:5173
- the **demo application** (a small demo bank) at http://localhost:3001

Open a guide:

```
http://localhost:5173/g/2026.08.26/PAY-1245
```

Click **Start Test** — the demo app opens with the guide running inside it.

## Architecture

```
                 Test Guide
                     │
          ┌──────────┴──────────┐
          │                     │
     Viewer App             SDK Package
     React + Vite          Pure TypeScript
   (describes a guide)   (runs inside the app under test)
          │                     │
          │              ┌──────┼──────┐
          │              │      │      │
          │           Angular React   Vue / Svelte / plain HTML
          │              │      │      │
          └──────────────┴──────┴──────┘
```

- **Viewer** (`apps/viewer`) is the tester-facing page that describes a guide (title, release, step count) and links to the application with a **Start Test** button. It never touches the application's DOM.
- **SDK** (`packages/sdk`) is a zero-dependency-on-frameworks TypeScript package that runs *inside* the application under test. It reads `?testGuide=&release=` from the URL, loads the guide, and drives the tester through it with a self-contained DOM overlay.
- The viewer and the application under test may be on different origins — the viewer only ever opens the application's URL; it never reaches into a cross-origin iframe. The SDK must be installed inside the target application itself.

Guides are plain YAML committed to Git:

```
guides/
└── releases/
    └── 2026.08.26/
        ├── PAY-1245.yaml
        ├── PAY-1261.yaml
        └── PAY-1278.yaml
```

A guide's URL — `/g/<release>/<TICKET>` — uniquely and immutably identifies that guide version. There's no "latest" alias in the MVP.

## Repository structure

```
apps/
  viewer/            React + Vite viewer (tester-facing guide page)
  demo-app/           React demo banking app with the SDK installed
  angular-fixture/    Minimal Angular app proving SDK framework independence
packages/
  sdk/                @test-guide/sdk — pure TypeScript, runs inside the app under test
  guide-schema/       @test-guide/guide-schema — Zod schema + types for guides
  cli/                @test-guide/cli — validate / build / preview
guides/
  releases/<release>/<TICKET>.yaml
tests/                Playwright end-to-end tests
```

## Create a guide

```yaml
id: PAY-1245
title: Create a Payment
application: demo-bank
release: 2026.08.26

start:
  url: http://localhost:3001/payments/new

steps:
  - id: amount
    target:
      label: Amount
    action: input
    value: "1000"
    autoAdvance: true
    instruction: "Enter 1000 into the amount field."

  - id: beneficiary
    target:
      text: "Beneficiary"
    action: click
    instruction: "Select the beneficiary."

  - id: submit
    target:
      role: button
      name: "Submit Payment"
    action: click
    instruction: "Submit the payment."

  - id: success
    target:
      text: "Payment successful"
    action: verify
    instruction: "Verify that the payment was successful."
```

Supported actions: `click`, `input`, `select`, `verify`, `navigate`, `wait`. Set `autoAdvance: true` on an `input`, `select`, or `click` step to continue as soon as its required value or action is completed. Guides are declarative — the SDK never executes guide content as code.

## Install the SDK

```bash
npm install @test-guide/sdk
```

The smallest integration, run once at app startup:

```ts
import { TestGuide } from "@test-guide/sdk";

TestGuide.init();
```

That's it. `init()` is a no-op unless the page was opened with `?testGuide=<id>&release=<release>` (or you pass `guideUrl` explicitly), so it has negligible overhead when no guide is active. The SDK has no dependency on React, Angular, Vue, or Svelte — it works against the raw DOM.

## Target elements

The SDK resolves a step's target against the live DOM, without requiring you to sprinkle `data-guide-*` attributes across your components. Strategies are tried in priority order until one matches:

| Strategy | Example | Notes |
|---|---|---|
| `testId` | `target: { testId: submit-payment }` | Matches `[data-testid="..."]` |
| `role` + `name` | `target: { role: button, name: Submit Payment }` | Matches by ARIA role and accessible name |
| `label` | `target: { label: Amount }` | Matches an associated `<label>` |
| `text` | `target: { text: Beneficiary }` | Matches visible text content |
| `selector` | `target: { selector: "#submit-payment" }` | Raw CSS selector, last resort |

A single target can combine strategies as fallbacks (e.g. `testId` + `selector`); the resolver tries them in the order above. If nothing matches within 10 seconds, the SDK shows a **Target Not Found** error with diagnostics instead of silently skipping the step.

## Releases

Releases are directories, not database rows:

```
guides/releases/<release>/<TICKET>.yaml
```

A guide's URL (`/g/<release>/<TICKET>`) is immutable — release + ticket uniquely identifies that guide version.

## Framework compatibility

The SDK is pure TypeScript with zero framework dependencies. It works identically in:

- **React** — see `apps/demo-app`
- **Angular** — see `apps/angular-fixture` (same `@test-guide/sdk` package, no Angular-specific code)
- **Vue**, **Svelte**, **plain HTML/JS** — the SDK only touches `document`/`window`; the plain global build (`dist/index.global.js`) can be dropped in with a `<script>` tag

SPA route changes (React Router, Vue Router, Angular Router, or anything else) are detected generically by wrapping `history.pushState`/`replaceState` and listening for `popstate` — no framework-specific router integration is required.

## CLI

```bash
npm install -g @test-guide/cli   # or use it from the workspace directly
```

```bash
test-guide validate   # validates every YAML guide under guides/releases/
test-guide build       # converts YAML guides into static JSON under dist/releases/
test-guide preview     # starts a local viewer server for manual testing
```

`validate` output:

```
✓ PAY-1245.yaml
✓ PAY-1261.yaml
✓ PAY-1278.yaml

3 guides valid.
```

Errors point at the exact file, step, and field:

```
✗ PAY-9999.yaml

steps[0].target:
Target is required.
```

## Testing

```bash
pnpm test        # Vitest unit tests (schema, target resolution, DOM watcher, ...)
pnpm test:e2e    # Playwright end-to-end tests
```

## What's intentionally not built (MVP scope)

Per the product spec, the following are out of scope for this MVP but the schema/architecture doesn't prevent adding them later: browser recording, AI-generated guides, Jira/Azure DevOps/GitHub integrations, test result storage, screenshots, analytics, authentication, and cloud hosting.
