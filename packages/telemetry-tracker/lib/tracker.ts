import type { TelemetryReport } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { traceError } from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces';
import { telemetry } from '@proton/shared/lib/telemetry';

import type { EmitArgs, EventDefinition } from './defineEvent';
import type { ValuesSpec } from './dimensions';
import type { TimerHandle } from './timers';
import { Timers } from './timers';

export interface TrackerDeps {
    api: Api;
}

interface InternalDeps extends TrackerDeps {
    /** Test seam: replaces the actual sending */
    send?: (report: TelemetryReport & { delay: boolean; flushImmediately: boolean }) => void;
    /** Test seam: replaces the actual sending to Proton analytics */
    sendAnalytics?: (name: string, data: Record<string, string | number | boolean>) => void;
}

interface EmitInputShape {
    dimensions?: Record<string, string | boolean | undefined>;
    values?: Record<string, number | undefined>;
}

interface ResolvedEvent {
    dimensions: Record<string, string | boolean>;
    values: Record<string, number>;
}

/**
 * Turns an event definition + input into dimensions and values. Undefined entries are dropped.
 * Serialisation is up to each target: Telemetry sends booleans as 'true' | 'false', analytics keeps them.
 */
const resolveEvent = (
    event: EventDefinition,
    input: EmitInputShape | undefined,
    durationMs: number | undefined
): ResolvedEvent => {
    const dimensions: Record<string, string | boolean> = {};
    for (const key of Object.keys(event.dimensions)) {
        const value = input?.dimensions?.[key];
        if (value !== undefined) {
            dimensions[key] = value;
        }
    }

    const values: Record<string, number> = {};
    for (const [key, spec] of Object.entries(event.values as ValuesSpec)) {
        const value = spec.kind === 'duration' ? durationMs : input?.values?.[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
            values[key] = value;
        }
    }

    return { dimensions, values };
};

export class Tracker {
    private timers = new Timers();

    constructor(private deps: InternalDeps) {}

    emit<E extends EventDefinition>(event: E, ...[input, options]: EmitArgs<E>) {
        // Telemetry must never break a user action
        this.catchErrors(() => {
            const durationMs = options?.durationFrom ? this.timers.elapsed(options.durationFrom) : undefined;
            const resolved = resolveEvent(event, input as EmitInputShape | undefined, durationMs);
            const flushImmediately = options?.flushImmediately ?? false;

            if (options?.stopTimer && options.durationFrom) {
                this.timers.cancel(options.durationFrom);
            }

            // One failing target must not affect the other
            if (event.target !== 'analytics') {
                this.catchErrors(() =>
                    this.sendToTelemetry(event, resolved, options?.delay ?? event.delay, flushImmediately)
                );
            }
            if (event.target !== 'telemetry') {
                this.catchErrors(() => this.sendToAnalytics(event, resolved));
            }
        });
    }

    startTimer(timer: TimerHandle, options?: { restart?: boolean }) {
        this.catchErrors(() => this.timers.start(timer, options));
    }

    cancelTimer(timer: TimerHandle) {
        this.timers.cancel(timer);
    }

    /** Reports the error to Sentry instead of throwing it */
    private catchErrors(fn: () => void) {
        try {
            fn();
        } catch (error) {
            traceError(error);
        }
    }

    private sendToTelemetry(
        event: EventDefinition,
        { dimensions, values }: ResolvedEvent,
        delay: boolean,
        flushImmediately: boolean
    ) {
        if (!event.group || !event.event) {
            return;
        }
        // Telemetry only accepts string dimensions: booleans become 'true' | 'false'
        const stringDimensions: Record<string, string> = {};
        for (const [key, value] of Object.entries(dimensions)) {
            stringDimensions[key] = String(value);
        }

        const report = {
            measurementGroup: event.group,
            event: event.event,
            dimensions: stringDimensions,
            values,
            delay,
            flushImmediately,
        };
        if (this.deps.send) {
            this.deps.send(report);
        } else {
            void sendTelemetryReport({ api: this.deps.api, ...report });
        }
    }

    private sendToAnalytics(event: EventDefinition, { dimensions, values }: ResolvedEvent) {
        if (!event.name) {
            return;
        }
        const data = { ...dimensions, ...values };
        if (this.deps.sendAnalytics) {
            this.deps.sendAnalytics(event.name, data);
        } else {
            telemetry.sendCustomEvent(event.name, data);
        }
    }
}

let instance: Tracker | undefined;
export const NOT_INITIALIZED_MESSAGE = 'Telemetry tracker used before initTracker()';

const getInstance = () => {
    if (instance) {
        return instance;
    }

    if (process.env.NODE_ENV !== 'production') {
        throw new Error(NOT_INITIALIZED_MESSAGE);
    }

    return undefined;
};

/** Call once in the application bootstrap. Calling it again replaces the instance. */
export const initTracker = (deps: TrackerDeps) => {
    instance = new Tracker(deps);
};

/** @internal used by the testing entry */
export const setTrackerInstance = (next: Tracker | undefined) => {
    instance = next;
};

/** Reachable from anywhere (React or not). Throws before init outside of production. */
export const tracker = {
    emit<E extends EventDefinition>(event: E, ...args: EmitArgs<E>) {
        getInstance()?.emit(event, ...args);
    },
    startTimer(timer: TimerHandle, options?: { restart?: boolean }) {
        getInstance()?.startTimer(timer, options);
    },
    cancelTimer(timer: TimerHandle) {
        getInstance()?.cancelTimer(timer);
    },
};
