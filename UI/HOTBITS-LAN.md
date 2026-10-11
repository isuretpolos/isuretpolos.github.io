# AetherOnePi hotbits client

Angular 22 PWA integration. Open **Collect Hotbits > Hotbits · Sources · Connect AetherOnePi**. Local camera generation and existing analysis storage remain available. Both sources feed the same IndexedDB pool; choosing a source controls refill, not the provenance of already cached entropy.

## Bridge setup

Run an AetherOnePi server implementing `/api/hotbits/v1` on the same LAN. No bridge server is included in this repository. Configure a stable LAN hostname and a TLS certificate whose Subject Alternative Name matches that hostname (or the IP address used in the QR). Either use a publicly trusted certificate for a DNS hostname resolving to the bridge, or install your private CA on each test device and explicitly enable its trust. On iOS, installing a CA profile may additionally require enabling full trust in Certificate Trust Settings. Confirm the endpoint opens without certificate errors on the device before pairing. Do not use an untrusted self-signed certificate or HTTP mixed-content workaround.

The server must allow the exact deployed PWA origin, e.g. `https://isuretpolos.github.io`, and the development origin when testing locally. Handle OPTIONS preflights and allow GET/POST plus Authorization and Content-Type headers. The client sends no cookies and rejects HTTP redirects. Remote data is not included in service-worker caches and is never uploaded to the Pages origin.

Display QR JSON:

```json
{"type":"aetherone-hotbits","protocolVersion":1,"endpoint":"https://192.168.1.20:8085/api/hotbits/v1","pairingCode":"short-lived-secret"}
```

The UI shows the complete endpoint before sending the pairing code. Check that host, particularly when the QR refers to a public hostname. Browser tokens are saved in localStorage; this is not a protected OS vault. Pairing codes are cleared after successful pairing. Disconnect deletes local credentials only; v1 specifies no revocation route.

## Transfer and recovery contract

The bridge must make allocation creation idempotent for a given authenticated client and `requestId`, retain allocation data for retries, and make ACK idempotent. A repeated POST with the same request ID must return the same allocation. These semantics are required for crash safety and do not change the v1 wire format. Allocation identifiers must be UUIDs (the client allows only letters, digits and hyphens). Download paths must exactly match `/api/hotbits/v1/allocations/<id>/data`; return application/octet-stream and a SHA-256 hex digest in allocation metadata. Never recycle allocation IDs on the same bridge.

Requests are persisted before allocation. Exact byte length and SHA-256 are checked before import. The existing database stores complete 32-bit words in little-endian order, preserving any final 1–3 bytes in IndexedDB until a later import completes a word. Only complete words count as usable local bytes. Import markers are keyed by bridge and allocation, and commit atomically with the bytes. Consumption retains the existing transactional semantics across tabs. Failed storage never sends ACK; failed ACK resumes without reimporting. Reload resumes pending ACKs before downloads for the currently paired bridge. Disconnect retains pending work and cached bytes; reconnect to the same bridge to resume. Browser storage eviction or clearing site data loses local inventory and recovery records.

Web Locks serialize refill across tabs where supported. IndexedDB still prevents duplicate imports without Web Locks. A remote import enforces the configured pool ceiling transactionally, including partial bytes. Local camera generation retains its existing behavior.

Auto refill defaults off and runs only while active, online and below the low watermark. Target, watermark, batch and ceiling are integer bytes; batch requests are capped by server inventory and maximum batch size. The absolute ceiling is 16 MB. Settings and TRNG-only selection are session settings. Retry resumes durable work. Stop, disconnect or hiding the page interrupts the transfer; an already committed import remains available. Pending ACKs are safe to retry. Background execution is best effort, not an indefinitely running PWA job.

TRNG-only avoids the existing seeded or pseudo-random fallback in analyses and broadcasting. Ordinary mode preserves previous behavior. Change mode between tasks. TRNG-only rate analysis needs the full initial draw estimate; rejection sampling and GV bonuses may need more, so exhaustion can still stop a task. Previously observed entropy is retired even when a task fails.

## Verification

Automated tests cover QR and URL rejection, exact 12,500-byte fixture import, duplicate protection, partial-byte preservation, strict-mode exhaustion, and restart after ACK failure. Run `npm --prefix UI test -- --watch=false` and `npm --prefix UI run build`. On Windows with an inaccessible sandbox temporary directory, set TEMP and TMP to a writable workspace temporary directory first.

Manual end-to-end checks still required with a real bridge and devices:

1. Open the deployed HTTPS PWA on Android on the same LAN, trust the bridge certificate, grant local-network permission if requested, scan QR and inspect the host before confirming. Also test manual paste and denied camera permission.
2. Compare remote inventory/generator state to server logs. Transfer a known 12,500-byte fixture and check local usable bytes increase exactly once.
3. Reload after request persistence, allocation, download, IndexedDB commit and ACK. Verify the server returns the same allocation for repeated request IDs, and no duplicated local import occurs.
4. Use two devices and confirm server allocations contain disjoint entropy. This guarantee belongs to the bridge.
5. Disconnect network and run analyses against cached entropy. Hide/navigate away during scanning and confirm camera indicator turns off. Stop and retry transfers.
6. Test expired tokens, disabled server, insufficient inventory, quota failure, corrupt hashes and invalid lengths.
7. Repeat on iOS/Safari. BarcodeDetector is feature-detected; unsupported browsers use manual QR JSON entry. Camera scanning is not claimed to work on every mobile browser.

Browser fetch deliberately hides the cause of many network failures. Same-network connectivity, TLS trust, CORS and local-network permission failures can all appear as the same TypeError. The UI lists those checks without claiming to distinguish them. HTTP endpoints are rejected before any request. Inspect device browser/network diagnostics and bridge logs to determine the precise cause. No Chromium-only HTTP fallback has been implemented or tested.

No real-device or two-device integration verification has been performed by the automated tests.
