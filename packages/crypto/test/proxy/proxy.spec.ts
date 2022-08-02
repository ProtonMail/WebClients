import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { CryptoApiInterface, CryptoProxy, updateServerTime } from '../../lib';
import { Api as CryptoApi } from '../../lib/worker/api';

chaiUse(chaiAsPromised);

describe('CryptoProxy', () => {
    let api = new CryptoApi();
    it('setEndpoint - should throw if already set', async () => {
        CryptoProxy.setEndpoint(api);
        expect(() => CryptoProxy.setEndpoint(api)).to.throw(/already initialised/);
        await CryptoProxy.releaseEndpoint();
    });

    it('releaseEndpoint - should invoke callback', async () => {
        let called = false;
        CryptoProxy.setEndpoint(api, async () => {
            called = true;
        });
        expect(called).to.be.false;
        await CryptoProxy.releaseEndpoint();
        expect(called).to.be.true;
    });

    it('should use serverTime()', async () => {
        let passedDate = null;
        const mockApi: CryptoApiInterface = {
            generateKey: async ({ date }) => {
                passedDate = date;
                return {};
            },
        } as CryptoApiInterface;
        CryptoProxy.setEndpoint(mockApi);

        const now = new Date();
        const zero = new Date(0);

        updateServerTime(zero);
        // we don't care about returned value
        await CryptoProxy.generateKey({ userIDs: [], date: undefined }); // explicitly passing undefined should not overwrite the server time
        updateServerTime(now); // restore current time
        // the proxy is expected to pass the server time at each function call
        expect(passedDate).to.deep.equal(zero);

        await CryptoProxy.releaseEndpoint();
    });
});
