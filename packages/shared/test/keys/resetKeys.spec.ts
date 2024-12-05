import { CryptoProxy } from '@proton/crypto';

import { KEYGEN_CONFIGS, KEYGEN_TYPES } from '../../lib/constants';
import type { Address } from '../../lib/interfaces';
import { getResetAddressesKeysV2 } from '../../lib/keys';

describe('reset keys v2', () => {
    it('should return an empty result', async () => {
        const result = await getResetAddressesKeysV2({
            addresses: [],
            passphrase: '',
            supportV6Keys: false,
            keyGenConfigForV4Keys: KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
            preAuthKTVerify: () => async () => {},
        });
        expect(result).toEqual({
            privateKeys: undefined,
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
            supportV6Keys: false,
            keyGenConfigForV4Keys: KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
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
        expect(addressKeysPayload.length).toEqual(1); // only one (v4) key should be generated
        for (const payload of addressKeysPayload) {
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

            const importedKey = await CryptoProxy.importPublicKey({ armoredKey: payload.PrivateKey });
            expect(importedKey.getVersion()).toBe(4);
        }
    });

    it('should return reset keys - with v6 support', async () => {
        const { userKeyPayload, addressKeysPayload } = await getResetAddressesKeysV2({
            addresses: [
                {
                    ID: '123',
                    Email: '123@123.com',
                } as unknown as Address,
            ],
            passphrase: '123',
            supportV6Keys: true,
            keyGenConfigForV4Keys: KEYGEN_CONFIGS[KEYGEN_TYPES.CURVE25519],
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

        expect(addressKeysPayload.length).toEqual(2); // one v4 and one v6 key should be generated
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
        const [{ PrivateKey: v4KeyArmored }, { PrivateKey: v6KeyArmored }] = addressKeysPayload;
        const v4Key = await CryptoProxy.importPublicKey({ armoredKey: v4KeyArmored });
        expect(v4Key.getVersion()).toBe(4);
        const v6Key = await CryptoProxy.importPublicKey({ armoredKey: v6KeyArmored });
        expect(v6Key.getVersion()).toBe(6);
    });
});
