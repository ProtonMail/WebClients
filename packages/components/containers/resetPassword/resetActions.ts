import { getRecoveryMethods, getUser } from '@proton/shared/lib/api/user';
import { requestLoginResetToken, validateResetToken } from '@proton/shared/lib/api/reset';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { Api, User as tsUser, UserType } from '@proton/shared/lib/interfaces';
import { generateKeySaltAndPassphrase, getResetAddressesKeys, handleSetupAddressKeys } from '@proton/shared/lib/keys';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';
import { resetKeysRoute } from '@proton/shared/lib/api/keys';
import { AuthResponse, InfoResponse } from '@proton/shared/lib/authentication/interface';
import { auth, authMnemonic, getMnemonicAuthInfo } from '@proton/shared/lib/api/auth';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import { getMnemonicReset, GetMnemonicResetData, mnemonicReset } from '@proton/shared/lib/api/settingsMnemonic';
import { decryptPrivateKey, encryptPrivateKey } from 'pmcrypto';
import { noop } from '@proton/shared/lib/helpers/function';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';
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
    const { username, token, resetResponse, persistent } = cache;
    if (!resetResponse || !token) {
        throw new Error('Missing response');
    }
    const { Addresses: addresses } = resetResponse;

    const hasAddressKeyMigration = resetResponse.ToMigrate === 1;

    const { passphrase, salt } = await generateKeySaltAndPassphrase(password);
    const { addressKeysPayload, userKeyPayload } = await getResetAddressesKeys({
        addresses,
        passphrase,
        hasAddressKeyMigrationGeneration: hasAddressKeyMigration,
    });

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
    const authApi = <T>(config: any) => api<T>(withAuthHeaders(authResponse.UID, authResponse.AccessToken, config));
    let User = await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User);

    let keyPassword = passphrase;
    // This is intended to deal with setting up an address & generating keys for username-only (VPN) accounts if
    // resetting the password through the account application.
    if (cache.hasGenerateKeys && !User.Keys.length && User.Type !== UserType.EXTERNAL) {
        keyPassword = await handleSetupAddressKeys({
            api: authApi,
            username,
            password,
            hasAddressKeyMigrationGeneration: User.ToMigrate === 1,
        });
        // Refetch the user to update the keys that got generated
        User = await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User);
    }

    await persistSession({ ...authResponse, persistent, User, keyPassword, api });

    return {
        to: STEPS.DONE,
        session: {
            ...authResponse,
            persistent,
            User,
            keyPassword,
            flow: 'reset',
        },
    };
};

export const handleNewPasswordMnemonic = async ({
    password,
    cache,
}: {
    password: string;
    cache: ResetCacheResult;
}): Promise<ResetActionResponse> => {
    if (!cache.mnemonicData) {
        throw new Error('Missing data');
    }
    const { persistent } = cache;
    const { authApi, decryptedUserKeys, authResponse } = cache.mnemonicData;
    const keySalt = generateKeySalt();
    const keyPassword = await computeKeyPassword(password, keySalt);
    const reEncryptedUserKeys = await Promise.all(
        decryptedUserKeys.map(async ({ ID, privateKey }) => {
            const privateKeyArmored = await encryptPrivateKey(privateKey, keyPassword);
            return {
                ID,
                PrivateKey: privateKeyArmored,
            };
        })
    );
    await srpVerify({
        api: authApi,
        credentials: { password },
        config: mnemonicReset({
            KeysSalt: keySalt,
            UserKeys: reEncryptedUserKeys,
        }),
    });

    const User = await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User);
    await persistSession({ ...authResponse, persistent, User, keyPassword, api: authApi });

    return {
        to: STEPS.DONE,
        session: {
            ...authResponse,
            persistent,
            User,
            keyPassword,
            flow: 'reset',
        },
    };
};

const handleMnemonic = async ({
    username,
    cache,
    api,
    mnemonic,
}: {
    username: string;
    cache: ResetCacheResult;
    api: Api;
    mnemonic: string;
}): Promise<ResetActionResponse> => {
    const randomBytes = await mnemonicToBase64RandomBytes(mnemonic);
    const info = await api<InfoResponse>(getMnemonicAuthInfo(username));
    const authResponse = await srpAuth<AuthResponse>({
        info,
        api,
        config: authMnemonic(username),
        credentials: {
            username,
            password: randomBytes,
        },
    });

    const { UID, AccessToken } = authResponse;
    const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));

    const { MnemonicUserKeys } = await authApi<GetMnemonicResetData>(getMnemonicReset());
    const decryptedUserKeys = (
        await Promise.all(
            MnemonicUserKeys.map(async ({ ID, PrivateKey, Salt }) => {
                const keyPassword = await computeKeyPassword(randomBytes, Salt);
                const privateKey = await decryptPrivateKey(PrivateKey, keyPassword).catch(noop);
                if (!privateKey) {
                    return;
                }
                return {
                    ID,
                    privateKey,
                    publicKey: privateKey.toPublic(),
                };
            })
        )
    ).filter(isTruthy);

    if (!decryptedUserKeys.length) {
        return {
            cache,
            to: STEPS.ERROR,
        };
    }

    return {
        cache: {
            ...cache,
            username,
            method: 'mnemonic',
            value: mnemonic,
            mnemonicData: {
                decryptedUserKeys,
                authApi,
                authResponse,
            },
        },
        to: STEPS.NEW_PASSWORD,
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
    if (method === 'mnemonic') {
        return handleMnemonic({
            cache,
            username,
            mnemonic: value,
            api,
        });
    }
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
    persistent,
    api,
    hasGenerateKeys,
}: {
    username: string;
    persistent: boolean;
    api: Api;
    hasGenerateKeys: boolean;
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
                    persistent,
                    value: username,
                    method: 'email',
                    Methods,
                    hasGenerateKeys,
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
                persistent,
                Methods,
                hasGenerateKeys,
            },
            to: STEPS.REQUEST_RESET_TOKEN,
        };
    } catch (error: any) {
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
