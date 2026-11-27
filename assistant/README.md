# Dawrak assistant preview 0.1.1

Experimental bundled WebExtension. No API key, server, remote debugger, background service, or automatic actions. Scans visible control labels only on an HTTPS page following a user click; accepts a manually pasted command; shows an approval preview; invalidates a scan after one action. Do not use with sensitive accounts. Labels and paths may contain private data; review before copying. Keyword filtering cannot guarantee that a click or input will not change a website. User must review each action. No private browsing access. This is not yet direct ChatGPT integration.

## Build
The fork uses the upstream build workflow and a dedicated preview workflow, with resources copied into Gecko and installed through ensureBuiltIn. No global signature policy is changed. GitHub Actions must be enabled on the fork; select Dawrak assistant preview or run the branch push workflow. Download the artifact Reynard-AI-TrollStore.tipa if the build succeeds. No binary has been verified yet. The fork uses independent app and extension bundle identifiers (com.dawrak.Reynard), display name Reynard AI, and its own dawrak-reynard URL scheme. CI verifies package identifiers and display name before artifact upload. Side-by-side installation still requires an actual device test. Back up before testing. Upstream auto-update checks are intentionally disabled to avoid offering upstream packages. This fork requires manual upstream security maintenance.

## Runner recovery
The first two macos-26 ARM64 jobs (46030071271 and 46032636808) were cancelled before any job steps ran. Their logs were unavailable, so the exact cause is unconfirmed. The next attempt uses the documented macos-26-intel standard runner with Xcode 26.6, preserving the aarch64-apple-ios target. Host architecture is included in cache keys and preflight prints the SDK and disk information. CI fails immediately if any Gecko patch fails. Cross-host compatibility and the complete binary remain unverified until the build actually runs. No paid runner was provisioned.

## Test
node --test assistant/tests/guard.test.cjs

GPL-3.0-or-later for assistant files; existing project licensing remains intact. Direct OpenAI API connection requires separate authenticated service and API account, no credentials embedded in a public fork. Do not expose remote debugging.
