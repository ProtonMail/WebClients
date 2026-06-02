import { TransferSpeedMetrics } from './transferSpeedMetrics';

const ONE_MINUTE_MS = 60_000;

function advanceActiveTime(ms: number = 1000) {
    jest.advanceTimersByTime(ms);
}

describe('TransferSpeedMetrics', () => {
    let metrics: TransferSpeedMetrics;
    let reportMock: jest.Mock;

    beforeEach(() => {
        jest.useFakeTimers();
        reportMock = jest.fn();
        metrics = new TransferSpeedMetrics(reportMock);
    });

    afterEach(() => {
        metrics?.dispose();
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('should schedule minute timer when first file starts', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileProgress('transfer-1', 1024, false);
        advanceActiveTime(ONE_MINUTE_MS);

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                kibibytesTransferred: 1,
                kibibytesPerSecond: 1 / 60, // 1 KiB over 60 seconds
                activeSeconds: 60,
            })
        );
    });

    it('should keep the same timer when second file starts while one is transferring', () => {
        metrics.onFileStarted('transfer-1');
        advanceActiveTime(ONE_MINUTE_MS / 2);
        metrics.onFileProgress('transfer-1', 1024, false);
        metrics.onFileStarted('transfer-2');
        advanceActiveTime(ONE_MINUTE_MS / 2);

        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should accumulate transferred bytes as kibibytes', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileProgress('transfer-1', 2048, false); // 2 KiB
        metrics.onFileProgress('transfer-1', 4096, false); // +2 KiB
        advanceActiveTime();
        metrics.onFileEnded('transfer-1');

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                kibibytesTransferred: 4,
            })
        );
    });

    it('should only count delta from previous progress (no double count)', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileProgress('transfer-1', 1024, false);
        metrics.onFileProgress('transfer-1', 1024, false); // same value, delta 0
        metrics.onFileProgress('transfer-1', 2048, false); // delta 1 KiB
        advanceActiveTime();
        metrics.onFileEnded('transfer-1');

        expect(reportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                kibibytesTransferred: 2, // 1 + 1 KiB
                activeSeconds: 1,
            })
        );
    });

    it('should clamp negative deltas to zero', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileProgress('transfer-1', 2048, false);
        metrics.onFileProgress('transfer-1', 1024, false); // would be negative delta
        advanceActiveTime();
        metrics.onFileEnded('transfer-1');

        expect(reportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                kibibytesTransferred: 2, // only first 2 KiB
                activeSeconds: 1,
            })
        );
    });

    it('should not report when one of multiple files ends', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileStarted('transfer-2');
        metrics.onFileProgress('transfer-1', 1024, false);
        metrics.onFileEnded('transfer-1');

        expect(reportMock).not.toHaveBeenCalled();
    });

    it('should report when all files ends', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileStarted('transfer-2');
        metrics.onFileProgress('transfer-1', 1024, false);
        metrics.onFileProgress('transfer-2', 2048, false);
        advanceActiveTime();
        metrics.onFileEnded('transfer-1');
        expect(reportMock).not.toHaveBeenCalled();

        metrics.onFileEnded('transfer-2');
        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                kibibytesTransferred: 3, // 1 + 2 KiB
            })
        );
    });

    it('should cancel minute timer when last file ends', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileProgress('transfer-1', 1024, false);
        advanceActiveTime();
        metrics.onFileEnded('transfer-1');

        advanceActiveTime(ONE_MINUTE_MS * 2);

        expect(reportMock).toHaveBeenCalledTimes(1);
    });

    it('should report every minute while transfers are ongoing', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileProgress('transfer-1', 1024, false);

        advanceActiveTime(ONE_MINUTE_MS);
        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                kibibytesPerSecond: 1 / 60, // 1 KiB over 60 seconds
                activeSeconds: 60,
                kibibytesTransferred: 1,
            })
        );

        metrics.onFileProgress('transfer-1', 2048, false); // +1 KiB in second window (delta from 1024)
        advanceActiveTime(ONE_MINUTE_MS);
        expect(reportMock).toHaveBeenCalledTimes(2);
        expect(reportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                kibibytesPerSecond: 1 / 60, // 1 KiB over 60 seconds in second window
                activeSeconds: 60,
                kibibytesTransferred: 1,
            })
        );
    });

    it('should exclude paused time from active seconds', () => {
        metrics.onFileStarted('transfer-1');
        metrics.onFileProgress('transfer-1', 1024, false);
        advanceActiveTime(1000);
        metrics.onFileProgress('transfer-1', 2048, true); // pause
        advanceActiveTime(5000); // 5s paused - should not count
        metrics.onFileProgress('transfer-1', 3072, false); // resume
        advanceActiveTime(1000);
        metrics.onFileEnded('transfer-1');

        expect(reportMock).toHaveBeenCalledTimes(1);
        expect(reportMock).toHaveBeenCalledWith(
            expect.objectContaining({
                kibibytesPerSecond: 3 / 2, // 3 KiB over 2 active seconds
                activeSeconds: 2,
                kibibytesTransferred: 3,
            })
        );
    });
});
