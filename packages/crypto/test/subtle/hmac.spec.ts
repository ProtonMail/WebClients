import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { importKey, signData, verifyData } from '../../lib/subtle/hmac';
import { stringToUtf8Array } from '../../lib/utils';

chaiUse(chaiAsPromised);

describe('Subtle - HMAC-SHA256 helpers', () => {
    it('importKey - throws on short keys', async () => {
        const secretBytesTooShort = crypto.getRandomValues(new Uint8Array(16)); // 32 bytes required with SHA256
        await expect(importKey(secretBytesTooShort)).to.be.rejectedWith(/key is too short/);
    });

    it('importKey/signData/verifyData - correctly confirms authenticity of signed data', async () => {
        const secretBytes = crypto.getRandomValues(new Uint8Array(32));
        const key = await importKey(secretBytes);
        const data = stringToUtf8Array('hello world');
        const signed = await signData(key, data);

        const verified = await verifyData(key, signed, data);
        expect(verified).to.be.true;

        // check that different `data` does not verify
        await expect(verifyData(key, signed, new Uint8Array([1, 2, 3]))).to.eventually.be.false;
    });
});
