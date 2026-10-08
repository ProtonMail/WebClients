# @proton/telemetry-tracker

One tracker, reachable from anywhere, with type-safe event definitions owned by each consumer. No hook per measurement group.

- Entry points: `/events` (define events and timers), `/tracker` (`initTracker`, `tracker`), `/testing`. No catch-all barrel.
- Initialised once in the app bootstrap: `initTracker({ api })` (account: `applications/account/src/app/content/bootstrap.ts`).
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
import { TelemetryBringYourOwnEmailEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { allowed, bool, defineEvent, defineTimer, duration, number, topValues } from '@proton/telemetry-tracker/events';

export const importTimer = defineTimer('byoeImport');

export const importCompleted = defineEvent({
    target: 'telemetry', // 'telemetry' | 'analytics' | 'both'
    group: TelemetryMeasurementGroups.bringYourOwnEmail,
    event: TelemetryBringYourOwnEmailEvents.claim_proton_address,
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
import { tracker } from '@proton/telemetry-tracker/tracker';

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

## Options

`tracker.emit(event, input, { delay, flushImmediately, durationFrom, stopTimer })`.

## Testing

```ts
import { mockTracker } from '@proton/telemetry-tracker/testing';

const { reports, restore } = mockTracker(); // reports are recorded instead of sent
afterEach(restore);
```
