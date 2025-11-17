import { decryptData, encryptData, importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { pipe } from '@proton/pass/utils/fp/pipe';
import * as browser from '@proton/shared/lib/helpers/browser';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { PassCryptoError } from './errors';
import {
    assertPRFCredential,
    assertPublicKeyCredential,
    deriveKeyFromPRFCredential,
    extractPRFBuffer,
    isPRFSupported,
} from './prf';

jest.mock('@proton/shared/lib/helpers/browser');
const isChromiumBased = browser.isChromiumBased as jest.Mock;
const isMinimumSafariVersion = browser.isMinimumSafariVersion as jest.Mock;
const isUserVerifyingPlatformAuthenticatorAvailable = jest.fn();

const TEST_PRF_BYTES = stringToUint8Array('test.webauthn.prf.salt');
const TEST_HKDF_B64 = 'xW/XzmkKNMbwoBJ6UuFR1rdOAd5Fbp2QO9OPp6QYt6s=';

global.PublicKeyCredential = function PublicKeyCredential() {} as any;
global.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
    isUserVerifyingPlatformAuthenticatorAvailable;

const createMockCredential = (prf?: any) =>
    Object.setPrototypeOf({ getClientExtensionResults: () => ({ prf }) }, PublicKeyCredential.prototype);

describe('PRF utilities', () => {
    describe('`isPRFSupported`', () => {
        test('returns `true` for chromium browsers with platform authenticator', async () => {
            isUserVerifyingPlatformAuthenticatorAvailable.mockReturnValue(true);
            isChromiumBased.mockReturnValue(true);
            expect(await isPRFSupported()).toBe(true);
        });

        test('returns `true` for safari browsers with platform authenticator', async () => {
            isUserVerifyingPlatformAuthenticatorAvailable.mockReturnValue(true);
            isChromiumBased.mockReturnValue(false);
            isMinimumSafariVersion.mockReturnValue(true);
            expect(await isPRFSupported()).toBe(true);
        });

        test('returns `false` for unsupported browsers', async () => {
            isChromiumBased.mockReturnValue(false);
            isMinimumSafariVersion.mockReturnValue(false);
            expect(await isPRFSupported()).toBe(false);
        });

        test('returns `false` when platform authenticator check fails', async () => {
            isChromiumBased.mockReturnValue(true);
            isUserVerifyingPlatformAuthenticatorAvailable.mockReturnValue(false);
            expect(await isPRFSupported()).toBe(false);
        });
    });

    describe('`assertPublicKeyCredential`', () => {
        test('returns `true` for valid `PublicKeyCredential`', () => {
            expect(assertPublicKeyCredential(new PublicKeyCredential())).toBe(true);
        });

        test('returns `false` for invalid credentials', () => {
            expect(assertPublicKeyCredential(null)).toBe(false);
            expect(assertPublicKeyCredential({} as Credential)).toBe(false);
        });
    });

    describe('`assertPRFCredential`', () => {
        test('returns `true` for valid PRF-enabled credential', () => {
            const credential = createMockCredential({ enabled: true });
            expect(assertPRFCredential(credential)).toBe(true);
        });

        test('returns `false` for credential with PRF not enabled', () => {
            const credential = createMockCredential({ enabled: false });
            expect(assertPRFCredential(credential)).toBe(false);
        });

        test('returns `false` for credential with no PRF extension', () => {
            const credential = createMockCredential({});
            expect(assertPRFCredential(credential)).toBe(false);
        });
    });

    describe('`extractPRFBuffer`', () => {
        test('extracts PRF buffer from valid credential', () => {
            const credential = createMockCredential({ results: { first: TEST_PRF_BYTES } });
            expect(extractPRFBuffer(credential)).toBe(TEST_PRF_BYTES);
        });

        test('throws error for invalid credential', () => {
            expect(() => extractPRFBuffer(null)).toThrow(PassCryptoError);
            expect(() => extractPRFBuffer(createMockCredential({}))).toThrow(PassCryptoError);
        });
    });

    describe('`deriveKeyFromPRFCredential`', () => {
        test('should derive key via HKDF pass', async () => {
            const credential = createMockCredential({ results: { first: TEST_PRF_BYTES } });
            const result = await deriveKeyFromPRFCredential(credential, true);
            expect(pipe(stringToUint8Array, bytes => bytes.toBase64())(result)).toEqual(TEST_HKDF_B64);
        });

        test('should return valid crypto key derived from HKDF pass', async () => {
            const credential = createMockCredential({ results: { first: TEST_PRF_BYTES } });
            const result = await deriveKeyFromPRFCredential(credential);

            const message = stringToUint8Array('test.message');
            const expectedKey = await importKey(Uint8Array.fromBase64(TEST_HKDF_B64));
            const encryptedMessage = await encryptData(expectedKey, message);

            const decryptedMessage = await decryptData(result, encryptedMessage);
            expect(decryptedMessage).toEqual(message);
        });
    });
});
