import { PerformanceTracker } from './performanceTracker';

describe('PerformanceTracker', () => {
    it('should not track when debug is false', () => {
        const tracker = new PerformanceTracker(false);
        tracker.start('test');
        tracker.end('test');

        expect(tracker.getResults()).toBeUndefined();
    });

    it('should track single timing', () => {
        const tracker = new PerformanceTracker(true);
        tracker.start('test');
        tracker.end('test');

        const results = tracker.getResults();
        expect(results).toBeDefined();
        expect(results?.test).toMatch(/^\d+\.\d{2}ms$/);
    });

    it('should accumulate multiple timings with same label', () => {
        const tracker = new PerformanceTracker(true);

        tracker.start('operation');
        tracker.end('operation');

        tracker.start('operation');
        tracker.end('operation');

        const results = tracker.getResults();
        expect(results?.operation).toBeDefined();
    });

    it('should track multiple different operations', () => {
        const tracker = new PerformanceTracker(true);

        tracker.start('decode');
        tracker.end('decode');

        tracker.start('encode');
        tracker.end('encode');

        const results = tracker.getResults();
        expect(results?.decode).toBeDefined();
        expect(results?.encode).toBeDefined();
    });

    it('should handle end without start gracefully', () => {
        const tracker = new PerformanceTracker(true);
        tracker.end('nonexistent');

        const results = tracker.getResults();
        expect(results?.nonexistent).toBeUndefined();
    });
});
