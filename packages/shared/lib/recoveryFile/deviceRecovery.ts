import { getAllKeysReactivationRequests } from '@proton/components/containers/keys/reactivateKeys/getAllKeysToReactive';
import getLikelyHasKeysToReactivate from '@proton/components/containers/keys/reactivateKeys/getLikelyHasKeysToReactivate';
import { KeyReactivationRequestStateData } from '@proton/components/containers/keys/reactivateKeys/interface';
import { getInitialStates } from '@proton/components/containers/keys/reactivateKeys/state';
import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { APP_NAMES } from '@proton/shared/lib/constants';
import arraysContainSameElements from '@proton/utils/arraysContainSameElements';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import uniqueBy from '@proton/utils/uniqueBy';

import { setNewRecoverySecret } from '../api/settingsRecovery';
import authentication from '../authentication/authentication';
import { getItem, removeItem, setItem } from '../helpers/storage';
import { Address, Api, DecryptedKey, KeyPair, PreAuthKTVerify, User, UserSettings } from '../interfaces';
import { getDecryptedAddressKeysHelper, getDecryptedUserKeysHelper, reactivateKeysProcess } from '../keys';
import {
    generateRecoveryFileMessage,
    generateRecoverySecret,
    getIsRecoveryFileAvailable,
    getKeyWithRecoverySecret,
    getRecoverySecrets,
    parseRecoveryFiles,
    validateRecoverySecret,
} from './recoveryFile';

const getRecoveryMessageId = (userID: string) => `dr-${userID}`;

const setRecoveryMessage = (userID: string, recoveryMessage: string) => {
    setItem(getRecoveryMessageId(userID), recoveryMessage);
};

const getRecoveryMessage = (userID: string) => {
    return getItem(getRecoveryMessageId(userID));
};

export const getHasRecoveryMessage = (userID: string) => {
    return !!getRecoveryMessage(userID);
};
export const removeDeviceRecovery = (userID: string) => {
    removeItem(getRecoveryMessageId(userID));
};

export const getKeysFromDeviceRecovery = async (user: User) => {
    const recoveryMessage = getRecoveryMessage(user.ID);
    const recoverySecrets = getRecoverySecrets(user.Keys);

    if (!recoveryMessage || !recoverySecrets.length) {
        return;
    }

    const armouredKeys = await parseRecoveryFiles([recoveryMessage], recoverySecrets);

    return Promise.all(
        armouredKeys.map(({ armoredKey }) => CryptoProxy.importPrivateKey({ armoredKey, passphrase: null }))
    );
};

export const attemptDeviceRecovery = async ({
    user,
    addresses,
    keyPassword,
    api,
    preAuthKTVerify,
}: {
    user: User;
    addresses: Address[] | undefined;
    keyPassword: string;
    api: Api;
    preAuthKTVerify: PreAuthKTVerify;
}) => {
    const privateUser = Boolean(user.Private);
    if (!addresses || !privateUser) {
        return;
    }

    const hasKeysToReactivate = getLikelyHasKeysToReactivate(user, addresses);
    if (!hasKeysToReactivate) {
        return;
    }

    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    const addressesKeys = await Promise.all(
        addresses.map(async (address) => {
            return {
                address,
                keys: await getDecryptedAddressKeysHelper(address.Keys, user, userKeys, keyPassword),
            };
        })
    );

    const allKeysToReactivate = getAllKeysReactivationRequests(addressesKeys, user, userKeys);
    const initialStates = await getInitialStates(allKeysToReactivate);
    const keys = await getKeysFromDeviceRecovery(user);

    if (!keys) {
        return;
    }

    const mapToUploadedPrivateKey = ({ id, Key, fingerprint }: KeyReactivationRequestStateData) => {
        const uploadedPrivateKey = keys.find((decryptedBackupKey) => {
            return fingerprint === decryptedBackupKey.getFingerprint();
        });
        if (!uploadedPrivateKey) {
            return;
        }
        return {
            id,
            Key,
            privateKey: uploadedPrivateKey,
        };
    };

    const keyReactivationRecords = initialStates
        .map((keyReactivationRecordState) => {
            const uploadedKeysToReactivate = keyReactivationRecordState.keysToReactivate
                .map(mapToUploadedPrivateKey)
                .filter(isTruthy);

            if (!uploadedKeysToReactivate.length) {
                return;
            }

            return {
                ...keyReactivationRecordState,
                keysToReactivate: uploadedKeysToReactivate,
            };
        })
        .filter(isTruthy);

    const keyTransparencyVerify = preAuthKTVerify(userKeys);

    let numberOfReactivatedKeys = 0;
    await reactivateKeysProcess({
        api,
        user,
        userKeys,
        addresses,
        keyReactivationRecords,
        keyPassword,
        onReactivation: (_, result) => {
            if (result === 'ok') {
                numberOfReactivatedKeys++;
            }
        },
        keyTransparencyVerify,
    });

    return numberOfReactivatedKeys;
};

const storeRecoveryMessage = async ({
    user,
    userKeys,
    recoverySecret,
}: {
    user: User;
    userKeys: KeyPair[];
    recoverySecret: string;
}) => {
    const currentDeviceRecoveryKeys = (await getKeysFromDeviceRecovery(user)) || [];

    // Merge current device recovery keys with new keys to store. This way the act of storing device recovery information is not destructive.
    const keysToStore = [...userKeys.map(({ privateKey }) => privateKey), ...currentDeviceRecoveryKeys];
    const uniqueKeysToStore = uniqueBy(keysToStore, (key: PrivateKeyReference) => key.getFingerprint());

    const recoveryMessage = await generateRecoveryFileMessage({ recoverySecret, privateKeys: uniqueKeysToStore });
    setRecoveryMessage(user.ID, recoveryMessage);
};

export const storeDeviceRecovery = async ({
    api,
    user,
    userKeys,
}: {
    api: Api;
    user: User;
    userKeys: DecryptedKey[];
}) => {
    const privateUser = Boolean(user.Private);
    if (!privateUser) {
        return;
    }

    const primaryUserKey = userKeys?.[0];
    if (!primaryUserKey) {
        return;
    }

    const primaryRecoverySecret = getKeyWithRecoverySecret(user.Keys.find((key) => key.ID === primaryUserKey.ID));
    if (!primaryRecoverySecret) {
        const { recoverySecret, signature } = await generateRecoverySecret(primaryUserKey.privateKey);

        const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });
        await silentApi(
            setNewRecoverySecret({
                RecoverySecret: recoverySecret,
                Signature: signature,
            })
        );

        await storeRecoveryMessage({ user, userKeys, recoverySecret });
        return;
    }

    const valid = await validateRecoverySecret(primaryRecoverySecret, primaryUserKey.publicKey).catch(noop);
    if (!valid) {
        return;
    }

    await storeRecoveryMessage({
        user,
        userKeys,
        recoverySecret: primaryRecoverySecret.RecoverySecret,
    });
};

export const getIsDeviceRecoveryAvailable = getIsRecoveryFileAvailable;

export const getIsDeviceRecoveryEnabled = (userSettings: UserSettings) => {
    return userSettings.DeviceRecovery && authentication.getTrusted();
};

export const syncDeviceRecovery = async ({
    api,
    user,
    userKeys,
    userSettings,
    appName,
    addresses,
    signal,
}: {
    api: Api;
    user: User;
    userKeys: DecryptedKey[];
    userSettings: UserSettings;
    appName: APP_NAMES;
    addresses: Address[];
    signal?: AbortSignal;
}) => {
    const hasRecoveryMessage = getHasRecoveryMessage(user.ID);
    const isDeviceRecoveryEnabled = getIsDeviceRecoveryEnabled(userSettings);

    const shouldRemoveDeviceRecovery = hasRecoveryMessage && !isDeviceRecoveryEnabled;
    if (shouldRemoveDeviceRecovery) {
        removeDeviceRecovery(user.ID);
        return;
    }

    const isRecoveryFileAvailable = getIsRecoveryFileAvailable({
        user,
        addresses,
        userKeys,
        appName,
    });
    const isDeviceRecoveryAvailable = authentication.getTrusted() && isRecoveryFileAvailable;

    const privateKeyFingerPrints = userKeys?.map((key) => key.privateKey.getFingerprint()) || [];

    const shouldStoreDeviceRecovery = isDeviceRecoveryAvailable && (isDeviceRecoveryEnabled || hasRecoveryMessage);
    if (!privateKeyFingerPrints.length || !shouldStoreDeviceRecovery) {
        return;
    }

    const storedKeys = (await getKeysFromDeviceRecovery(user)) || [];
    if (signal?.aborted) {
        return;
    }
    const storedKeyFingerprints = storedKeys.map((key) => key.getFingerprint());
    const userKeysHaveUpdated = !arraysContainSameElements(storedKeyFingerprints, privateKeyFingerPrints);

    if (!userKeysHaveUpdated) {
        return;
    }

    await storeDeviceRecovery({ api, user, userKeys });
    return true;
};
