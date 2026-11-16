// TimeEstimation extrapolates "how much longer" from the average time spent per item so far
// (see ESAdapter, which feeds it performance.now() timestamps from reportHistoricProgress).
// Indexation can be paused and resumed, so `processed` is a count for the whole index, not for
// this run: the baseline captured by setInitialAmountIfNotSet is what keeps the elapsed time of
// this run from being divided by work a previous run did. The interesting cases are the
// degenerate ones at the edges of a run: sitting on the baseline, and everything processed.
import { TimeEstimation } from './TimeRemaining';

const MINUTE = 60 * 1000;

describe('TimeEstimation', () => {
    it('extrapolates the remaining time from the average spent per item', () => {
        const estimation = new TimeEstimation(1000);

        // 10 items in 1 minute -> 90 items left at 6s each -> 9 minutes
        expect(estimation.remainingMinutes(1000 + MINUTE, 10, 100)).toBe(9);
    });

    it('rounds partial minutes up', () => {
        const estimation = new TimeEstimation(0);

        // 1 item in 1 minute -> 1 item left -> 1 minute, so 1.5 items worth rounds to 2
        expect(estimation.remainingMinutes(MINUTE, 2, 5)).toBe(2);
    });

    it('speeds up its estimate as the run gets faster', () => {
        const estimation = new TimeEstimation(0);

        const early = estimation.remainingMinutes(10 * MINUTE, 10, 100);
        const later = estimation.remainingMinutes(11 * MINUTE, 50, 100);

        expect(early).toBe(90);
        expect(later).toBe(11);
        expect(later).toBeLessThan(early);
    });

    it('measures the pace against the baseline, not against work a previous run did', () => {
        const estimation = new TimeEstimation(0);

        // resuming at 500 of 1100: the 10 minutes elapsed bought 100 items, not 600,
        // so the 500 still outstanding are 6s each -> 50 minutes
        estimation.setInitialAmountIfNotSet(500);

        expect(estimation.remainingMinutes(10 * MINUTE, 600, 1100)).toBe(50);
    });

    it('keeps the first baseline it was given', () => {
        const estimation = new TimeEstimation(0);

        estimation.setInitialAmountIfNotSet(500);
        estimation.setInitialAmountIfNotSet(900);

        // still measured from 500, so 10 minutes / 100 items, not 10 minutes / -300
        expect(estimation.remainingMinutes(10 * MINUTE, 600, 1100)).toBe(50);
    });

    it('treats a 0 baseline as a fresh run', () => {
        const withZero = new TimeEstimation(0);
        withZero.setInitialAmountIfNotSet(0);
        const withoutBaseline = new TimeEstimation(0);

        expect(withZero.remainingMinutes(MINUTE, 10, 100)).toBe(withoutBaseline.remainingMinutes(MINUTE, 10, 100));
    });

    it('returns 0 once everything is processed', () => {
        const estimation = new TimeEstimation(0);
        estimation.setInitialAmountIfNotSet(500);

        expect(estimation.remainingMinutes(5 * MINUTE, 1100, 1100)).toBe(0);
    });

    it('reports an unknown estimate as Infinity while still sitting on the baseline', () => {
        const estimation = new TimeEstimation(0);

        // ESAdapter sets the baseline from the first progress report and estimates off the same
        // one, so no per-item average exists yet; useImporter renders a missing estimate as '∞'
        estimation.setInitialAmountIfNotSet(500);

        expect(estimation.remainingMinutes(MINUTE, 500, 1100)).toBe(Infinity);
    });

    it('reports NaN when the total is also on the baseline, so there is nothing to divide', () => {
        const estimation = new TimeEstimation(0);
        estimation.setInitialAmountIfNotSet(500);

        expect(estimation.remainingMinutes(MINUTE, 500, 500)).toBeNaN();
    });
});
