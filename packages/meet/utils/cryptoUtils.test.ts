import type { SessionKey } from '@protontech/crypto';
import { CryptoProxy } from '@protontech/crypto';
import type * as srp from '@protontech/crypto/srp';
import { computeKeyPassword } from '@protontech/crypto/srp';

import {
    decryptMeetingName,
    decryptMetadataWithKey,
    decryptSessionKey,
    deriveEncryptionKeyFromSessionKey,
    encryptMetadataWithKey,
    prepareMeetingCryptoData,
} from './cryptoUtils';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from './testUtils';

vi.mock('@proton/shared/lib/srp', () => ({
    srpGetVerify: vi.fn().mockResolvedValue({
        Auth: {
            Salt: 'this is mock salt',
            Verifier: 'this is mock verifier',
            ModulusID: 'this is mock modulus id',
        },
    }),
}));

vi.mock('@protontech/crypto/srp', async (importOriginal) => {
    const original = await importOriginal<typeof srp>();
    return { ...original, computeKeyPassword: vi.fn(original.computeKeyPassword) };
});

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

        const sessionKey: SessionKey = {
            data: crypto.getRandomValues(new Uint8Array(32)),
            algorithm: 'aes256',
        };

        const derivedKey = await deriveEncryptionKeyFromSessionKey(sessionKey);

        const encryptedData = await encryptMetadataWithKey(derivedKey, mockData);

        const decryptedData = await decryptMetadataWithKey(derivedKey, encryptedData);

        expect(decryptedData).toBe(mockData);
    });

    it('should allow for encrypting and decrypting meeting name', async () => {
        const mockPrivateKey = await getMockPrivateKey();

        const { encryptedMeetingName, encryptedSessionKey, salt, passwordBase } = await prepareMeetingCryptoData({
            primaryUserKey: mockPrivateKey,
            meetingName: mockMeetingName,
            // @ts-expect-error - srpGetVerify is mocked, no need for the api
            api: null,
        });

        const decryptedMeetingName = await decryptMeetingName({
            password: passwordBase,
            encryptedMeetingName,
            encryptedSessionKey,
            salt,
        });

        expect(decryptedMeetingName).toBe(mockMeetingName);
    });

    it('should allow for encrypting and decrypting the password', async () => {
        const mockPrivateKey = await getMockPrivateKey();

        const { encryptedPassword } = await prepareMeetingCryptoData({
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

    it('reuses the hash from the creation for every decryption of its session key', async () => {
        const { encryptedSessionKey, salt, passwordBase } = await prepareMeetingCryptoData({
            meetingName: mockMeetingName,
            // @ts-expect-error - srpGetVerify is mocked, no need for the api
            api: null,
        });
        vi.mocked(computeKeyPassword).mockClear();

        const sessionKeys = await Promise.all([
            decryptSessionKey({ encryptedSessionKey, password: passwordBase, salt }),
            decryptSessionKey({ encryptedSessionKey, password: passwordBase, salt }),
        ]);

        expect(computeKeyPassword).not.toHaveBeenCalled();
        expect(sessionKeys.map((sessionKey) => sessionKey?.algorithm)).toEqual(['aes256', 'aes256']);
    });

    it('hashes the meeting password once across the decryptions of a meeting created elsewhere', async () => {
        const { encryptedSessionKey, salt, passwordBase } = await prepareMeetingCryptoData({
            meetingName: mockMeetingName,
            // @ts-expect-error - srpGetVerify is mocked, no need for the api
            api: null,
        });
        // Another meeting's creation replaces the hash, as when a participant opens a link
        await prepareMeetingCryptoData({
            meetingName: mockMeetingName,
            // @ts-expect-error - srpGetVerify is mocked, no need for the api
            api: null,
        });
        vi.mocked(computeKeyPassword).mockClear();

        await decryptSessionKey({ encryptedSessionKey, password: passwordBase, salt });
        const sessionKey = await decryptSessionKey({ encryptedSessionKey, password: passwordBase, salt });

        expect(computeKeyPassword).toHaveBeenCalledTimes(1);
        expect(sessionKey?.algorithm).toBe('aes256');
    });

    it('still rejects a wrong password after the right one decrypted the session key', async () => {
        const { encryptedSessionKey, salt, passwordBase } = await prepareMeetingCryptoData({
            meetingName: mockMeetingName,
            // @ts-expect-error - srpGetVerify is mocked, no need for the api
            api: null,
        });
        await decryptSessionKey({ encryptedSessionKey, password: passwordBase, salt });

        await expect(decryptSessionKey({ encryptedSessionKey, password: 'wrongpassword', salt })).rejects.toThrow();
    });
});
