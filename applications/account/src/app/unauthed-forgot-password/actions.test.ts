import type { ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { type Api, KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';

import { authMnemonicAndGetKeys, performPasswordChangeViaMnemonic, performPasswordReset } from './actions';
import {
    NoKeysDecryptedUsingPhraseError,
    ResetKeysRejectedError,
    ResetTokenRejectedError,
    SignInAfterResetError,
} from './state-machine/forgotPasswordErrors';

jest.mock('@proton/shared/lib/srp', () => ({
    ...jest.requireActual('@proton/shared/lib/srp'),
    srpVerify: jest.fn(),
    srpAuth: jest.fn(),
}));

jest.mock('@proton/shared/lib/authentication/getUser', () => ({
    ...jest.requireActual('@proton/shared/lib/authentication/getUser'),
    getUser: jest.fn(),
}));

// Key passwords come from bcrypt, which is slow; their values don't matter here
jest.mock('@proton/shared/lib/keys/keys', () => ({
    ...jest.requireActual('@proton/shared/lib/keys/keys'),
    generateKeySaltAndPassphrase: jest.fn(async () => ({ salt: 'salt', passphrase: 'passphrase' })),
}));
jest.mock('@protontech/crypto/srp', () => ({
    ...jest.requireActual('@protontech/crypto/srp'),
    generateKeySalt: jest.fn(() => 'key-salt'),
    computeKeyPassword: jest.fn(async () => 'key-password'),
}));

// The phrase's words aren't what these tests are about
jest.mock('@proton/shared/lib/mnemonic/bip39Wrapper', () => ({
    ...jest.requireActual('@proton/shared/lib/mnemonic/bip39Wrapper'),
    mnemonicToBase64RandomBytes: jest.fn(async () => 'random-bytes'),
}));

const api = jest.fn() as unknown as Api;
const apiError = (code: number, status: number) => ({ status, data: { Code: code, Error: `error ${code}` } });

/** How the reset refuses the token. */
const tokenRefused = () => apiError(API_CUSTOM_ERROR_CODES.INVALID_VALUE, HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY);

beforeEach(() => {
    jest.mocked(srpVerify).mockReset().mockResolvedValue(undefined);
    jest.mocked(srpAuth).mockReset();
    jest.mocked(getUser).mockReset();
});

describe('authMnemonicAndGetKeys', () => {
    it('fails with a `NoKeysDecryptedUsingPhraseError` when the phrase signs in but decrypts no keys', async () => {
        jest.mocked(srpAuth).mockResolvedValue({ json: async () => ({}) } as Response);
        // The phrase signs in, but none of the account's keys are encrypted with it
        const accountApi = jest.fn(async () => ({ MnemonicUserKeys: [] })) as unknown as Api;

        const checking = authMnemonicAndGetKeys({
            username: 'user@example.com',
            mnemonic: 'recovery phrase',
            persistent: false,
            api: accountApi,
        });

        await expect(checking).rejects.toThrow(NoKeysDecryptedUsingPhraseError);
    });
});

describe('performPasswordReset', () => {
    /** Resets the password of an account without addresses, so no keys are generated. */
    const resetPassword = () =>
        performPasswordReset({
            newPassword: 'new password',
            username: 'user@example.com',
            ownershipVerificationCode: 'reset-token',
            resetResponse: { Addresses: [], SupportPgpV6Keys: 0 } as unknown as ValidateResetTokenResponse,
            persistent: false,
            productParam: undefined,
            ktActivation: KeyTransparencyActivation.DISABLED,
            setupVPN: false,
            api,
        });

    it('fails with a `ResetTokenRejectedError`, not traced, when the reset refuses the token, without signing in', async () => {
        const error = tokenRefused();
        jest.mocked(srpVerify).mockRejectedValue(error);

        const resetting = resetPassword();

        await expect(resetting).rejects.toThrow(ResetTokenRejectedError);
        await expect(resetting).rejects.toMatchObject({ cause: error, trace: false });
        expect(srpAuth).not.toHaveBeenCalled();
    });

    it.each([
        {
            refusal: 'new keys, with the code a refused token has',
            code: API_CUSTOM_ERROR_CODES.INVALID_VALUE,
            status: 400,
        },
        { refusal: 'a duplicate key', code: API_CUSTOM_ERROR_CODES.INVALID_VALUE, status: 409 },
        { refusal: 'a key that already exists', code: API_CUSTOM_ERROR_CODES.ALREADY_EXISTS, status: 409 },
        { refusal: 'a reset it doesn’t allow', code: API_CUSTOM_ERROR_CODES.NOT_ALLOWED, status: 400 },
        { refusal: 'a key it can’t take', code: API_CUSTOM_ERROR_CODES.NOT_ALLOWED, status: 422 },
    ])(
        'fails with a `ResetKeysRejectedError` when the reset refuses $refusal ($status), without signing in',
        async ({ code, status }) => {
            // The API takes the token before checking anything but the token itself, so it's used up
            const error = apiError(code, status);
            jest.mocked(srpVerify).mockRejectedValue(error);

            const resetting = resetPassword();

            await expect(resetting).rejects.toThrow(ResetKeysRejectedError);
            await expect(resetting).rejects.toHaveProperty('cause', error);
            expect(srpAuth).not.toHaveBeenCalled();
        }
    );

    it.each([
        { failure: 'a network error', error: new Error('network') },
        // Banned before the token is taken: it's still valid later
        {
            failure: 'a ban',
            error: apiError(API_CUSTOM_ERROR_CODES.NOT_ALLOWED, HTTP_ERROR_CODES.TOO_MANY_REQUESTS),
        },
        // Whether the token was taken is unknown: a retry tells
        { failure: 'a server error', error: apiError(API_CUSTOM_ERROR_CODES.INVALID_VALUE, 500) },
    ])('fails with any other error of the reset as it is ($failure)', async ({ error }) => {
        jest.mocked(srpVerify).mockRejectedValue(error);

        await expect(resetPassword()).rejects.toBe(error);
    });

    it('fails with a `SignInAfterResetError` once the password is changed, even failing like a refused token', async () => {
        // Signing in with the new password failing says nothing about the token, and the user can still sign in
        const error = tokenRefused();
        jest.mocked(srpAuth).mockRejectedValue(error);

        const resetting = resetPassword();

        await expect(resetting).rejects.toThrow(SignInAfterResetError);
        await expect(resetting).rejects.toHaveProperty('cause', error);
        expect(srpVerify).toHaveBeenCalledTimes(1);
    });
});

describe('performPasswordChangeViaMnemonic', () => {
    /** Changes the password with the recovery phrase's keys: none, so none are re-encrypted. */
    const changePassword = () =>
        performPasswordChangeViaMnemonic({
            newPassword: 'new password',
            mnemonicData: { api, authResponse: {} as AuthResponse, decryptedUserKeys: [] },
            persistent: false,
            api,
        });

    it('fails with any error of the reset as it is, without signing in', async () => {
        const error = new Error('network');
        jest.mocked(srpVerify).mockRejectedValue(error);

        await expect(changePassword()).rejects.toBe(error);
        expect(getUser).not.toHaveBeenCalled();
    });

    it('fails with a `SignInAfterResetError` once the password is changed', async () => {
        const error = new Error('network');
        jest.mocked(getUser).mockRejectedValue(error);

        const changing = changePassword();

        await expect(changing).rejects.toThrow(SignInAfterResetError);
        await expect(changing).rejects.toHaveProperty('cause', error);
    });
});
