import { INTERVAL_EVENT_TIMER } from '../../lib/constants';
import { parseTimeoutIntervals } from '../../lib/eventManager/parseTimeoutIntervals';

const MIN = INTERVAL_EVENT_TIMER;
const MAX = INTERVAL_EVENT_TIMER * 60;

describe('parseTimeoutIntervals', () => {
    it('returns undefined without a payload', () => {
        expect(parseTimeoutIntervals(undefined, MAX)).toBeUndefined();
        expect(parseTimeoutIntervals('', MAX)).toBeUndefined();
    });

    it('returns undefined for invalid JSON', () => {
        expect(parseTimeoutIntervals('{invalid json', MAX)).toBeUndefined();
        expect(parseTimeoutIntervals('null', MAX)).toBeUndefined();
    });

    it('returns undefined for invalid numbers', () => {
        expect(parseTimeoutIntervals(JSON.stringify({ foreground: '60000', background: 60_000 }), MAX)).toBeUndefined();
        expect(parseTimeoutIntervals(JSON.stringify({ foreground: 60_000 }), MAX)).toBeUndefined();
    });

    it('returns undefined when background is shorter than foreground', () => {
        expect(parseTimeoutIntervals(JSON.stringify({ foreground: 120_000, background: 60_000 }), MAX)).toBeUndefined();
    });

    it('returns the intervals clamped between the classic interval and the max', () => {
        expect(parseTimeoutIntervals(JSON.stringify({ foreground: 120_000, background: 600_000 }), MAX)).toEqual({
            foreground: 120_000,
            background: 600_000,
        });
        expect(parseTimeoutIntervals(JSON.stringify({ foreground: 1, background: MAX * 2 }), MAX)).toEqual({
            foreground: MIN,
            background: MAX,
        });
    });
});
