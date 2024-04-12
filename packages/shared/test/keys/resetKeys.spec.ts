import { CryptoProxy } from '@proton/crypto';

import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '../../lib/constants';
import { Address } from '../../lib/interfaces';
import { getResetAddressesKeysV2 } from '../../lib/keys';

describe('reset keys v2', () => {
    it('should return an empty result', async () => {
        const result = await getResetAddressesKeysV2({
            addresses: [],
            passphrase: '',
            keyGenConfig: KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
            preAuthKTVerify: () => async () => {},
        });
        expect(result).toEqual({
            userKeyPayload: undefined,
            addressKeysPayload: undefined,
            onSKLPublishSuccess: undefined,
        });
    });

    it('should return reset keys', async () => {
        const { userKeyPayload, addressKeysPayload } = await getResetAddressesKeysV2({
            addresses: [
                {
                    ID: '123',
                    Email: '123@123.com',
                } as unknown as Address,
            ],
            passphrase: '123',
            keyGenConfig: KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
            preAuthKTVerify: () => async () => {},
        });
        if (!addressKeysPayload?.length) {
            throw new Error('Missing address keys');
        }
        await Promise.all(
            [userKeyPayload, ...addressKeysPayload.map(({ PrivateKey }) => PrivateKey)].map(async (armoredKey) => {
                if (!armoredKey) {
                    throw new Error('Missing key');
                }
                const { keyIsDecrypted } = await CryptoProxy.getKeyInfo({ armoredKey });
                if (keyIsDecrypted) {
                    throw new Error('Invalid key');
                }
            })
        );
        addressKeysPayload.forEach((payload) => {
            expect(payload).toEqual({
                AddressID: jasmine.any(String),
                PrivateKey: jasmine.any(String),
                Token: jasmine.any(String),
                Signature: jasmine.any(String),
                SignedKeyList: {
                    Data: jasmine.any(String),
                    Signature: jasmine.any(String),
                },
            });
        });
    });
});
