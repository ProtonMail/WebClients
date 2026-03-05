import { INTERVAL_EVENT_TIMER } from '@proton/shared/lib/constants';
import { getTimeoutIntervalsFromUnleash } from '@proton/shared/lib/eventManager/getTimeoutIntervalsFromUnleash';
import type { UnleashClient } from '@proton/unleash/UnleashClient';
import { CommonFeatureFlag } from '@proton/unleash/UnleashFeatureFlags';

const MIN = INTERVAL_EVENT_TIMER;
const MAX = INTERVAL_EVENT_TIMER * 10;

const createClient = ({ enabled = true, payload }: { enabled?: boolean; payload?: unknown }): UnleashClient => {
    return {
        isEnabled: (flag: unknown) => {
            expect(flag).toBe(CommonFeatureFlag.EventLoopInterval);
            return enabled;
        },
        getVariant: () => ({
            name: '',
            enabled: true,
            payload: payload !== undefined ? { type: '', value: JSON.stringify(payload) } : undefined,
        }),
    } as unknown as UnleashClient;
};

describe('getTimeoutIntervalsFromUnleash', () => {
    it('returns default values when client is undefined', () => {
        const result = getTimeoutIntervalsFromUnleash(undefined as any);

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });

    it('returns default values when flag is disabled', () => {
        const result = getTimeoutIntervalsFromUnleash(createClient({ enabled: false }));

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });

    it('returns clamped values when payload is valid', () => {
        const result = getTimeoutIntervalsFromUnleash(
            createClient({
                payload: { foreground: MIN + 10, background: MIN + 20 },
            })
        );

        expect(result).toEqual({ foreground: MIN + 10, background: MIN + 20 });
    });

    it('clamps values below minimum', () => {
        const result = getTimeoutIntervalsFromUnleash(
            createClient({
                payload: { foreground: 1, background: 5 },
            })
        );

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });

    it('clamps values above maximum', () => {
        const result = getTimeoutIntervalsFromUnleash(
            createClient({
                payload: { foreground: MAX + 1000, background: MAX + 5000 },
            })
        );

        expect(result).toEqual({ foreground: MAX, background: MAX });
    });

    it('returns default values when payload contains invalid numbers', () => {
        const result = getTimeoutIntervalsFromUnleash(
            createClient({
                payload: { foreground: 'not-a-number', background: null },
            })
        );

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });

    it('returns default values when JSON parsing throws', () => {
        const brokenClient = () => ({
            isEnabled: () => true,
            getVariant: () => ({
                payload: { value: '{invalid json' },
            }),
        });

        const result = getTimeoutIntervalsFromUnleash(brokenClient as any);

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });
});
