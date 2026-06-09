import { vrfVerify } from '../lib/verification/vrf';
import { testVectors } from './vrf.data';

describe('vrf', () => {
    it('should verify the test vectors', async () => {
        for (const testVector of testVectors) {
            const beta = await vrfVerify(
                Uint8Array.fromHex(testVector.alpha),
                Uint8Array.fromHex(testVector.pi),
                Uint8Array.fromHex(testVector.pk)
            );
            expect(beta.toHex()).toEqual(testVector.beta);
        }
    });
});
