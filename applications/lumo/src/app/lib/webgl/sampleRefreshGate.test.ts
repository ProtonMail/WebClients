import { createSampleRefreshGate } from './sampleRefreshGate';

describe('createSampleRefreshGate', () => {
    it('refreshes on the first call', () => {
        const gate = createSampleRefreshGate(125);
        expect(gate.shouldRefresh(0)).toBe(true);
    });

    it('skips until the interval elapses, then refreshes', () => {
        const gate = createSampleRefreshGate(125);
        expect(gate.shouldRefresh(1000)).toBe(true);
        expect(gate.shouldRefresh(1100)).toBe(false); // 100ms < 125ms
        expect(gate.shouldRefresh(1130)).toBe(true); // 130ms >= 125ms
    });

    it('reset() forces the next call to refresh', () => {
        const gate = createSampleRefreshGate(125);
        gate.shouldRefresh(0);
        gate.reset();
        expect(gate.shouldRefresh(10)).toBe(true);
    });
});
