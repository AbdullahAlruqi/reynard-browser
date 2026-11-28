# Reynard AI 0.2 — private gateway (staging)

This is an optional single-owner gateway, not a connection to an existing ChatGPT conversation. It does not provide autonomous computer use. The iOS app must still be tested on a real device. The original installation and Dawrak Water production backend are not changed.

Requirements: Node.js 22+, a private deployment with HTTPS termination, and an OpenAI API project with a suitable Responses API model and billing/credits. Set secrets only in the host's environment:
- OPENAI_API_KEY: API key (never in the app or repository).
- OPENAI_MODEL: model supporting strict structured outputs.
- BRIDGE_TOKEN: random 32+ character pairing secret; generate using openssl rand -hex 32.
- BRIDGE_SITE_ORIGINS: comma-separated exact HTTPS origins; e.g. https://dawrak-water.netlify.app (only if authorized).
- BRIDGE_DAILY_LIMIT: 30 by default; process-local cap, resets on restart; enforce spending limits at the API project too.
- HOST: 127.0.0.1 by default; configure to match trusted reverse proxy.
- PORT: 8080 by default.

Run node assistant/bridge/server.cjs behind HTTPS, with rate limiting and request-size limits at the proxy. Set the extension gateway URL to https://YOUR-HOST/v1/plan and enter the pairing secret. The code is not a deployment. Never put the OpenAI key in the extension. No credentials, page field values, cookies, browser history, or private tabs are deliberately collected. A page's labels/headings may still contain private data: inspect the actual preview and avoid sensitive sites. A user gesture requests optional access only to the configured gateway origin and revokes it after each request; engine support for this on iOS needs testing. A separate approval is required for each proposed click/fill; the local guard rejects expired/stale or protected actions but heuristics cannot guarantee a website action is harmless. No automatic background actions or cross-site navigation. Read-only summaries are based on headings/controls, not the full page. The operator can rescan and request the next step.

Tests: node --test assistant/tests/guard.test.cjs assistant/bridge/server.test.cjs. The tests use mock model responses, not a real API key. A live private deployment and on-device end-to-end test are release gates.

CI release gate: the preview branch runs resource, identity, local guard, popup consent and mock gateway checks before the macOS build. A successful package build is not an on-device or live API acceptance test.
