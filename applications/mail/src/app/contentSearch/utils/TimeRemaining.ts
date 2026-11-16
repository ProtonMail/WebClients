export class TimeEstimation {
    private initialAmount: number | undefined;
    constructor(private readonly startTime: number) {}

    setInitialAmountIfNotSet(processed: number) {
        if (this.initialAmount === undefined) {
            this.initialAmount = processed;
        }
    }

    remainingMinutes(now: number, processed: number, total: number) {
        const correctedProcessed = processed - (this.initialAmount ?? 0);
        const spentSoFar = now - this.startTime;
        const timePerItem = spentSoFar / correctedProcessed;
        const remainingCount = total - processed;
        const remainingMs = remainingCount * timePerItem;
        return Math.ceil(remainingMs / (1000 * 60));
    }
}
