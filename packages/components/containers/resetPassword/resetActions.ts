import { getRecoveryMethods, getUser } from '@proton/shared/lib/api/user';
import { requestLoginResetToken, validateResetToken } from '@proton/shared/lib/api/reset';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { Api, User as tsUser } from '@proton/shared/lib/interfaces';
import { generateKeySaltAndPassphrase, getResetAddressesKeys } from '@proton/shared/lib/keys';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';
import { resetKeysRoute } from '@proton/shared/lib/api/keys';
import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { auth } from '@proton/shared/lib/api/auth';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    AccountType,
    RecoveryMethod,
    ResetActionResponse,
    ResetCacheResult,
    STEPS,
    ValidateResetTokenResponse,
} from './interface';

export const handleNewPassword = async ({
    password,
    cache,
    api,
}: {
    password: string;
    cache: ResetCacheResult;
    api: Api;
}): Promise<ResetActionResponse> => {
    const { username, token, resetResponse } = cache;
    if (!resetResponse || !token) {
        throw new Error('Missing response');
    }
    const { Addresses: addresses } = resetResponse;

    const { passphrase, salt } = await generateKeySaltAndPassphrase(password);
    const { addressKeysPayload, userKeyPayload } = await getResetAddressesKeys({ addresses, passphrase });

    await srpVerify({
        api,
        credentials: { password },
        config: resetKeysRoute({
            Username: username,
            Token: token,
            KeySalt: salt,
            PrimaryKey: userKeyPayload,
            AddressKeys: addressKeysPayload,
        }),
    });

    const authResponse = await srpAuth<AuthResponse>({
        api,
        credentials: { username, password },
        config: auth({ Username: username }),
    });
    const User = await api<{ User: tsUser }>(
        withAuthHeaders(authResponse.UID, authResponse.AccessToken, getUser())
    ).then(({ User }) => User);
    await persistSession({ ...authResponse, User, keyPassword: passphrase, api });

    return {
        to: STEPS.DONE,
        session: {
            ...authResponse,
            User,
            keyPassword: passphrase,
            flow: 'reset',
        },
    };
};

export const handleRequestToken = async ({
    cache,
    method,
    value,
    username,
    api,
}: {
    cache: ResetCacheResult;
    method: RecoveryMethod;
    value: string;
    username: string;
    api: Api;
}): Promise<ResetActionResponse> => {
    if (method === 'sms') {
        await api(requestLoginResetToken({ Username: username, Phone: value }));
    }
    if (method === 'email') {
        await api(requestLoginResetToken({ Username: username, Email: value }));
    }
    return {
        cache: {
            ...cache,
            username,
            method,
            value,
        },
        to: STEPS.VALIDATE_RESET_TOKEN,
    };
};

export const handleValidateResetToken = async ({
    api,
    cache,
    token,
    hasDanger = false,
}: {
    api: Api;
    cache: ResetCacheResult;
    token: string;
    hasDanger?: boolean;
}): Promise<ResetActionResponse> => {
    const { username } = cache;
    const resetResponse = await api<ValidateResetTokenResponse>(validateResetToken(username, token));
    return {
        to: hasDanger ? STEPS.DANGER_VERIFICATION : STEPS.NEW_PASSWORD,
        cache: {
            ...cache,
            token,
            resetResponse,
        },
    };
};

export const handleRequestRecoveryMethods = async ({
    username,
    api,
}: {
    username: string;
    api: Api;
}): Promise<ResetActionResponse> => {
    try {
        const { Type, Methods }: { Type: AccountType; Methods: RecoveryMethod[] } = await api(
            getRecoveryMethods(username)
        );
        if (Type === 'external' && Methods.includes('login')) {
            await api(requestLoginResetToken({ Username: username, Email: username }));
            return {
                cache: {
                    username,
                    value: username,
                    method: 'email',
                    Methods,
                },
                to: STEPS.VALIDATE_RESET_TOKEN,
            };
        }

        if (!Methods.length) {
            return {
                error: '',
                to: STEPS.NO_RECOVERY_METHODS,
            };
        }

        return {
            cache: {
                username,
                Methods,
            },
            to: STEPS.REQUEST_RESET_TOKEN,
        };
    } catch (error) {
        const { data: { Code, Error } = { Code: 0, Error: '' } } = error;
        if ([API_CUSTOM_ERROR_CODES.NO_RESET_METHODS].includes(Code)) {
            return {
                error: Error,
                to: STEPS.NO_RECOVERY_METHODS,
            };
        }
        throw error;
    }
};
