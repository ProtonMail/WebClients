import { testEmail, keyList, skl, epoch, proof } from './keyTransparency.data';
import { verifyPublicKeys } from '../lib/keyTransparency';
import { KT_STATUS } from '../lib/constants';

describe('key transparency', () => {
    const mockAddress = {
        Responses: [
            {
                Email: testEmail,
                Response: { Code: 1000, CanonicalEmail: testEmail },
            },
        ],
        Code: 1001,
    };

    const mockApi = (returnedEpoch, returnedProof, returnedAddress) => (call) => {
        const splitCall = call.url.split('/');
        if (splitCall[0] === 'addresses') {
            return returnedAddress;
        }
        if (splitCall[0] === 'kt') {
            if (splitCall.length > 3) {
                return returnedProof;
            }
            return returnedEpoch;
        }
    };

    it('should verify public keys and fail when it checks the certificate returnedDate', async () => {
        const result = await verifyPublicKeys(keyList, testEmail, skl, mockApi(epoch, proof, mockAddress));
        expect(result.code).toEqual(KT_STATUS.KT_FAILED);
        expect(result.error).toEqual('Returned date is older than MAX_EPOCH_INTERVAL');
    });

    it('should warn that public keys are too young to be verified', async () => {
        const result = await verifyPublicKeys(
            keyList,
            testEmail,
            { ...skl, MinEpochID: null, MaxEpochID: null },
            mockApi(epoch, proof, mockAddress)
        );
        expect(result.code).toEqual(KT_STATUS.KTERROR_MINEPOCHID_NULL);
        expect(result.error).toEqual('The keys were generated too recently to be included in key transparency');
    });

    it('should fail with undefined canonizeEmail', async () => {
        const corruptAddress = JSON.parse(JSON.stringify(mockAddress));
        corruptAddress.Responses[0].Response.CanonicalEmail = undefined;

        const result = await verifyPublicKeys(keyList, testEmail, skl, mockApi(epoch, proof, corruptAddress));
        expect(result.code).toEqual(KT_STATUS.KT_FAILED);
        expect(result.error).toEqual(`Failed to canonize email "${testEmail}"`);
    });

    it('should fail with no signed key list given', async () => {
        const result = await verifyPublicKeys(keyList, testEmail, null, mockApi(epoch, proof, mockAddress));
        expect(result.code).toEqual(KT_STATUS.KTERROR_ADDRESS_NOT_IN_KT);
        expect(result.error).toEqual('Signed key list undefined');
    });

    it('should fail signature verification', async () => {
        const result = await verifyPublicKeys(
            keyList,
            testEmail,
            { ...skl, Data: `${skl.Data.slice(0, 12)}3${skl.Data.slice(13)}` },
            mockApi(epoch, proof, mockAddress)
        );
        expect(result.code).toEqual(KT_STATUS.KT_FAILED);
        expect(result.error).toEqual('Signature verification failed (SKL during PK verification)');
    });

    it('should fail signed key list check', async () => {
        const result = await verifyPublicKeys([keyList[0]], testEmail, skl, mockApi(epoch, proof, mockAddress));
        expect(result.code).toEqual(KT_STATUS.KT_FAILED);
        expect(result.error).toEqual(
            'Mismatch found between key list and signed key list. Key list and signed key list have different lengths'
        );
    });
});
