import noop from '@proton/utils/noop';

import type { LeaderLock as LeaderLockInterface } from '../LeaderLock';

/** {@link LeaderLockInterface} for a tab that works alone: always acquired at once, never lost. */
export class LeaderLock implements LeaderLockInterface {
    async acquire(): Promise<boolean> {
        return true;
    }

    release(): void {}

    onLost(_listener: () => void): () => void {
        return noop;
    }
}
