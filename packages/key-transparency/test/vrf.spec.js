import { arrayToHexString } from 'pmcrypto';
import { testVectors } from './vrf.data';
import { vrfVerify } from '../lib/vrf';
import { hexStringToArray } from '../lib/merkleTree';

describe('vrf', () => {
    it('should verify the test vectors', async () => {
        for (const testVector of testVectors) {
            const beta = await vrfVerify(
                hexStringToArray(testVector.alpha),
                hexStringToArray(testVector.pi),
                hexStringToArray(testVector.pk)
            );
            expect(arrayToHexString(beta)).toEqual(testVector.beta);
        }
    });
});
