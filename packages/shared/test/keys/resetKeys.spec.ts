import { getKeys } from 'pmcrypto';
import { getResetAddressesKeys, getResetAddressesKeysV2 } from '../../lib/keys';
import { ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '../../lib/constants';
import { Address } from '../../lib/interfaces';

describe('reset keys v1', () => {
    it('should return an empty result', async () => {
        const result = await getResetAddressesKeys({
            addresses: [],
            passphrase: '',
            encryptionConfig: ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519],
        });
        expect(result).toEqual({
            userKeyPayload: undefined,
            addressKeysPayload: undefined,
        });
    });

    it('should return reset keys', async () => {
        const { userKeyPayload, addressKeysPayload } = await getResetAddressesKeys({
            addresses: [
                ({
                    ID: '123',
                    Email: '123@123.com',
                } as unknown) as Address,
            ],
            passphrase: '123',
            encryptionConfig: ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519],
        });
        if (!addressKeysPayload?.length) {
            throw new Error('Missing address keys');
        }
        await Promise.all(
            [userKeyPayload, ...addressKeysPayload.map(({ PrivateKey }) => PrivateKey)].map(async (x) => {
                if (!x) {
                    throw new Error('Missing key');
                }
                const [key] = await getKeys(x);
                if (key.isDecrypted()) {
                    throw new Error('Invalid key');
                }
            })
        );
        addressKeysPayload.forEach((payload) => {
            expect(payload).toEqual({
                AddressID: jasmine.any(String),
                PrivateKey: jasmine.any(String),
                SignedKeyList: {
                    Data: jasmine.any(String),
                    Signature: jasmine.any(String),
                },
            });
        });
    });
});

describe('reset keys v2', () => {
    it('should return an empty result', async () => {
        const result = await getResetAddressesKeysV2({
            addresses: [],
            passphrase: '',
            encryptionConfig: ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519],
        });
        expect(result).toEqual({
            userKeyPayload: undefined,
            addressKeysPayload: undefined,
        });
    });

    it('should return reset keys', async () => {
        const { userKeyPayload, addressKeysPayload } = await getResetAddressesKeysV2({
            addresses: [
                ({
                    ID: '123',
                    Email: '123@123.com',
                } as unknown) as Address,
            ],
            passphrase: '123',
            encryptionConfig: ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519],
        });
        if (!addressKeysPayload?.length) {
            throw new Error('Missing address keys');
        }
        await Promise.all(
            [userKeyPayload, ...addressKeysPayload.map(({ PrivateKey }) => PrivateKey)].map(async (x) => {
                if (!x) {
                    throw new Error('Missing key');
                }
                const [key] = await getKeys(x);
                if (key.isDecrypted()) {
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
