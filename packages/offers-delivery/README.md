# @proton/offers-delivery

Server-driven in-app offer delivery for Proton web applications. The backend picks one campaign via `inapp/evaluate`; the client renders it and reports events.

> **Status: POC.** An independent channel that **permanently coexists** with the legacy client-configured offers system ([`../components/containers/offers`](../components/containers/offers/README.md)) — it does not replace it. Pass keeps its own saga-based implementation untouched.
>
> - **Legacy offers** — _what plan/price to sell_. Client-decided from local configuration and eligibility checks.
> - **This package** — _what message to surface_. Backend-decided; the client only renders and reports.

Design rationale lives in [`docs/adr/`](docs/adr): [0001](docs/adr/0001-server-driven-campaign-delivery.md) the coexisting server-driven channel, [0002](docs/adr/0002-headless-composition-and-package-owned-kill-switch.md) headless composition and the package-owned kill switch, [0003](docs/adr/0003-ten-minute-revalidation-and-local-expiry-guard.md) revalidation and the local expiry guard.

## Requirements

A redux store whose thunk `extraArgument` satisfies `ProtonThunkArguments` — the slice reads `extraArgument.api` and `extraArgument.unleashClient`. Account, Mail, Calendar, Drive, Docs, Lumo and vpn-settings all already qualify.

The store must hold this package's reducer under the `offersDelivery` key (`OffersDeliveryState`). The key is fixed, not configurable: the backend resolves at most one campaign per user from one endpoint, so a second slice in the same app could only fetch the same thing twice, and a fixed key is what lets the selectors be plain functions instead of something each call site has to be handed.

## Flow

1. **Fetch** (`getCampaign`) — returns at most one already-selected `Campaign`, or nothing. Gated by the `CentralisedOffersDelivery` flag; no consuming app gates anything itself.
2. **Gate display** — surfaced until `endTime` passes. A `null` `endTime` never expires. Avoiding collision with the app's other startup UI is the consuming app's responsibility.
3. **Expose** — `useActiveOffer(variant)`, called wherever a surface lives. Render the shipped `OfferBanner` / `OfferModal`, or bespoke UI.
4. **Report** — to `inapp/campaign/event`. `Action` is an **integer** 1-5; anything else is a 400. The backend owns campaign state and telemetry; the client only emits.
5. **Resolve CTAs** — a symbolic `cta.ref` is resolved and validated to a host action **at ingest**, before it reaches a consumer.

| Action | Value | Behaviour |
| --- | --- | --- |
| `Seen` | 1 | Observability only, so a user who saw a promo without acting can see it again. Reported when the consumer's rendered root **mounts** — not when a campaign is fetched or requested. |
| `Minimized` / `Maximized` | 2 / 3 | Never emitted; `Minimizable` is dropped at ingest. Defined so a future surface only has to call the thunk. |
| `Dismissed` | 4 | **Terminal.** The backend suppresses the campaign for that user permanently; the client also hides it immediately. |
| `CtaClicked` | 5 | **Terminal**, same as `Dismissed`. Emitted before the CTA is performed, never after. |

Delivery is single-shot and best effort: `sendCampaignEvent` does not retry, and the slice swallows the failure after having already hidden the campaign locally. An undelivered `Dismissed` means the promo resurfaces.

## Architecture

| Layer | Files | Notes |
| --- | --- | --- |
| Pure logic | `lib/selection.ts` | Expiry predicate for the single campaign (`endTime`, nullable). No React/redux. Fully unit-tested. |
| Security boundary | `lib/validation.ts` | URL validation for all server content. |
| CTA resolution | `lib/cta.ts` | Resolves a raw `{ Type, Ref }` into a `ResolvedCta` (`external` / `upgrade`), then projects it into the consumer-facing `PublicCta`. The only place a raw server `ref` is read; it is never stored or forwarded. |
| API | `lib/api.ts` | `getCampaign` / `sendCampaignEvent`; normalizes and sanitizes the raw `{ Campaign, Code }` response, resolves the `MessageBody.Variant` sub-object, and calls `resolveCta`. Every `Raw*` field is a claim about untrusted JSON, so ingest drops a campaign rather than trusting a field's presence. |
| Kill switch | `components/useActiveOffer.ts`, `store/listener.ts`, `store/slice.ts` | `CommonFeatureFlag.CentralisedOffersDelivery` (`@proton/unleash/Flags`) — read only **inside this package**. `useFlag` in the hook gates the render, `unleashClient` in the listener gates the fetch, and the thunk's `miss` throws as defence in depth against a caller that dispatches it directly. |
| State | `store/slice.ts` | One module-level slice — `createSlice` + `createAsyncModelThunk` + `ModelState<Campaign>` — like every `@proton/account` slice, with an `OffersDeliveryState` interface for the structural requirement on the host store. Owns `CAMPAIGN_EXPIRY` (10 min, the revalidation throttle), the `endedCampaignKey` latch, and the SEEN dedupe. |
| Revalidation | `store/listener.ts` | `startOffersDeliveryListener(startListening, { appReady })` — fetches when the host signals readiness and on tab focus. |
| UI | `components/*` | `useActiveOffer` (per-variant hook, called anywhere: kill-switch read, selection, CTA/dismiss/seen handlers), `OfferBanner` / `OfferModal` (shipped surfaces), `OfferSurface` (shared `{ offer }` props type). No provider — nothing in this package wraps the host's tree. |

### Caching and revalidation

- Cached for **10 minutes** (`CAMPAIGN_EXPIRY`). Not persisted: `selectActiveCampaign` never trusted a value it hadn't itself revalidated, so persisting bought no faster paint, only a stale-dismissal risk on reload.
- `startOffersDeliveryListener` dispatches the fetch thunk when the host's `appReady` action lands and whenever the tab becomes visible again, letting `cacheHelper`'s expiry decide whether a request goes out — no dedicated timer, no polling loop. A backgrounded tab stops asking; a return inside the expiry window is pure local computation and never reaches the network. A listener rather than a component effect, so the fetch and the `visibilitychange` subscription exist once per store by construction rather than once per correctly-placed provider, and revalidation doesn't depend on any part of the React tree being mounted.
- The effective floor is **10-15 minutes** between real requests, and only if the tab is left and revisited at least that often: `getFetchedAt` adds 0-5 minutes of jitter to spread fleet load. Not a guaranteed cadence — a tab that stays focused for an hour revalidates once, on mount.

**The local `endTime` check is not redundant with revalidation — do not "simplify" it away.** `cacheHelper` returns the cached value _synchronously_ while the refetch lands a round-trip later, so without the check an expired campaign renders and reports a SEEN that the slice's dedupe list makes unretractable. `startTime` is deliberately **not** checked. Full argument in [ADR 0003](docs/adr/0003-ten-minute-revalidation-and-local-expiry-guard.md).

**A dismissal has to survive the response already in flight — do not delete `endedCampaignKey` either.** The optimistic hide in `endActiveCampaign` lands while a revalidation is on the wire, and that request left before the terminal event reached the backend, so its payload still carries the dismissed campaign; `handleAsyncModel`'s `fulfilled` case would otherwise write it straight back into `state.value`. The slice records the terminated `campaignKey` and `selectActiveCampaign` withholds it — a single slot, never cleared, since it only ever suppresses the exact key the user terminated. Both terminal actions are terminal server-side too, so the backend re-serving that key means either an undelivered event POST (staying hidden is what the user asked for) or a backend bug.

## Wiring

Each app supplies three things and nothing else — no app provider, no app-side routes, no app-side flag check.

- **Two registrations** — the reducer in `rootReducer`, and `startOffersDeliveryListener(startListening, { appReady })` in the app's store listener setup. `appReady` is whatever action the host dispatches once its store can make authenticated requests: `bootstrapEvent` from `@proton/account` in every Proton app today. It is passed in rather than imported so this package carries no dependency on the account package.
- **An upgrade handler** — `onUpgrade` is invoked for the `GoToUpsell` token, the only internal ref the gateway emits. It's required, since a call site that omitted it would render a CTA that reports `CtaClicked` and then does nothing. `onExternalLink` defaults to `window.open(url, '_blank', 'noopener,noreferrer')`; override it for hosts where that is unavailable. An app with more than one surface should wrap it in its own hook so the surfaces can't drift apart.
- **Placement** — a call site calls `useActiveOffer(variant, { onUpgrade })` and renders the result wherever its layout requires. There is no bound "do everything" component dictating a mount point.

Endpoints are **not** app-supplied: both live on the shared API monolith (`bundles/InAppBundle/`), not on a product's own API, so `lib/api.ts` owns them — including `silence: true` on both, without which any API error carrying a message becomes a user-facing error toast and `inapp/evaluate` 404s wherever the endpoint is not deployed yet.

```ts
// app/store/rootReducer.ts
import { offersDeliveryReducer } from '@proton/offers-delivery/store/slice';

export const rootReducer = combineReducers({ ...sharedReducers, ...offersDeliveryReducer });
```

```ts
// app/store/listener.ts
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { startOffersDeliveryListener } from '@proton/offers-delivery/store/listener';

startOffersDeliveryListener(startListening, { appReady: bootstrapEvent });
```

```ts
// app/offers/useOfferUpgrade.ts — one destination, shared by every surface
export const useOfferUpgrade = () => {
    const history = useHistory();
    return useCallback(() => history.push('/dashboard'), [history]);
};
```

```tsx
// app/offers/AppOfferTopBanner.tsx
const AppOfferTopBanner = () => {
    const onUpgrade = useOfferUpgrade();
    const offer = useActiveOffer(CampaignVariant.BANNER, { onUpgrade });
    return offer && <OfferBanner offer={offer} />;
};
```

The variant argument is required: it is what tells the package which caller intends to render, which is what keeps SEEN honest under free composition — a variant nobody asks for (e.g. `MINIMIZABLE`) simply never surfaces. An array is accepted (`CampaignVariant | CampaignVariant[]`) for a surface that renders more than one.

### Bespoke UI

Read `offer.campaign`, `offer.onAction`, `offer.onDismiss`, and attach `offer.seenRef` to whatever you render. Two things to know:

- **Rendering a real `<a href={campaign.cta.href}>`? Forward the click event to `onAction`.** It skips its own navigation when `currentTarget` is an anchor carrying an href, so cmd/middle-click and copy-link keep working. Omit the event and the link opens twice. Neither shipped surface renders an anchor, so this path has no test coverage.
- Bespoke UI opts out of the e2e coverage on the shipped `data-testid`s (`offer-banner`, `offer-banner:body`, `offer-banner:cta`, `offer-modal:cta`) and needs its own CTA/dismiss/seen tests.

### SEEN reporting

`useActiveOffer` returns a `seenRef` callback ref: attach it to the node you render and SEEN is reported the moment it mounts — "on screen", not "fetched". `reportSeen()` is an idempotent escape hatch for consumers that cannot attach a ref; `{ autoReportSeen: false }` opts out of the automatic report so a lazily-mounted or offscreen surface can own the timing.

Dedupe by `campaignKey` lives in the slice (`seenCampaignKeys`), not in a component. It has to outlive any one surface: two call sites rendering the same campaign, or one that unmounts and remounts, must not report a second impression, and SEEN is unretractable. A failed POST still counts as reported, since retrying on the next mount would double-count the impression as soon as the request succeeded.

### The modal surface

`OfferModal` accepts `OfferSurfaceProps & Partial<ModalStateProps>`. `open` defaults to `true` for standalone use; spread `useModalState()`'s `modalProps` onto it instead to register it in an app's `StartupModal` queue (`@proton/components/components/startupModals`). `onClose` reports the dismissal then calls through, and so does the CTA since `CtaClicked` is terminal. `onExit` is forwarded but never fires — both terminal actions null the slice value in the same commit, so the modal unmounts hard.

**Collision policy is the consuming app's responsibility.** `OfferModal` no longer probes the DOM itself; that was racy, since startup modals activate off async data. `StartupModals` enforces one-at-a-time plus a `domIsBusy()` guard, and priority is just position in its array — append the offer last and everything else outranks it. An offer's `showModal` flips late, on a network response, often after a populated form already reads as busy, so its `StartupModal` entry sets `retryUntilIdle: true`: `StartupModals` retries the `domIsBusy()` check every second until it's idle or the 20s startup window closes, instead of forfeiting the slot on the first busy sample. See [Reference integration](#reference-integration).

## Security

All server-controlled content is validated once, at ingest, before a consumer sees it.

- **CTAs are resolved at the trust boundary, not at render time.** `lib/cta.ts` is the only code that reads a raw `cta.ref`. `PublicCta` carries no raw `ref` at all — only a `sanitizeHttpsUrl`-validated `href`, or an opaque `kind` routed through `onAction`. Bespoke UI structurally cannot bypass the choke point; there is nothing to bypass with.
- External URLs are **https-only**, with embedded credentials rejected (`data:`, `javascript:`, `http:`, protocol-relative, `user:pass@host`).
- Image URLs additionally need a host in `PROTON_CDN_HOSTS` — today `proton.me`, `proton.black` and `proton.pink`, each including their subdomains, so the same asset works on production and on the Proton-owned test environments — so a compromised backend cannot beacon the user's IP/`Referer` to a third party via `<img src>`. An image on any other host is dropped **silently**. Both `<img>` tags also set `referrerPolicy="no-referrer"`.
- **Ingest never trusts a field's presence.** A blank or non-string `Title` or `Body` drops the campaign. A blank `CtaText` does not: it degrades to a CTA-less promo (`toPublicCta` returns `null`), which is why both shipped surfaces render the button conditionally. The server-controlled `MessageBody.Variant` is matched against known variants rather than used as a property key.
- CTA `ref`s are symbolic tokens, never paths. The gateway maps exactly one internal destination (`go_to_upsell` → `GoToUpsell` → `onUpgrade`) and returns no CTA otherwise, so `resolveCta` resolves everything else to `null`. There is deliberately **no** app-path branch — an earlier one handed any `/`-prefixed server string to `history.push`, letting the backend choose a same-origin deep link. No `dangerouslySetInnerHTML`.
- **`campaignKey` and `messageKey` are shape-checked at ingest.** Both are echoed back to `inapp/campaign/event`, so a blank, non-string or over-long (>128 character) key drops the campaign rather than being carried. There is deliberately **no** charset restriction: these values are compared and echoed, never rendered and never used as a property key, so a charset rule would buy nothing and would risk dropping keys the gateway legitimately issues. Trimming is for measuring only — the stored value is verbatim, or the echoed event would carry a key the backend never issued and silently no-op.
- **Coupon sanitization was removed as unreachable** — the gateway resolves a coupon into a signed checkout link before the service boundary, so `onUpgrade` receives `null` by contract, not by omission.

There is **no client-side pacing.** `endedCampaignKey` is not an exception to this: it is a per-key render-correctness check over one terminated campaign, not a frequency cap. Pacing, A/B selection and frequency-capping are backend-owned — though today the backend implements terminal-state suppression and deterministic priority ordering, but **not** A/B assignment or impression capping.

## Localization

Campaign `title`, `body` and CTA text arrive already localized and are deliberately **not** wrapped in `c()` — the backend, not ttag, owns this copy, and wrapping it would submit backend-owned strings to the client's translation pipeline for no benefit. The only client-owned translated string is `OfferModal`'s "Not now".

## Scope notes

`Banner` and `Modal` are implemented. **`Minimizable` is dropped at ingest** — the gateway gives it a different body entirely (`MinimizedText`, `CloseText`, `ImageAltText`, `StartMinimized`, no `Title`/`Body`/`CtaText`), so it cannot be modelled by `RawVariantBody`, and admitting it threw a `TypeError` out of ingest rather than dropping the campaign. A real minimizable surface needs its own raw type and its own `intoMessage`.

**`Modal` is not an equal peer to `Banner`.** It renders only if it wins `StartupModals`' 20s-from-mount deadline, the `domIsBusy()` gate (retried every second within that deadline via `retryUntilIdle`), and a session-wide one-shot latch — and a campaign arrives on a network response, so it is usually last.

The `Raw*` types were reconciled against the gateway (`bundles/InAppBundle/`), which fixed three mismatches that had all failed **silently**. Nothing pins that contract automatically yet, but the e2e mock no longer shares these types: `tests/account/data/offersDelivery.ts` declares the wire shape itself, derived from the campaign service's own contract (`proton-inapp-service`, `proto/proton/service/in_app/v1/in_app.proto`) and using literal wire values rather than `CampaignVariant`/`CampaignCtaType`. It can therefore disagree with ingest, which is the whole point — a mock built from these types agreed with the parser by construction and is exactly how those three shipped undetected. `RawCta`, `RawVariantBody` and `RawEvaluateResponse` are module-local as a result; only `RawCampaign` is exported, for the package's own tests.

## Reference integration

`applications/account/src/app/offers/` wires this into the account app:

- `store/rootReducer.ts` registers `offersDeliveryReducer`, and `store/listener.ts` registers `startOffersDeliveryListener(startListening, { appReady: bootstrapEvent })`.
- `offers/useOfferUpgrade.ts` — the app's `GoToUpsell` destination, shared by both surfaces.
- `AccountOfferTopBanner.tsx` — `useActiveOffer(CampaignVariant.BANNER)` + `OfferBanner`, placed inside the app's `<TopBanners>` stack so it honours the `TopBanner` flex-child layout contract.
- The modal has no standalone component. `content/AccountStartupModals.tsx` slots it into the app's own queue via a `useOfferStartupModal` hook shaped like its peers, appended **last** so every other startup modal outranks it. Its `showModal` is `offer !== null`, and it sets `retryUntilIdle: true` so `StartupModals` retries the `domIsBusy()` check itself, every second, until idle or the 20s startup window closes.

The whole thing is inert until `CentralisedOffersDelivery` is on.
