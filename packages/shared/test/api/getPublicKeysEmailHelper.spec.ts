import getPublicKeysEmailHelper from '../../lib/api/helpers/getPublicKeysEmailHelper';
import { KEY_FLAG, RECIPIENT_TYPES } from '../../lib/constants';
import { type KTUserContext, KeyTransparencyActivation } from '../../lib/interfaces';

const getApiError = ({ message, response = { headers: { get: () => '' } }, data, status }: any) => {
    const error: any = new Error(message);
    error.status = status;
    error.data = data;
    error.response = response;
    return error;
};

const getMockedApi = (mockApiResponse: any, isError = false) => {
    const response = isError ? Promise.reject(mockApiResponse) : Promise.resolve(mockApiResponse);
    return jasmine.createSpy('api').and.returnValue(response);
};

// `internalKeysOnly` is not being tested atm as it only affects the API returned data
describe('getPublicKeysEmailHelper', () => {
    const ktUserContext: KTUserContext = {
        ktActivation: KeyTransparencyActivation.DISABLED,
    } as unknown as KTUserContext;
    const testKeyA = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: email is aaa@test.com

xjMEZVeZjRYJKwYBBAHaRw8BAQdA39O4dS41Fqwvj0Xo/xWioK5Q7BudKJ/H
tna/S6Rl9KvNDjxhYWFAdGVzdC5jb20+wokEEBYKADsFgmVXmY0DCwkHCZCg
Jdhc+VtnygMVCAoCFgACGQECmwMCHgEWIQQgf6DlToGVRDJ8fuKgJdhc+Vtn
ygAAj2wA/3Zj6NrRdnUWMt5bqSOr49i9nJCplDlEDsUo15eWssQbAPwJ4toM
1eTmSXuHPe0qmV4bH+rmz2R1CojffAlBgHrhDs44BGVXmY0SCisGAQQBl1UB
BQEBB0CccwR7RDG2BrJUlko0XWcWz9r8tbKSZN/beWKBl2ORfgMBCAfCeAQY
FgoAKgWCZVeZjQmQoCXYXPlbZ8oCmwwWIQQgf6DlToGVRDJ8fuKgJdhc+Vtn
ygAAQu4A/isbPn6kW7t8Kz/JhcNbXYNLxzwUz2WYgU+b8IZA6iT2AQDN5Z6V
o641lFnk8Bo1GSevHgItogC7uU90n6i/fCrQBg==
-----END PGP PUBLIC KEY BLOCK-----`;
    const testKeyB = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Comment: email is bbb@test.com

xjMEZVeZkRYJKwYBBAHaRw8BAQdA1dHIjjOu9APYbRpYCdbDOB7aw0CPYOkd
qR7yuhSpqL3NDjxiYmJAdGVzdC5jb20+wokEEBYKADsFgmVXmZEDCwkHCZBG
XNa/N9gwHgMVCAoCFgACGQECmwMCHgEWIQS0U9zqvzhJRPKLh4VGXNa/N9gw
HgAAgv0A/AzlMq39rVpNTjNbrvIlh95wRflNTw86oadFtpocuWSWAQCZB1a3
BaOXeVZoHte7e7k7rTaAzZ8e0haSJPpy4qWpA844BGVXmZESCisGAQQBl1UB
BQEBB0CKHsFTozeEl7L0l9ueitptl9Bf2Tk/Q2yAZUgXVFbXHAMBCAfCeAQY
FgoAKgWCZVeZkQmQRlzWvzfYMB4CmwwWIQS0U9zqvzhJRPKLh4VGXNa/N9gw
HgAA4F0BAP3QbD5trB7BemDyRIET8pvs0J/s1ruMWV8/SC4u50nbAP9AIRON
vqg5tCgoAiPlCv5xna6ypuLS4rnVUVdNbYVRAA==
-----END PGP PUBLIC KEY BLOCK-----`;
    describe('mail encryption use case', () => {
        it('internal recipient with mail-capable address keys', async () => {
            // test with a mix of mail-capable and non-capable keys, even though it's unclear if this scenario can ever happen.
            const mockApiResponse = {
                Address: {
                    Keys: [
                        {
                            PublicKey: testKeyA,
                            Flags: KEY_FLAG.FLAG_NOT_OBSOLETE | KEY_FLAG.FLAG_NOT_COMPROMISED,
                        },
                        {
                            PublicKey: testKeyB,
                            Flags:
                                KEY_FLAG.FLAG_NOT_OBSOLETE |
                                KEY_FLAG.FLAG_NOT_COMPROMISED |
                                KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT,
                        },
                    ],
                },
                ProtonMX: false,
            };
            const api = getMockedApi(mockApiResponse);
            const result = await getPublicKeysEmailHelper({ api, ktUserContext, email: 'internal@proton.me' });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_INTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(false);
            expect(result.publicKeys).toHaveSize(1);
            expect(result.publicKeys[0].publicKey.getUserIDs()[0]).toMatch(/aaa@test.com/);
        });

        it('internal recipient with no mail-capable address keys', async () => {
            const mockApiResponse = {
                Address: {
                    Keys: [
                        {
                            PublicKey: testKeyA,
                            Flags:
                                KEY_FLAG.FLAG_NOT_OBSOLETE |
                                KEY_FLAG.FLAG_NOT_COMPROMISED |
                                KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT,
                        },
                    ],
                },
                ProtonMX: true,
            };
            const api = getMockedApi(mockApiResponse);
            const result = await getPublicKeysEmailHelper({ api, ktUserContext, email: 'internal@proton.me' });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_EXTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(true);
            expect(result.publicKeys).toHaveSize(0);
        });

        it('external account with internal address keys and wkd keys', async () => {
            const mockApiResponse = {
                Address: {
                    Keys: [
                        {
                            PublicKey: testKeyA,
                            Flags:
                                KEY_FLAG.FLAG_NOT_OBSOLETE |
                                KEY_FLAG.FLAG_NOT_COMPROMISED |
                                KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT,
                        },
                    ],
                },
                Unverified: {
                    Keys: [
                        {
                            PublicKey: testKeyB,
                            Flags: KEY_FLAG.FLAG_NOT_OBSOLETE | KEY_FLAG.FLAG_NOT_COMPROMISED,
                        },
                    ],
                },
                ProtonMX: false,
            };
            const api = getMockedApi(mockApiResponse);
            const result = await getPublicKeysEmailHelper({ api, ktUserContext, email: 'external@example.com' });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_EXTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(false);
            expect(result.publicKeys).toHaveSize(1);
            expect(result.publicKeys[0].publicKey.getUserIDs()[0]).toMatch(/bbb@test.com/);
        });

        it('external recipient with wkd keys', async () => {
            const mockApiResponse = {
                Address: {
                    Keys: [],
                },
                Unverified: {
                    Keys: [
                        {
                            PublicKey: testKeyB,
                            Flags: KEY_FLAG.FLAG_NOT_OBSOLETE | KEY_FLAG.FLAG_NOT_COMPROMISED,
                        },
                    ],
                },
                ProtonMX: false,
            };
            const api = getMockedApi(mockApiResponse);
            const result = await getPublicKeysEmailHelper({ api, ktUserContext, email: 'external@example.com' });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_EXTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(false);
            expect(result.publicKeys).toHaveSize(1);
        });
    });

    describe('includeInternalKeysWithE2EEDisabledForMail', () => {
        it('internal recipient with mail-capable address keys', async () => {
            const mockApiResponse = {
                Address: {
                    Keys: [
                        {
                            PublicKey: testKeyA,
                            Flags: KEY_FLAG.FLAG_NOT_OBSOLETE | KEY_FLAG.FLAG_NOT_COMPROMISED,
                        },
                    ],
                },
                ProtonMX: true,
            };
            const api = getMockedApi(mockApiResponse);
            const result = await getPublicKeysEmailHelper({
                api,
                ktUserContext,
                email: 'internal@proton.me',
                includeInternalKeysWithE2EEDisabledForMail: true,
            });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_INTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(false);
            expect(result.publicKeys).toHaveSize(1);
        });

        it('internal recipient with mail-capable address keys and bad MX settings', async () => {
            // test with a mix of mail-capable and non-capable keys, even though it's unclear if this scenario can ever happen.
            const mockApiResponse = {
                Address: {
                    Keys: [
                        {
                            PublicKey: testKeyA,
                            Flags: KEY_FLAG.FLAG_NOT_OBSOLETE | KEY_FLAG.FLAG_NOT_COMPROMISED,
                        },
                        {
                            PublicKey: testKeyB,
                            Flags:
                                KEY_FLAG.FLAG_NOT_OBSOLETE |
                                KEY_FLAG.FLAG_NOT_COMPROMISED |
                                KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT,
                        },
                    ],
                },
                ProtonMX: false,
            };
            const api = getMockedApi(mockApiResponse);
            const result = await getPublicKeysEmailHelper({
                api,
                ktUserContext,
                email: 'internal@proton.me',
                includeInternalKeysWithE2EEDisabledForMail: true,
            });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_INTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(false);
            expect(result.publicKeys).toHaveSize(2);
        });

        it('internal recipient with no mail-capable address keys', async () => {
            const mockApiResponse = {
                Address: {
                    Keys: [
                        {
                            PublicKey: testKeyA,
                            Flags:
                                KEY_FLAG.FLAG_NOT_OBSOLETE |
                                KEY_FLAG.FLAG_NOT_COMPROMISED |
                                KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT,
                        },
                    ],
                },
                ProtonMX: true,
            };
            const api = getMockedApi(mockApiResponse);
            const result = await getPublicKeysEmailHelper({
                api,
                ktUserContext,
                email: 'internal@proton.me',
                includeInternalKeysWithE2EEDisabledForMail: true,
            });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_INTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(true);
            expect(result.publicKeys).toHaveSize(1);
        });

        it('external account with internal address keys and wkd keys', async () => {
            const mockApiResponse = {
                Address: {
                    Keys: [
                        {
                            PublicKey: testKeyA,
                            Flags:
                                KEY_FLAG.FLAG_NOT_OBSOLETE |
                                KEY_FLAG.FLAG_NOT_COMPROMISED |
                                KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT,
                        },
                    ],
                },
                Unverified: {
                    Keys: [
                        {
                            PublicKey: testKeyB,
                            Flags: KEY_FLAG.FLAG_NOT_OBSOLETE | KEY_FLAG.FLAG_NOT_COMPROMISED,
                        },
                    ],
                },
                ProtonMX: false,
            };
            const api = getMockedApi(mockApiResponse);
            const result = await getPublicKeysEmailHelper({
                api,
                ktUserContext,
                email: 'external@example.com',
                includeInternalKeysWithE2EEDisabledForMail: true,
            });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_EXTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(false);
            // the internal address keys is always ignored for external accounts
            expect(result.publicKeys).toHaveSize(1);
            expect(result.publicKeys[0].publicKey.getUserIDs()[0]).toMatch(/bbb@test.com/);
        });

        it('external address with wkd keys - internalKeysOnly', async () => {
            // this simulates the error that the API currently gives, to ensure we handle it properly
            const mockApiResponse = getApiError({
                status: 422,
                data: {
                    Code: 33103,
                    Error: 'This address does not exist. Please try again',
                    Details: {
                        Address: 'external@example.com',
                    },
                },
            });
            const api = getMockedApi(mockApiResponse, true);
            const result = await getPublicKeysEmailHelper({
                api,
                ktUserContext,
                email: 'external@example.com',
                internalKeysOnly: true,
            });
            expect(result.RecipientType).toBe(RECIPIENT_TYPES.TYPE_EXTERNAL);
            expect(result.isInternalWithDisabledE2EEForMail).toBe(false);
            expect(result.publicKeys).toHaveSize(0);
        });
    });
});
