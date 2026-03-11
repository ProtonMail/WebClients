export class PerformanceTracker {
    private timings: Map<string, number> = new Map();
    private startTimes: Map<string, number> = new Map();
    private debug: boolean;

    constructor(debug: boolean) {
        this.debug = debug;
    }

    start(label: string): void {
        if (this.debug) {
            this.startTimes.set(label, performance.now());
        }
    }

    end(label: string): void {
        if (this.debug) {
            const startTime = this.startTimes.get(label);
            if (startTime !== undefined) {
                const duration = performance.now() - startTime;
                const existingDuration = this.timings.get(label) || 0;
                this.timings.set(label, existingDuration + duration);
                this.startTimes.delete(label);
            }
        }
    }

    getResults(): Record<string, string> | undefined {
        if (!this.debug) {
            return undefined;
        }

        const results: Record<string, string> = {};
        this.timings.forEach((duration, label) => {
            results[label] = `${duration.toFixed(2)}ms`;
        });
        return results;
    }
}
