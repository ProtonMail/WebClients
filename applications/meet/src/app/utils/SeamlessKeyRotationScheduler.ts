import type { ProtonMeetKeyProvider } from './ProtonMeetKeyProvider';

export class KeyRotationScheduler {
    private timer: ReturnType<typeof setTimeout> | null = null;

    constructor(private keyProvider: ProtonMeetKeyProvider) {}

    async schedule(key: string, epoch: bigint, delayMs = 3000) {
        const previousKey = this.keyProvider.getCurrentKey();
        const previousEpoch = this.keyProvider.getCurrentEpoch();

        /// set the key so it will be used for decryption immediately
        await this.keyProvider.setKeyWithEpoch(key, epoch);

        this.keyProvider.setCurrentKey(key);
        this.keyProvider.setCurrentEpoch(epoch);

        if (previousKey && previousEpoch) {
            /// rotate the previous key immediately so we still use previous key to encrypt before the timer executes
            await this.rotate(previousKey, previousEpoch);
        }

        if (this.timer !== null) {
            clearTimeout(this.timer);
        }

        /// start new timer for new key
        this.timer = setTimeout(async () => {
            /// use new key after timeout so we will use latest key to encrypt
            await this.rotate(key, epoch);
            this.timer = null;
        }, delayMs);
    }

    clean() {
        if (this.timer !== null) {
            clearTimeout(this.timer);
        }

        this.keyProvider.cleanCurrent();
    }

    /// rotate the key
    /// this is a workaround since we didn't find setKeyIndex method in the key provider for js
    /// so we use setKeyWithEpoch method to rotate the key (it will update the key index when calling it)
    private async rotate(key: string, epoch: bigint) {
        await this.keyProvider.setKeyWithEpoch(key, epoch);
    }
}
