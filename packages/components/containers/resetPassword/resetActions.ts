import { CryptoProxy } from '@proton/crypto';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth, authMnemonic, getMnemonicAuthInfo } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { resetKeysRoute } from '@proton/shared/lib/api/keys';
import { requestLoginResetToken } from '@proton/shared/lib/api/reset';
import { getSettings } from '@proton/shared/lib/api/settings';
import { GetMnemonicResetData, getMnemonicReset, mnemonicReset } from '@proton/shared/lib/api/settingsMnemonic';
import { getRecoveryMethods, getUser } from '@proton/shared/lib/api/user';
import { AuthResponse, InfoResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import {
    Api,
    KeyTransparencyActivation,
    ResetSelfAudit,
    UserSettings,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import {
    generateKeySaltAndPassphrase,
    getDecryptedUserKeysHelper,
    getRequiresPasswordSetup,
    getResetAddressesKeysV2,
    handleSetupAddressKeys,
} from '@proton/shared/lib/keys';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic';
import {
    attemptDeviceRecovery,
    getIsDeviceRecoveryAvailable,
    removeDeviceRecovery,
    storeDeviceRecovery,
} from '@proton/shared/lib/recoveryFile/deviceRecovery';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';
import { computeKeyPassword, generateKeySalt } from '@proton/srp';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { createPreAuthKTVerifier } from '../keyTransparency';
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
    const {
        username,
        token,
        resetResponse,
        persistent,
        appName,
        ktActivation,
        hasTrustedDeviceRecovery,
        resetSelfAudit,
    } = cache;
    if (!resetResponse || !token) {
        throw new Error('Missing response');
    }
    const { Addresses: addresses } = resetResponse;

    const { preAuthKTVerify, preAuthKTCommit } = createPreAuthKTVerifier(ktActivation, api);

    const { passphrase, salt } = await generateKeySaltAndPassphrase(password);
    const { addressKeysPayload, userKeyPayload } = await getResetAddressesKeysV2({
        addresses,
        passphrase,
        preAuthKTVerify,
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

    const authResponse = await srpAuth({
        api,
        credentials: { username, password },
        config: auth({ Username: username }, persistent),
    }).then((response): Promise<AuthResponse> => response.json());
    let user = await api<{ User: tsUser }>(getUser()).then(({ User }) => User);
    let keyPassword = passphrase;

    if (user.Keys.length === 0) {
        if (getRequiresPasswordSetup(user, cache.setupVPN)) {
            const [domains, addresses] = await Promise.all([
                api<{ Domains: string[] }>(queryAvailableDomains('signup')).then(({ Domains }) => Domains),
                await getAllAddresses(api),
            ]);

            keyPassword = await handleSetupAddressKeys({
                api,
                username,
                password,
                addresses,
                domains,
                preAuthKTVerify,
            });
            // Refetch the user to update the keys that got generated
            user = await api<{ User: tsUser }>(getUser()).then(({ User }) => User);
        }
    }

    let trusted = false;
    if (hasTrustedDeviceRecovery && keyPassword) {
        const addresses = await getAllAddresses(api);
        const numberOfReactivatedKeys = await attemptDeviceRecovery({
            api,
            user,
            addresses,
            keyPassword,
            preAuthKTVerify,
        }).catch(noop);

        if (numberOfReactivatedKeys !== undefined && numberOfReactivatedKeys > 0) {
            // Refetch user with new reactivated keys
            user = await api<{ User: tsUser }>(getUser()).then(({ User }) => User);
        }

        // Store device recovery information
        if (persistent) {
            const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
            const isDeviceRecoveryAvailable = getIsDeviceRecoveryAvailable({
                user,
                addresses,
                userKeys,
                appName,
            });

            if (isDeviceRecoveryAvailable) {
                const userSettings = await api<{ UserSettings: UserSettings }>(getSettings()).then(
                    ({ UserSettings }) => UserSettings
                );

                if (userSettings.DeviceRecovery) {
                    await storeDeviceRecovery({ api, user, userKeys });
                    trusted = true;
                }
            }
        } else {
            removeDeviceRecovery(user.ID);
        }
    }

    await persistSession({ ...authResponse, persistent, trusted, User: user, keyPassword, api });

    await preAuthKTCommit(user.ID);
    await resetSelfAudit(user, keyPassword, addresses);

    return {
        to: STEPS.DONE,
        session: {
            ...authResponse,
            persistent,
            trusted,
            User: user,
            loginPassword: password,
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
    const { api, decryptedUserKeys, authResponse } = cache.mnemonicData;
    const keySalt = generateKeySalt();
    const keyPassword = await computeKeyPassword(password, keySalt);
    const reEncryptedUserKeys = await Promise.all(
        decryptedUserKeys.map(async ({ ID, privateKey }) => {
            const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                privateKey: privateKey,
                passphrase: keyPassword,
            });
            return {
                ID,
                PrivateKey: privateKeyArmored,
            };
        })
    );
    await srpVerify({
        api,
        credentials: { password },
        config: mnemonicReset({
            KeysSalt: keySalt,
            UserKeys: reEncryptedUserKeys,
        }),
    });

    const trusted = false;
    const user = await api<{ User: tsUser }>(getUser()).then(({ User }) => User);
    await persistSession({ ...authResponse, persistent, trusted, User: user, keyPassword, api });

    return {
        to: STEPS.DONE,
        session: {
            ...authResponse,
            persistent,
            trusted,
            User: user,
            loginPassword: password,
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
    const authResponse = await srpAuth({
        info,
        api,
        config: authMnemonic(username, cache.persistent),
        credentials: {
            username,
            password: randomBytes,
        },
    }).then((response): Promise<AuthResponse> => response.json());

    const { MnemonicUserKeys } = await api<GetMnemonicResetData>(getMnemonicReset());
    const decryptedUserKeys = (
        await Promise.all(
            MnemonicUserKeys.map(async ({ ID, PrivateKey, Salt }) => {
                const keyPassword = await computeKeyPassword(randomBytes, Salt);
                const privateKey = await CryptoProxy.importPrivateKey({
                    armoredKey: PrivateKey,
                    passphrase: keyPassword,
                }).catch(noop);
                if (!privateKey) {
                    return;
                }
                const publicKey = await CryptoProxy.importPublicKey({
                    binaryKey: await CryptoProxy.exportPublicKey({ key: privateKey, format: 'binary' }),
                });
                return {
                    ID,
                    privateKey,
                    publicKey,
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
                api,
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
    resetResponse,
    cache,
    token,
}: {
    resetResponse: ValidateResetTokenResponse;
    cache: ResetCacheResult;
    token: string;
}): Promise<ResetActionResponse> => {
    return {
        to: STEPS.NEW_PASSWORD,
        cache: {
            ...cache,
            token,
            resetResponse,
        },
    };
};

export const handleRequestRecoveryMethods = async ({
    setupVPN,
    appName,
    username,
    persistent,
    api,
    hasTrustedDeviceRecovery,
    ktActivation,
    resetSelfAudit,
}: {
    setupVPN: boolean;
    appName: APP_NAMES;
    username: string;
    persistent: boolean;
    api: Api;
    hasTrustedDeviceRecovery: boolean;
    ktActivation: KeyTransparencyActivation;
    resetSelfAudit: ResetSelfAudit;
}): Promise<ResetActionResponse> => {
    try {
        const { Type, Methods }: { Type: AccountType; Methods: RecoveryMethod[] } = await api(
            getRecoveryMethods(username)
        );
        if (Type === 'external' && Methods.length === 1 && Methods.includes('login')) {
            await api(requestLoginResetToken({ Username: username, Email: username }));
            return {
                cache: {
                    setupVPN,
                    appName,
                    username,
                    persistent,
                    value: username,
                    method: 'email',
                    Methods,
                    type: Type,
                    hasTrustedDeviceRecovery,
                    ktActivation,
                    resetSelfAudit,
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
                setupVPN,
                appName,
                username,
                persistent,
                Methods,
                type: Type,
                hasTrustedDeviceRecovery,
                ktActivation,
                resetSelfAudit,
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
