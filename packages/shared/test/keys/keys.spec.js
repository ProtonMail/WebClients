import { describe, it } from 'mocha';
import requireInject from 'require-inject';
import assert from 'assert';

const pmCryptoMocks = {
    decryptMessage: async () => ({ verified: 1 }),
    decryptPrivateKey: async (encryptedKey) => {
        if (encryptedKey === 'org-armored-key') {
            return { toPublic: () => '123' };
        }
        if (encryptedKey === '2') {
            throw new Error('Decryption error');
        }
        return 'foo';
    },
    getMessage: async () => 'foo',
    keyInfo: async () => 'foo'
};

const mocks = {
    pmcrypto: pmCryptoMocks
};

const { prepareUserKeys, prepareAddressKeys } = requireInject('../../lib/keys/keys', mocks);

const Key1 = {
    ID: 1,
    PrivateKey: '1'
};

const Key2 = {
    ID: 2,
    PrivateKey: '2'
};

const Key3 = {
    ID: 3,
    PrivateKey: '3'
};

const Address1 = {
    ID: '123',
    Keys: [Key1]
};

const Address2 = {
    ID: '321',
    Keys: [Key1, Key2]
};

describe('keys', () => {
    it('should prepare keys', async () => {
        const preparedKeys = await prepareUserKeys({
            UserKeys: [Key1, Key2],
            keyPassword: '123'
        });
        assert.deepStrictEqual(preparedKeys, {
            [Key1.ID]: {
                Key: Key1,
                decryptedPrivateKey: 'foo',
                info: 'foo'
            },
            [Key2.ID]: {
                Key: Key2,
                decryptedPrivateKey: undefined,
                info: 'foo'
            }
        });
    });

    it('should prepare the keys if a subuser', async () => {
        const preparedKeys = await prepareUserKeys({
            UserKeys: [Key1, Key2],
            keyPassword: '123',
            OrganizationPrivateKey: 'org-armored-key'
        });
        assert.deepStrictEqual(preparedKeys, {
            [Key1.ID]: {
                Key: Key1,
                decryptedPrivateKey: 'foo',
                info: 'foo'
            },
            [Key2.ID]: {
                Key: Key2,
                decryptedPrivateKey: undefined,
                info: 'foo'
            }
        });
    });

    it('should prepare address keys', async () => {
        const preparedKeys = await prepareAddressKeys({
            Addresses: [Address1, Address2],
            keyPassword: 'pw'
        });
        assert.deepStrictEqual(preparedKeys, {
            123: {
                [Key1.ID]: {
                    Key: Key1,
                    decryptedPrivateKey: 'foo',
                    info: 'foo'
                }
            },
            321: {
                [Key1.ID]: {
                    Key: Key1,
                    decryptedPrivateKey: 'foo',
                    info: 'foo'
                },
                [Key2.ID]: {
                    Key: Key2,
                    decryptedPrivateKey: undefined,
                    info: 'foo'
                }
            }
        });
    });

    it('should use cached result if it has', async () => {
        const preparedKeys = await prepareUserKeys({
            UserKeys: [Key1, Key2, Key3],
            keyPassword: '123',
            cache: {
                [Key1.ID]: {
                    decryptedPrivateKey: 'bar'
                }
            }
        });
        assert.deepStrictEqual(preparedKeys, {
            [Key1.ID]: {
                Key: Key1,
                decryptedPrivateKey: 'bar',
                info: 'foo'
            },
            [Key2.ID]: {
                Key: Key2,
                decryptedPrivateKey: undefined,
                info: 'foo'
            },
            [Key3.ID]: {
                Key: Key3,
                decryptedPrivateKey: 'foo',
                info: 'foo'
            }
        });
    });
});
