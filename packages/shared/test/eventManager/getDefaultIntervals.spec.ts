import { INTERVAL_EVENT_TIMER } from '@proton/shared/lib/constants';
import { getDefaultIntervals } from '@proton/shared/lib/eventManager/getDefaultIntervals';
import type UnleashClient from '@proton/unleash/UnleashClient';
import { CommonFeatureFlag } from '@proton/unleash/UnleashFeatureFlags';

const MIN = INTERVAL_EVENT_TIMER;
const MAX = INTERVAL_EVENT_TIMER * 10;

const createClient = ({ enabled = true, payload }: { enabled?: boolean; payload?: unknown }) => {
    return (): UnleashClient =>
        ({
            isEnabled: (flag: unknown) => {
                expect(flag).toBe(CommonFeatureFlag.EventLoopInterval);
                return enabled;
            },
            getVariant: () => ({
                name: '',
                enabled: true,
                payload: payload !== undefined ? { type: '', value: JSON.stringify(payload) } : undefined,
            }),
        }) as unknown as UnleashClient;
};

describe('getDefaultIntervals', () => {
    it('returns default values when client is undefined', () => {
        const result = getDefaultIntervals(() => undefined as any);

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });

    it('returns default values when flag is disabled', () => {
        const result = getDefaultIntervals(createClient({ enabled: false }));

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });

    it('returns clamped values when payload is valid', () => {
        const result = getDefaultIntervals(
            createClient({
                payload: { foreground: MIN + 10, background: MIN + 20 },
            })
        );

        expect(result).toEqual({ foreground: MIN + 10, background: MIN + 20 });
    });

    it('clamps values below minimum', () => {
        const result = getDefaultIntervals(
            createClient({
                payload: { foreground: 1, background: 5 },
            })
        );

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });

    it('clamps values above maximum', () => {
        const result = getDefaultIntervals(
            createClient({
                payload: { foreground: MAX + 1000, background: MAX + 5000 },
            })
        );

        expect(result).toEqual({ foreground: MAX, background: MAX });
    });

    it('returns default values when payload contains invalid numbers', () => {
        const result = getDefaultIntervals(
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

        const result = getDefaultIntervals(brokenClient as any);

        expect(result).toEqual({ foreground: MIN, background: MIN });
    });
});
