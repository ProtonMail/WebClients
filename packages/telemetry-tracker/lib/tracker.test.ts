import { TelemetryBringYourOwnEmailEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import * as sentry from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces';
import { telemetry } from '@proton/shared/lib/telemetry';

import { allowed, bool, defineEvent, defineTimer, duration, number, topValues } from '../events';
import { mockTracker } from '../testing';
import { initTracker, tracker } from '../tracker';
import { NOT_INITIALIZED_MESSAGE, setTrackerInstance } from './tracker';

jest.mock('@proton/shared/lib/helpers/metrics', () => ({ sendTelemetryReport: jest.fn() }));
jest.mock('@proton/shared/lib/telemetry', () => ({ telemetry: { sendCustomEvent: jest.fn() } }));
jest.mock('@proton/shared/lib/helpers/sentry', () => ({ captureMessage: jest.fn(), traceError: jest.fn() }));

const group = TelemetryMeasurementGroups.bringYourOwnEmail;
const event = TelemetryBringYourOwnEmailEvents.claim_proton_address;

const simpleEvent = defineEvent({
    target: 'telemetry',
    group,
    event,
    dimensions: {
        source: allowed(['settings', 'sidebar']),
        provider: topValues(),
        isBYOE: bool(),
    },
    values: { count: number() },
});

const funnelTimer = defineTimer('funnel');
const funnelEvent = defineEvent({
    target: 'telemetry',
    group,
    event,
    dimensions: { step: allowed(['done']) },
    values: { durationMs: duration() },
});
const noInputEvent = defineEvent({ target: 'telemetry', group, event });

const api = jest.fn() as unknown as Api;

describe('tracker', () => {
    afterEach(() => {
        setTrackerInstance(undefined);
        jest.useRealTimers();
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('before init', () => {
        it('throws outside of production', () => {
            expect(() => tracker.emit(noInputEvent)).toThrow(NOT_INITIALIZED_MESSAGE);
            expect(() => tracker.startTimer(funnelTimer)).toThrow(NOT_INITIALIZED_MESSAGE);
        });

        it('does nothing in production', () => {
            const env = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            try {
                expect(() => tracker.emit(noInputEvent)).not.toThrow();
                expect(() => tracker.emit(noInputEvent)).not.toThrow();
                expect(sendTelemetryReport).not.toHaveBeenCalled();
            } finally {
                process.env.NODE_ENV = env;
            }
        });
    });

    describe('emit', () => {
        it('serialises booleans as strings, keeps values numeric, delays by default', () => {
            initTracker({ api });
            tracker.emit(simpleEvent, {
                dimensions: { source: 'settings', provider: 'gmail', isBYOE: true },
                values: { count: 3 },
            });

            expect(sendTelemetryReport).toHaveBeenCalledWith({
                api,
                measurementGroup: group,
                event,
                dimensions: { source: 'settings', provider: 'gmail', isBYOE: 'true' },
                values: { count: 3 },
                delay: true,
                flushImmediately: false,
            });
        });

        it('sends false as the string "false"', () => {
            const { reports, restore } = mockTracker();
            tracker.emit(simpleEvent, {
                dimensions: { source: 'sidebar', provider: 'x', isBYOE: false },
                values: { count: 0 },
            });
            expect(reports[0].dimensions?.isBYOE).toBe('false');
            restore();
        });

        it('allows overriding the delay per event and per call', () => {
            const { reports } = mockTracker();
            const noDelay = defineEvent({ target: 'telemetry', group, event, delay: false });
            tracker.emit(noDelay);
            tracker.emit(noDelay, undefined, { delay: true });
            expect(reports.map((r) => r.delay)).toEqual([false, true]);
        });

        it('never throws when sending fails', () => {
            initTracker({ api });
            (sendTelemetryReport as jest.Mock).mockImplementationOnce(() => {
                throw new Error('boom');
            });
            expect(() => tracker.emit(noInputEvent)).not.toThrow();
            expect(sentry.traceError).toHaveBeenCalled();
        });
    });

    describe('targets', () => {
        const analyticsOnly = defineEvent({
            target: 'analytics',
            name: 'test.analytics',
            dimensions: { isBYOE: bool() },
            values: { count: number() },
        });
        const both = defineEvent({
            target: 'both',
            group,
            event,
            name: 'test.both',
            dimensions: { isBYOE: bool() },
        });
        const input = { dimensions: { isBYOE: true }, values: { count: 2 } };

        it('routes an analytics event to Proton analytics only, keeping typed values', () => {
            initTracker({ api });
            tracker.emit(analyticsOnly, input);
            expect(telemetry.sendCustomEvent).toHaveBeenCalledWith('test.analytics', { isBYOE: true, count: 2 });
            expect(sendTelemetryReport).not.toHaveBeenCalled();
        });

        it('routes a telemetry event to Telemetry only', () => {
            initTracker({ api });
            tracker.emit(noInputEvent);
            expect(sendTelemetryReport).toHaveBeenCalledTimes(1);
            expect(telemetry.sendCustomEvent).not.toHaveBeenCalled();
        });

        it('routes a "both" event to the two, each with its own serialisation', () => {
            initTracker({ api });
            tracker.emit(both, { dimensions: { isBYOE: true } });
            expect(sendTelemetryReport).toHaveBeenCalledWith(
                expect.objectContaining({ dimensions: { isBYOE: 'true' }, event })
            );
            expect(telemetry.sendCustomEvent).toHaveBeenCalledWith('test.both', { isBYOE: true });
        });

        it('still sends to analytics when Telemetry throws', () => {
            initTracker({ api });
            (sendTelemetryReport as jest.Mock).mockImplementationOnce(() => {
                throw new Error('boom');
            });
            tracker.emit(both, { dimensions: { isBYOE: false } });
            expect(telemetry.sendCustomEvent).toHaveBeenCalled();
            expect(sentry.traceError).toHaveBeenCalled();
        });

        it('records both targets with mockTracker', () => {
            const { reports, analyticsEvents, restore } = mockTracker();
            tracker.emit(both, { dimensions: { isBYOE: true } });
            expect(reports).toHaveLength(1);
            expect(analyticsEvents).toEqual([{ name: 'test.both', data: { isBYOE: true } }]);
            restore();
        });

        it('requires the fields of the chosen target', () => {
            // @ts-expect-error telemetry needs group and event
            defineEvent({ target: 'telemetry' });
            // @ts-expect-error analytics needs a name
            defineEvent({ target: 'analytics' });
            // @ts-expect-error both needs group, event and name
            defineEvent({ target: 'both', name: 'x' });
        });
    });

    describe('types', () => {
        it('rejects invalid input at compile time', () => {
            const { restore } = mockTracker();
            const ok = { source: 'settings', provider: 'x', isBYOE: true } as const;
            const values = { count: 1 };
            // @ts-expect-error source not in the allowed list
            tracker.emit(simpleEvent, { dimensions: { ...ok, source: 'nope' }, values });
            // @ts-expect-error boolean dimension must be a boolean
            tracker.emit(simpleEvent, { dimensions: { ...ok, isBYOE: 'true' }, values });
            // @ts-expect-error input is required when the event has dimensions
            tracker.emit(simpleEvent);
            restore();
        });
    });

    describe('timers', () => {
        const input = { dimensions: { step: 'done' } } as const;

        it('adds a rounded duration only when durationFrom is passed', () => {
            jest.spyOn(performance, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(3400.4);
            const { reports } = mockTracker();

            tracker.startTimer(funnelTimer);
            tracker.emit(funnelEvent, input);
            tracker.emit(funnelEvent, input, { durationFrom: funnelTimer });

            expect(reports.map((r) => r.values)).toEqual([{}, { durationMs: 2400 }]);
        });

        it('omits the duration when the timer was never started, and when cancelled', () => {
            const { reports } = mockTracker();
            tracker.emit(funnelEvent, input, { durationFrom: funnelTimer });
            tracker.startTimer(funnelTimer);
            tracker.cancelTimer(funnelTimer);
            tracker.emit(funnelEvent, input, { durationFrom: funnelTimer });
            expect(reports.map((r) => r.values)).toEqual([{}, {}]);
        });

        it('keeps the original start unless restarted, and stopTimer removes it', () => {
            const now = jest.spyOn(performance, 'now');
            const { reports } = mockTracker();
            now.mockReturnValueOnce(0);
            tracker.startTimer(funnelTimer);
            tracker.startTimer(funnelTimer); // idempotent, does not read the clock again
            now.mockReturnValueOnce(100);
            tracker.emit(funnelEvent, input, { durationFrom: funnelTimer, stopTimer: true });
            tracker.emit(funnelEvent, input, { durationFrom: funnelTimer });
            expect(reports.map((r) => r.values)).toEqual([{ durationMs: 100 }, {}]);
        });

        it('only accepts durationFrom on events with a duration value', () => {
            const { restore } = mockTracker();
            const simple = {
                dimensions: { source: 'settings', provider: 'x', isBYOE: true },
                values: { count: 1 },
            } as const;
            // @ts-expect-error simpleEvent has no duration() value
            tracker.emit(simpleEvent, simple, { durationFrom: funnelTimer });
            // @ts-expect-error duration values cannot be passed manually
            tracker.emit(funnelEvent, { ...input, values: { durationMs: 5 } });
            restore();
        });
    });
});
