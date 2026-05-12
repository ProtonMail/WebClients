import type { ProtonMeetKeyProvider } from './ProtonMeetKeyProvider';

type PendingRotation = {
    key: string;
    epoch: bigint;
    generation: number;
    firstPendingAt: number;
    switchAt: number;
    heldKey: string;
    heldEpoch: bigint;
};

export class KeyRotationScheduler {
    private timer: ReturnType<typeof setTimeout> | null = null;
    private pendingRotation: PendingRotation | null = null;
    private generation = 0;

    constructor(private keyProvider: ProtonMeetKeyProvider) {}

    async schedule(key: string, epoch: bigint, delayMs = 3000, maxHoldMs = 5000) {
        const now = performance.now();
        const heldKey = this.pendingRotation?.heldKey ?? this.keyProvider.getCurrentKey();
        const heldEpoch = this.pendingRotation?.heldEpoch ?? this.keyProvider.getCurrentEpoch();

        /// set the key so it will be used for decryption immediately
        await this.keyProvider.setKeyWithEpoch(key, epoch);

        this.keyProvider.setCurrentKey(key);
        this.keyProvider.setCurrentEpoch(epoch);

        if (!heldKey || heldEpoch === undefined) {
            this.clearTimer();
            this.pendingRotation = null;
            return;
        }

        /// rotate the held key immediately so we still use it to encrypt before the timer executes
        await this.rotate(heldKey, heldEpoch);

        const firstPendingAt = this.pendingRotation?.firstPendingAt ?? now;
        const generation = this.generation + 1;

        this.generation = generation;
        this.pendingRotation = {
            key,
            epoch,
            generation,
            firstPendingAt,
            switchAt: Math.min(now + delayMs, firstPendingAt + maxHoldMs),
            heldKey,
            heldEpoch,
        };

        this.scheduleTimer();
    }

    clean() {
        this.clearTimer();
        this.pendingRotation = null;
        this.generation += 1;

        this.keyProvider.cleanCurrent();
    }

    /// rotate the key
    /// this is a workaround since we didn't find setKeyIndex method in the key provider for js
    /// so we use setKeyWithEpoch method to rotate the key (it will update the key index when calling it)
    private async rotate(key: string, epoch: bigint) {
        await this.keyProvider.setKeyWithEpoch(key, epoch);
    }

    private clearTimer() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private scheduleTimer() {
        const pendingRotation = this.pendingRotation;

        if (!pendingRotation) {
            return;
        }

        this.clearTimer();

        const delayMs = Math.max(0, pendingRotation.switchAt - performance.now());

        this.timer = setTimeout(async () => {
            const latestPendingRotation = this.pendingRotation;

            if (!latestPendingRotation || latestPendingRotation.generation !== pendingRotation.generation) {
                return;
            }

            const remainingDelayMs = latestPendingRotation.switchAt - performance.now();

            if (remainingDelayMs > 0) {
                this.scheduleTimer();
                return;
            }

            /// use the latest pending key after timeout so we will use latest key to encrypt
            await this.rotate(latestPendingRotation.key, latestPendingRotation.epoch);
            this.keyProvider.setCurrentKey(latestPendingRotation.key);
            this.keyProvider.setCurrentEpoch(latestPendingRotation.epoch);
            this.pendingRotation = null;
            this.timer = null;
        }, delayMs);
    }
}
