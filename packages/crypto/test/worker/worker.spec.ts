import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CryptoProxy, updateServerTime } from '../../lib';
import { CryptoWorkerPool as CryptoWorker } from '../../lib/worker/workerPool';
import { runApiTests } from './apiTests';

describe('Worker API and Worker Pool Integration (behind CryptoProxy)', () => {
    beforeAll(async () => {
        await CryptoWorker.init({ poolSize: 1 });
        CryptoProxy.setEndpoint(CryptoWorker, () => CryptoWorker.clearKeyStore());

        // set server time in the future to spot functions that use local time unexpectedly
        const HOUR = 3600 * 1000;
        updateServerTime(new Date(Date.now() + HOUR));
    });

    afterEach(async () => {
        await CryptoWorker.clearKeyStore();
    });

    afterAll(async () => {
        await CryptoProxy.releaseEndpoint();
        await CryptoWorker.destroy();
    });

    it('init - should throw if already initialised', async () => {
        await expect(CryptoWorker.init()).rejects.toThrow(/already initialised/);
    });

    runApiTests(CryptoProxy);
});
