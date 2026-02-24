/**
 * Implementation of the transfer speed metrics for both uploads and downloads.
 * Reports every minute while transfers are ongoing or when the last file completes.
 * Paused time is not counted as active time.
 * Provide reporter function that reports to the metrics service:
 *  * drive_upload_speed_histogram
 *  * drive_download_speed_histogram metrics
 */

const ONE_MINUTE_MS = 60_000;
const BYTES_PER_KIB = 1024;

export type TransferSpeedMetricsReporter = (values: {
    kibibytesPerSecond: number;
    activeSeconds: number;
    kibibytesTransferred: number;
}) => void;

export class TransferSpeedMetrics {
    // key: transfer id, value: transferred bytes
    private transfers = new Map<string, number>();
    private kibibytesTransferred = 0;

    private accumulatedActiveSeconds = 0;
    private lastResumeTimestamp: number | null = null;
    private minuteTimerId: ReturnType<typeof setTimeout> | null = null;

    constructor(private report: TransferSpeedMetricsReporter) {}

    onFileStarted(transferId: string): void {
        const wasEmpty = this.transfers.size === 0;
        this.transfers.set(transferId, 0);

        if (wasEmpty) {
            this.scheduleMinuteTimer();
        }
    }

    onFileProgress(transferId: string, transferredBytes: number, isPaused: boolean): void {
        if (!this.transfers.has(transferId)) {
            return;
        }

        const previous = this.transfers.get(transferId) ?? 0;
        const deltaBytes = Math.max(0, transferredBytes - previous);
        this.transfers.set(transferId, transferredBytes);
        this.kibibytesTransferred += deltaBytes / BYTES_PER_KIB;

        if (isPaused) {
            this.pauseStopwatch();
            return;
        }

        this.resumeStopwatch();
    }

    onFileEnded(transferId: string): void {
        this.transfers.delete(transferId);

        if (this.transfers.size === 0) {
            this.reportAndReset();
            this.cancelMinuteTimer();
        }
    }

    dispose(): void {
        this.cancelMinuteTimer();
    }

    private startStopwatch(): void {
        this.accumulatedActiveSeconds = 0;
        this.lastResumeTimestamp = Date.now();
    }

    private pauseStopwatch(): void {
        if (this.lastResumeTimestamp !== null) {
            this.accumulatedActiveSeconds += (Date.now() - this.lastResumeTimestamp) / 1000;
            this.lastResumeTimestamp = null;
        }
    }

    private resumeStopwatch(): void {
        if (this.lastResumeTimestamp === null) {
            this.lastResumeTimestamp = Date.now();
        }
    }

    private scheduleMinuteTimer(): void {
        this.startStopwatch();
        this.cancelMinuteTimer();
        this.minuteTimerId = setTimeout(() => {
            this.minuteTimerId = null;
            this.reportAndReset();
            if (this.transfers.size > 0) {
                this.scheduleMinuteTimer();
            }
        }, ONE_MINUTE_MS);
        const timer = this.minuteTimerId as NodeJS.Timeout | null;
        if (timer?.unref) {
            timer.unref();
        }
    }

    private cancelMinuteTimer(): void {
        if (this.minuteTimerId !== null) {
            clearTimeout(this.minuteTimerId);
            this.minuteTimerId = null;
        }
    }

    private reportAndReset(): void {
        const activeSeconds = this.getActiveSeconds();
        if (activeSeconds > 0 && this.kibibytesTransferred > 0) {
            const kibibytesPerSecond = this.kibibytesTransferred / activeSeconds;
            this.report({
                kibibytesPerSecond,
                kibibytesTransferred: this.kibibytesTransferred,
                activeSeconds,
            });
        }

        this.kibibytesTransferred = 0;
        this.accumulatedActiveSeconds = 0;
        this.lastResumeTimestamp = null;
    }

    private getActiveSeconds(): number {
        let seconds = this.accumulatedActiveSeconds;
        if (this.lastResumeTimestamp !== null) {
            seconds += (Date.now() - this.lastResumeTimestamp) / 1000;
        }
        return seconds;
    }
}
