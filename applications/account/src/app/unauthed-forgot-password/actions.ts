import type { AuthFlows, AuthSession } from '@proton/components/containers/login/interface';
import type { MnemonicData } from '@proton/components/containers/resetPassword/interface';
import { CryptoProxy, toPublicKeyReference } from '@proton/crypto';
import { createPreAuthKTVerifier, resetSelfAudit } from '@proton/key-transparency/shared';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth, authMnemonic, getMnemonicAuthInfo } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { resetKeysRoute } from '@proton/shared/lib/api/keys';
import type { AccountType, RecoveryMethod, ValidateResetTokenResponse } from '@proton/shared/lib/api/reset';
import type { GetMnemonicResetData } from '@proton/shared/lib/api/settingsMnemonic';
import { getMnemonicReset, mnemonicReset } from '@proton/shared/lib/api/settingsMnemonic';
import { getRecoveryMethods } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse, InfoResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { getResetAddressesKeysV2 } from '@proton/shared/lib/keys/resetKeys';
import { getRequiresPasswordSetup } from '@proton/shared/lib/keys/setupAddress';
import { handleSetupAddressKeys } from '@proton/shared/lib/keys/setupAddressKeys';
import { mnemonicToBase64RandomBytes } from '@proton/shared/lib/mnemonic/bip39Wrapper';
import { getKeysFromDeviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import { deviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecoveryHelper';
import { srpAuth, srpVerify } from '@proton/shared/lib/srp';
import { computeKeyPassword, generateKeySalt } from '@proton/srp/lib';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

export class NoResetMethodsError extends Error {
    public reason?: string;
    constructor(reason?: string) {
        super('No reset methods found');
        this.reason = reason;
    }
}

export const handleRequestRecoveryMethods = async ({ username, api }: { username: string; api: Api }) => {
    try {
        const {
            Type,
            Methods,
            Email,
            Phone,
        }: { Type: AccountType; Methods: RecoveryMethod[]; Email: string; Phone: string } = await api(
            getRecoveryMethods(username)
        );

        if (!Methods.length) {
            throw new NoResetMethodsError();
        }

        return {
            methods: Methods,
            accountType: Type,
            username,
            redactedEmail: Email,
            redactedPhoneNumber: Phone,
        };
    } catch (error: any) {
        const { data: { Code, Error } = { Code: 0, Error: '' } } = error;
        if ([API_CUSTOM_ERROR_CODES.NO_RESET_METHODS].includes(Code)) {
            throw new NoResetMethodsError(Error);
        }
        throw error;
    }
};

export class NoKeysDecryptedUsingPhraseError extends Error {
    public reason?: string;
    constructor(reason?: string) {
        super('No keys were decrypted using the phrase');
        this.reason = reason;
    }
}

export const authMnemonicAndGetKeys = async ({
    username,
    mnemonic,
    persistent,
    api,
}: {
    username: string;
    mnemonic: string;
    persistent: boolean;
    api: Api;
}): Promise<Omit<MnemonicData, 'api'>> => {
    const randomBytes = await mnemonicToBase64RandomBytes(mnemonic);
    const info = await api<InfoResponse>(getMnemonicAuthInfo(username));
    const authResponse = await srpAuth({
        info,
        api,
        config: authMnemonic(username, persistent),
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
                const publicKey = await toPublicKeyReference(privateKey);
                return {
                    ID,
                    privateKey,
                    publicKey,
                };
            })
        )
    ).filter(isTruthy);

    if (!decryptedUserKeys.length) {
        throw new NoKeysDecryptedUsingPhraseError();
    }

    return {
        authResponse,
        decryptedUserKeys,
    };
};

export const performPasswordReset = async ({
    newPassword,
    username,
    ownershipVerificationCode,
    resetResponse,
    persistent,
    appName,
    productParam,
    ktActivation,
    setupVPN,
    api,
}: {
    newPassword: string;
    username: string;
    ownershipVerificationCode: string;
    resetResponse: ValidateResetTokenResponse;
    persistent: boolean;
    appName: APP_NAMES;
    productParam: ProductParam;
    ktActivation: KeyTransparencyActivation;
    setupVPN: boolean;
    api: Api;
}): Promise<AuthSession> => {
    const { Addresses: addresses, SupportPgpV6Keys } = resetResponse;

    const preAuthKTVerifier = createPreAuthKTVerifier(ktActivation);

    const { passphrase, salt } = await generateKeySaltAndPassphrase(newPassword);
    const { addressKeysPayload, userKeyPayload, onSKLPublishSuccess } = await getResetAddressesKeysV2({
        addresses,
        passphrase,
        preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        supportV6Keys: SupportPgpV6Keys === 1,
    });

    await srpVerify({
        api,
        credentials: { password: newPassword },
        config: resetKeysRoute({
            Username: username,
            Token: ownershipVerificationCode,
            KeySalt: salt,
            PrimaryKey: userKeyPayload,
            AddressKeys: addressKeysPayload,
        }),
    });

    if (onSKLPublishSuccess) {
        await onSKLPublishSuccess();
    }

    const authResponse = await srpAuth({
        api,
        credentials: { username, password: newPassword },
        config: auth({ Username: username }, persistent),
    }).then((response): Promise<AuthResponse> => response.json());
    let user = await getUser(api);
    let keyPassword = passphrase;

    if (user.Keys.length === 0) {
        if (getRequiresPasswordSetup(user, setupVPN)) {
            const [domains, addresses] = await Promise.all([
                api<{ Domains: string[] }>(queryAvailableDomains('signup')).then(({ Domains }) => Domains),
                await getAllAddresses(api),
            ]);

            keyPassword = await handleSetupAddressKeys({
                api,
                username,
                password: newPassword,
                addresses,
                domains,
                preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
                productParam,
            });
            // Refetch the user to update the keys that got generated
            user = await getUser(api);
        }
    }

    const deviceRecoveryResult = await deviceRecovery({
        api,
        keyPassword,
        persistent,
        appName,
        addresses: undefined,
        user,
        preAuthKTVerifier,
    });
    const trusted = deviceRecoveryResult.trusted;
    user = deviceRecoveryResult.user;

    const sessionResult = await persistSession({
        ...authResponse,
        clearKeyPassword: newPassword,
        keyPassword,
        persistent,
        trusted,
        User: user,
        api,
        source: SessionSource.Proton,
    });

    await preAuthKTVerifier.preAuthKTCommit(user.ID, api);
    await resetSelfAudit({ api, ktActivation, user, keyPassword, addressesBeforeReset: addresses });

    return {
        data: sessionResult,
        loginPassword: newPassword,
        flow: 'reset' as AuthFlows,
    };
};

export const performPasswordChangeViaMnemonic = async ({
    newPassword,
    mnemonicData,
    persistent,
    api,
}: {
    newPassword: string;
    mnemonicData: MnemonicData;
    persistent: boolean;
    api: Api;
}): Promise<AuthSession> => {
    const { decryptedUserKeys, authResponse } = mnemonicData;
    const keySalt = generateKeySalt();
    const keyPassword = await computeKeyPassword(newPassword, keySalt);
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
        credentials: { password: newPassword },
        config: mnemonicReset({
            KeysSalt: keySalt,
            UserKeys: reEncryptedUserKeys,
        }),
    });

    const trusted = false;
    const user = await getUser(api);
    const sessionResult = await persistSession({
        ...authResponse,
        clearKeyPassword: newPassword,
        keyPassword,
        persistent,
        trusted,
        User: user,
        api,
        source: SessionSource.Proton,
    });

    return {
        data: sessionResult,
        loginPassword: newPassword,
        flow: 'reset' as AuthFlows,
    };
};

export enum DeviceRecoveryLevel {
    FULL,
    PARTIAL,
    NONE,
}

export const getDeviceRecoveryLevel = async (resetResponse: ValidateResetTokenResponse) => {
    // Get secret from device recovery file and decrypt the keys
    const decryptedRecoveryKeys = await getKeysFromDeviceRecovery(resetResponse.UserID, resetResponse.UserKeys);
    if (!decryptedRecoveryKeys) {
        return DeviceRecoveryLevel.NONE;
    }

    const decryptedRecoveryKeyFingerprints = decryptedRecoveryKeys.map((key) => key.getFingerprint());
    const activeKeys = resetResponse.UserKeys.filter((keys) => keys.Active);

    // Check if all active keys' fingerprints is available in the decrypted keys' fingerprints list
    const canRecoverFully = activeKeys.every((key) => decryptedRecoveryKeyFingerprints.includes(key.Fingerprint));

    if (canRecoverFully) {
        return DeviceRecoveryLevel.FULL;
    }

    // Check if any user keys' fingerprints is available in the decrypted keys' fingerprints list
    const canRecoverPartially = resetResponse.UserKeys.some((key) =>
        decryptedRecoveryKeyFingerprints.includes(key.Fingerprint)
    );

    if (canRecoverPartially) {
        return DeviceRecoveryLevel.PARTIAL;
    } else {
        return DeviceRecoveryLevel.NONE;
    }
};
