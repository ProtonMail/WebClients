# @proton/telemetry-tracker

One tracker, reachable from anywhere, with type-safe event definitions owned by each consumer. No hook per measurement group.

- Entry points: `/lib/defineEvent`, `/lib/dimensions`, `/lib/timers` and `/lib/context` (define events, timers and contexts), `/lib/tracker` (`initTracker`, `tracker`), `/testing`. No barrels.
- Initialised once in the app bootstrap: `initTracker({ api })` (account: `applications/account/src/app/private-app/bootstrap.ts`).
- Sending, batching, random delay and the user opt-out are delegated to `sendTelemetryReport` (`@proton/shared/lib/helpers/metrics`). No feature flag logic here.
- Used before `initTracker`: throws outside of production, reports once to Sentry and no-ops in production.

## Targets

Each event declares where it goes with `target`:

| `target`      | Destination                                                         | Required fields          |
| ------------- | ------------------------------------------------------------------- | ------------------------ |
| `'telemetry'` | Metabase, `sendTelemetryReport` (batching, delay, opt-out)          | `group`, `event`         |
| `'analytics'` | Proton analytics, `telemetry.sendCustomEvent` from `@proton/shared` | `name`                   |
| `'both'`      | The two. A failure in one never affects the other                   | `group`, `event`, `name` |

Telemetry sends dimensions as strings (booleans become `'true'`/`'false'`). Analytics keeps typed values. `delay` only applies to Telemetry. Analytics only works when the shared `telemetry` object is initialised (user enabled Telemetry).

## Add an event

1. Declare it in the events file of your package (convention: `<package>/src/telemetry/events.ts`):

```ts
import { TelemetryAccountImportFlowEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, bool, duration, number, topValues } from '@proton/telemetry-tracker/lib/dimensions';
import { defineTimer } from '@proton/telemetry-tracker/lib/timers';

export const importTimer = defineTimer('byoeImport');

export const importCompleted = defineEvent({
    target: 'telemetry', // 'telemetry' | 'analytics' | 'both'
    group: TelemetryMeasurementGroups.accountImportFlow,
    event: TelemetryAccountImportFlowEvents.stepCompleted,
    dimensions: {
        source: allowed(['settings', 'sidebar']), // closed list (allowed_values)
        provider: topValues(), // free string (top_values)
        isBYOE: bool(), // sent as 'true' | 'false'
    },
    values: {
        itemCount: number(), // numerical value
        durationMs: duration(), // only sent when the call site passes `durationFrom`
    },
    // delay: false,   // optional: the random 1-180s delay is on by default
});
```

2. Emit it where the action happens:

```ts
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

tracker.emit(importCompleted, {
    dimensions: { source: 'settings', provider, isBYOE: true },
    values: { itemCount },
});
```

## Funnel timers

Timers are typed handles (`defineTimer`), so the editor autocompletes them and typos are impossible. A duration is **never sent automatically**: the event must declare a `duration()` value, and the call site must ask for it with `durationFrom`.

```ts
// events.ts
export const importCompleted = defineEvent({ ..., values: { durationMs: duration() } });

// where the funnel starts
tracker.startTimer(importTimer); // idempotent, pass { restart: true } to reset
// where it ends: only this emit carries durationMs
tracker.emit(importCompleted, input, { durationFrom: importTimer, stopTimer: true });
tracker.cancelTimer(importTimer); // abandoned funnel
```

If the timer was not started (or was cancelled), the value is omitted. `durationFrom` is a type error on events without a `duration()` value.

## Context dimensions and values

### Why

The tracker exists so an event can be sent from anywhere, without a hook. Some data breaks that: the plan, the account age or a setting must be on every event, and the only way to have them at the call site was a hook subscribing to the user or the subscriptions. The measurement then needed React again, and each call site had to read the value and pass it down.

Contexts split the two concerns:

- **Events say what they carry.** An event declares `plan: mailContext.dimension('plan')` once. Call sites only pass what is specific to them, so they can't forget the plan, send it inconsistently, or pass a wrong one.
- **The owner says where the value comes from.** The value is written where the data already lives (a Redux listener), once per change, not once per render and per call site.
- **The tracker stays generic.** It knows no key. Each app or package defines its own context, so one app can't read or overwrite another's values.

Values change over time (a user upgrades), so the context holds the latest value and is read at emit time, never captured when the event is defined. Until the source has loaded, the context holds a safe placeholder (`unknown`).

### How

The owner (an app or a package) declares a context once, keeps it up to date where the data lives, and events read it at emit time.

```ts
// telemetry/context.ts
export const mailContext = defineContext({ plan: 'unknown', accountAge: undefined as number | undefined });

// events file
const stepLoad = defineEvent({
    ...,
    dimensions: { step: allowed([...]), plan: mailContext.dimension('plan') },
    values: { accountAge: mailContext.value('accountAge') },
});

// anywhere, no hook
tracker.emit(stepLoad, { dimensions: { step: 'welcome' } });
```

Keep the context in sync with the source of truth in a Redux listener (`startListening`), which runs once per change and not per render: `mailContext.set({ plan, accountAge })`. Pick an initial value that is safe while the data loads (`unknown` for a dimension or `undefined` for an omitted numeric value, never a default that looks real). Dimensions accept strings and booleans; numeric values use `value()`. Non-finite numeric values are omitted. `reset()` restores the initial state (tests).

## Options

`tracker.emit(event, input, { delay, flushImmediately, durationFrom, stopTimer })`.

## Testing

```ts
import { mockTracker } from '@proton/telemetry-tracker/testing';

const { reports, restore } = mockTracker(); // reports are recorded instead of sent
afterEach(restore);
```
