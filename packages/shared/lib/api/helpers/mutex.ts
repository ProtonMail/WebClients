import { create as createMutex } from '@protontech/mutex-browser';

import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { wait } from '../../helpers/promise';

const noopUnlock = () => Promise.resolve();

export interface CrossTabMutexOptions {
    /**
     * Max time in ms before the lock expires. The locked section can't take longer than this,
     * otherwise another context is allowed to take over the lock.
     */
    expiry?: number;
}

/**
 * Creates a mutex shared between all contexts (tabs) of the same origin, backed by
 * IndexedDB with a cookie fallback.
 *
 * The returned function acquires the lock for a given name and resolves with a function
 * that releases it. If the lock can't be acquired at all (e.g. no storage access), it falls
 * back to a random wait so that concurrent contexts get spread out instead of racing.
 *
 * Note: locks with different names are independent, so acquiring one while holding another
 * won't dead-lock, but acquiring the same name twice in the same context will.
 */
export const createCrossTabMutex = ({ expiry = 15000 }: CrossTabMutexOptions = {}) => {
    const mutex = createMutex({ expiry });

    return async (name: string): Promise<() => Promise<void>> => {
        try {
            await mutex.lock(name);
            return () => {
                return mutex.unlock(name).catch(noop);
            };
        } catch (e) {
            // If getting the mutex fails, fall back to a random wait
            await wait(randomIntFromInterval(100, 2000));
            return noopUnlock;
        }
    };
};
