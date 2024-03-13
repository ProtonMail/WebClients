import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { CryptoProxy, updateServerTime } from '../../lib';
import { CryptoWorkerPool as CryptoWorker } from '../../lib/worker/workerPool';
import { runApiTests } from './apiTests';

chaiUse(chaiAsPromised);

describe('Worker API and Worker Pool Integration (behind CryptoProxy)', () => {
    const runTests = (v6Canary: boolean) =>
        describe(`OpenPGP.js ${v6Canary ? 'v6 (canary)' : 'v5'}`, () => {
            beforeAll(async () => {
                await CryptoWorker.init({ poolSize: 1, openpgpConfigOptions: { v6Canary } });
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
                await expect(CryptoWorker.init()).to.be.rejectedWith(/already initialised/);
            });

            runApiTests(CryptoProxy, v6Canary);
        });

    runTests(false);
    runTests(true);
});
