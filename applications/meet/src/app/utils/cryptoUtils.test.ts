import { CryptoProxy } from '@proton/crypto';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';

import {
    decryptMeetingName,
    decryptMetadataWithKey,
    deriveEncryptionKeyFromSessionKey,
    encryptMetadataWithKey,
    prepareMeetingCryptoData,
} from './cryptoUtils';

vi.mock('@proton/shared/lib/srp', () => ({
    srpGetVerify: vi.fn().mockResolvedValue({
        Auth: {
            Salt: 'this is mock salt',
            Verifier: 'this is mock verifier',
            ModulusID: 'this is mock modulus id',
        },
    }),
}));

vi.mock('@proton/utils/getRandomString', () => ({
    __esModule: true,
    default: vi.fn().mockReturnValue('mockpassword'),
}));

const mockMeetingName = 'this is mock meeting name';

const getMockPrivateKey = async () => {
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: 'Your Name', email: 'your@email.com' }],
    });

    return privateKey;
};

describe('utils', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should encrypt and decrypt data', async () => {
        const mockData = 'this is mock data';

        const sessionKey = crypto.getRandomValues(new Uint8Array(32));

        const derivedKey = await deriveEncryptionKeyFromSessionKey(sessionKey);

        const encryptedData = await encryptMetadataWithKey(derivedKey, mockData);

        const decryptedData = await decryptMetadataWithKey(derivedKey, encryptedData);

        expect(decryptedData).toBe(mockData);
    });

    it('should allow for encrypting and decrypting meeting name without using a custom password', async () => {
        const mockPrivateKey = await getMockPrivateKey();

        const { encryptedMeetingName, encryptedSessionKey, salt, passwordBase } = await prepareMeetingCryptoData({
            customPassword: '',
            primaryUserKey: mockPrivateKey,
            meetingName: mockMeetingName,
            // @ts-expect-error - srpGetVerify is mocked, no need for the api
            api: null,
        });

        const decryptedMeetingName = await decryptMeetingName({
            urlPassword: passwordBase,
            customPassword: '',
            encryptedMeetingName,
            encryptedSessionKey,
            salt,
        });

        expect(decryptedMeetingName).toBe(mockMeetingName);
    });

    it('should allow for encrypting and decrypting meeting name with using a custom password', async () => {
        const mockPassword = 'mockpassword';

        const mockPrivateKey = await getMockPrivateKey();

        const { encryptedMeetingName, encryptedSessionKey, salt, passwordBase } = await prepareMeetingCryptoData({
            customPassword: mockPassword,
            primaryUserKey: mockPrivateKey,
            meetingName: mockMeetingName,
            // @ts-expect-error - srpGetVerify is mocked, no need for the api
            api: null,
        });

        const decryptedMeetingName = await decryptMeetingName({
            urlPassword: passwordBase,
            customPassword: mockPassword,
            encryptedMeetingName,
            encryptedSessionKey,
            salt,
        });

        expect(decryptedMeetingName).toBe(mockMeetingName);
    });

    it('should allow for encrypting and decrypting the password', async () => {
        const mockPrivateKey = await getMockPrivateKey();

        const { encryptedPassword } = await prepareMeetingCryptoData({
            customPassword: '',
            primaryUserKey: mockPrivateKey,
            meetingName: mockMeetingName,
            // @ts-expect-error - srpGetVerify is mocked, no need for the api
            api: null,
        });

        const decryptionResult = await CryptoProxy.decryptMessage({
            armoredMessage: encryptedPassword as string,
            decryptionKeys: [mockPrivateKey],
            format: 'utf8',
        });

        expect(decryptionResult.data).toBe('mockpassword');
    });
});
