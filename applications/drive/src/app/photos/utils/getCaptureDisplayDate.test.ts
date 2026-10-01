import { getCaptureDisplayDate } from './getCaptureDisplayDate';

describe('getCaptureDisplayDate', () => {
    const captureTime = new Date('2026-09-19T16:22:16Z');

    it('should keep the wall-clock time of a claimed capture time with offset', () => {
        const date = getCaptureDisplayDate('2026-09-19T18:22:16.000+02:00', captureTime);

        expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([
            2026, 8, 19, 18, 22,
        ]);
    });

    it('should keep the wall-clock time of a claimed capture time with Z different from captureTime', () => {
        const date = getCaptureDisplayDate('2026-09-19T18:22:16.000Z', captureTime);

        expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([18, 22, 16]);
    });

    it('should fall back to captureTime when the claimed capture time with Z is the same instant', () => {
        expect(getCaptureDisplayDate('2026-09-19T16:22:16.000Z', captureTime)).toBe(captureTime);
    });

    it('should fall back to captureTime without claimed capture time', () => {
        expect(getCaptureDisplayDate(undefined, captureTime)).toBe(captureTime);
        expect(getCaptureDisplayDate('invalid', captureTime)).toBe(captureTime);
    });
});
