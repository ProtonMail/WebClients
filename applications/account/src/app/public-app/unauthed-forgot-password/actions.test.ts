import type { ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';

import { authMnemonicAndGetKeys, performPasswordChangeViaMnemonic, performPasswordReset } from './actions';
import {
    NoKeysDecryptedUsingPhraseError,
    ResetKeysRejectedError,
    ResetTokenRejectedError,
    SignInAfterResetError,
} from './state-machine/forgotPasswordErrors';

vi.mock('@proton/shared/lib/srp', async () => ({
    ...(await vi.importActual<any>('@proton/shared/lib/srp')),
    srpVerify: vi.fn(),
    srpAuth: vi.fn(),
}));

vi.mock('@proton/shared/lib/authentication/getUser', async () => ({
    ...(await vi.importActual<any>('@proton/shared/lib/authentication/getUser')),
    getUser: vi.fn(),
}));

// Key passwords come from bcrypt, which is slow; their values don't matter here
vi.mock('@proton/shared/lib/keys/keys', async () => ({
    ...(await vi.importActual<any>('@proton/shared/lib/keys/keys')),
    generateKeySaltAndPassphrase: vi.fn(async () => ({ salt: 'salt', passphrase: 'passphrase' })),
}));
vi.mock('@protontech/crypto/srp', async () => ({
    ...(await vi.importActual<any>('@protontech/crypto/srp')),
    generateKeySalt: vi.fn(() => 'key-salt'),
    computeKeyPassword: vi.fn(async () => 'key-password'),
}));

// The phrase's words aren't what these tests are about
vi.mock('@proton/shared/lib/mnemonic/bip39Wrapper', async () => ({
    ...(await vi.importActual<any>('@proton/shared/lib/mnemonic/bip39Wrapper')),
    mnemonicToBase64RandomBytes: vi.fn(async () => 'random-bytes'),
}));

const api = vi.fn() as unknown as Api;
const apiError = (code: number, status: number) => ({ status, data: { Code: code, Error: `error ${code}` } });

/** How the reset refuses the token. */
const tokenRefused = () => apiError(API_CUSTOM_ERROR_CODES.INVALID_VALUE, HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY);

beforeEach(() => {
    vi.mocked(srpVerify).mockReset().mockResolvedValue(undefined);
    vi.mocked(srpAuth).mockReset();
    vi.mocked(getUser).mockReset();
});

describe('authMnemonicAndGetKeys', () => {
    it('fails with a `NoKeysDecryptedUsingPhraseError` when the phrase signs in but decrypts no keys', async () => {
        vi.mocked(srpAuth).mockResolvedValue({ json: async () => ({}) } as Response);
        // The phrase signs in, but none of the account's keys are encrypted with it
        const accountApi = vi.fn(async () => ({ MnemonicUserKeys: [] })) as unknown as Api;

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
        vi.mocked(srpVerify).mockRejectedValue(error);

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
            vi.mocked(srpVerify).mockRejectedValue(error);

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
        // The session expired before the token was taken
        {
            failure: 'an expired session',
            error: apiError(HTTP_ERROR_CODES.UNAUTHORIZED, HTTP_ERROR_CODES.UNAUTHORIZED),
        },
        // Whether the token was taken is unknown: a retry tells
        { failure: 'a server error', error: apiError(API_CUSTOM_ERROR_CODES.INVALID_VALUE, 500) },
    ])('fails with any other error of the reset as it is ($failure)', async ({ error }) => {
        vi.mocked(srpVerify).mockRejectedValue(error);

        await expect(resetPassword()).rejects.toBe(error);
    });

    it('fails with a `SignInAfterResetError` once the password is changed, even failing like a refused token', async () => {
        // Signing in with the new password failing says nothing about the token, and the user can still sign in
        const error = tokenRefused();
        vi.mocked(srpAuth).mockRejectedValue(error);

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
        vi.mocked(srpVerify).mockRejectedValue(error);

        await expect(changePassword()).rejects.toBe(error);
        expect(getUser).not.toHaveBeenCalled();
    });

    it('fails with a `SignInAfterResetError` once the password is changed', async () => {
        const error = new Error('network');
        vi.mocked(getUser).mockRejectedValue(error);

        const changing = changePassword();

        await expect(changing).rejects.toThrow(SignInAfterResetError);
        await expect(changing).rejects.toHaveProperty('cause', error);
    });
});
