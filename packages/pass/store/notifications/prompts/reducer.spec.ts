import { promptDismissed } from './actions';
import reducer from './reducer';

describe('prompts reducer', () => {
    test('records a first dismissal for an unknown prompt', () => {
        const next = reducer({}, promptDismissed('offline-onpage', 1000));
        expect(next).toEqual({ 'offline-onpage': { count: 1, lastDismissedAt: 1000 } });
    });

    test('increments the count and updates the timestamp on subsequent dismissals', () => {
        const next = reducer({ 'offline-onpage': { count: 1, lastDismissedAt: 1000 } }, promptDismissed('offline-onpage', 2000));
        expect(next).toEqual({ 'offline-onpage': { count: 2, lastDismissedAt: 2000 } });
    });

    test('keeps ledger entries isolated per prompt id', () => {
        const next = reducer({ 'offline-banner': { count: 1, lastDismissedAt: 500 } }, promptDismissed('offline-onpage', 1000));
        expect(next).toEqual({
            'offline-banner': { count: 1, lastDismissedAt: 500 },
            'offline-onpage': { count: 1, lastDismissedAt: 1000 },
        });
    });

    test('ignores unrelated actions', () => {
        const state = { 'offline-onpage': { count: 1, lastDismissedAt: 1000 } };
        expect(reducer(state, { type: 'unrelated' })).toBe(state);
    });
});
