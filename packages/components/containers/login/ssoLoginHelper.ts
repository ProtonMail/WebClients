import { syncAddresses, syncUser } from '@proton/components/containers/login/syncCache';
import { activateAuthDeviceConfig } from '@proton/shared/lib/api/authDevice';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Api, User } from '@proton/shared/lib/interfaces';
import {
    generateKeySaltAndPassphrase,
    getDecryptedUserKeysHelper,
    getResetAddressesKeysV2,
    parseUnprivatizationData,
    setupKeysWithUnprivatization,
    validateUnprivatizationData,
} from '@proton/shared/lib/keys';
import type {
    AuthDeviceOutput,
    DeviceDataSerialized,
    DeviceSecretData,
    DeviceSecretUser,
} from '@proton/shared/lib/keys/device';
import { deleteAuthDevice, getAllAuthDevices } from '@proton/shared/lib/keys/device';
import { AuthDeviceState } from '@proton/shared/lib/keys/device';
import {
    AuthDeviceInactiveError,
    AuthDeviceInvalidError,
    AuthDeviceNonExistingError,
    type DeviceData,
    createAuthDevice,
    createAuthDeviceToActivate,
    encryptAuthDeviceSecret,
    getAuthDeviceDataByUser,
    setPersistedAuthDeviceDataByUser,
} from '@proton/shared/lib/keys/device';
import { changeSSOUserKeysPasswordHelper } from '@proton/shared/lib/keys/password';
import { getOrganizationData, getUnprivatizationContextData } from '@proton/shared/lib/keys/unprivatization/helper';
import noop from '@proton/utils/noop';

import { finalizeLogin } from './finalizeLogin';
import type {
    AuthCacheResult,
    SSOInactiveData,
    SSOPolling,
    SSOPollingErrorCb,
    SSOPollingSuccessCb,
    SSOSetPasswordData,
    SSOSetupData,
    SSOUnlockData,
} from './interface';
import { type AuthActionResponse, AuthStep, SSOLoginCapabilites } from './interface';
import { getUnlockError, handleUnlockKey } from './loginHelper';

export const getSSOIntent = ({ user, authDevices }: { user: User; authDevices: AuthDeviceOutput[] }) => {
    if (!authDevices.length) {
        if (user.Flags['has-temporary-password']) {
            return {
                capabilities: new Set([SSOLoginCapabilites.ASK_ADMIN]),
                step: SSOLoginCapabilites.ASK_ADMIN,
            };
        }
        return {
            capabilities: new Set([SSOLoginCapabilites.ASK_ADMIN, SSOLoginCapabilites.ENTER_BACKUP_PASSWORD]),
            step: SSOLoginCapabilites.ASK_ADMIN,
        };
    }
    return {
        capabilities: new Set([
            SSOLoginCapabilites.ASK_ADMIN,
            SSOLoginCapabilites.ENTER_BACKUP_PASSWORD,
            SSOLoginCapabilites.OTHER_DEVICES,
        ]),
        step: SSOLoginCapabilites.OTHER_DEVICES,
    };
};

export const handleSSODeviceConfirmed = async ({
    cache,
    deviceSecretUser,
}: {
    cache: AuthCacheResult;
    deviceSecretUser: DeviceSecretUser;
}) => {
    return finalizeLogin({
        cache,
        loginPassword: '',
        clearKeyPassword: '',
        keyPassword: deviceSecretUser.keyPassword,
    });
};

export const handleUnlockSSO = async ({
    cache,
    clearKeyPassword,
}: {
    cache: AuthCacheResult;
    clearKeyPassword: string;
}) => {
    const {
        api,
        data: { salts, user, ssoData },
    } = cache;

    if (!salts || !user || !ssoData || ssoData.type === 'set-password') {
        throw new Error('Invalid state');
    }

    await wait(500);

    const unlockResult = await handleUnlockKey(user, salts, clearKeyPassword).catch(() => undefined);
    if (!unlockResult) {
        throw getUnlockError();
    }

    const keyPassword = unlockResult.keyPassword;

    const encryptedSecret = await encryptAuthDeviceSecret({
        keyPassword,
        deviceSecretData: ssoData.deviceData.deviceSecretData,
    });
    await api(
        activateAuthDeviceConfig({
            DeviceID: ssoData.deviceData.deviceOutput.ID,
            EncryptedSecret: encryptedSecret,
        })
    );

    return finalizeLogin({
        cache,
        loginPassword: '',
        clearKeyPassword,
        keyPassword,
    });
};

export const handleSetupSSOUserKeys = async ({
    cache,
    newPassword,
    deviceData,
}: {
    cache: AuthCacheResult;
    newPassword: string;
    deviceData: DeviceData;
}) => {
    const {
        api,
        data: { ssoData, user },
        preAuthKTVerifier,
    } = cache;

    if (ssoData?.type !== 'setup' || !user) {
        throw new Error('Invalid state');
    }
    const {
        parsedUnprivatizationData,
        unprivatizationContextData: { addresses },
    } = ssoData;

    const { passphrase, salt } = await generateKeySaltAndPassphrase(newPassword);
    const { onSKLPublishSuccess, ...resetPayload } = await getResetAddressesKeysV2({
        addresses,
        passphrase,
        preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
    });
    if (!resetPayload.privateKeys || !onSKLPublishSuccess) {
        throw new Error('Missing keys payload');
    }
    const encryptedDeviceSecret = await encryptAuthDeviceSecret({
        keyPassword: passphrase,
        deviceSecretData: deviceData.deviceSecretData,
    });

    const loginPassword = '';

    await setupKeysWithUnprivatization({
        api,
        password: loginPassword,
        parsedUnprivatizationData,
        payload: {
            ...resetPayload,
            salt,
            encryptedDeviceSecret,
        },
    });

    await onSKLPublishSuccess();

    cache.data.user = undefined;
    cache.data.addresses = undefined;

    return finalizeLogin({
        cache,
        loginPassword,
        keyPassword: passphrase,
        clearKeyPassword: newPassword,
    });
};

export const handleChangeSSOUserKeysPassword = async ({
    oldKeyPassword,
    newBackupPassword,
    deviceSecretData,
    cache,
}: {
    oldKeyPassword: string;
    newBackupPassword: string;
    deviceSecretData: DeviceSecretData;
    cache: AuthCacheResult;
}) => {
    const [user] = await Promise.all([cache.data.user || syncUser(cache)]);
    const userKeys = await getDecryptedUserKeysHelper(user, oldKeyPassword);

    const { keyPassword } = await changeSSOUserKeysPasswordHelper({
        newBackupPassword,
        deviceSecretData,
        api: cache.api,
        user,
        userKeys,
    });

    cache.data.user = undefined;
    cache.data.addresses = undefined;

    return finalizeLogin({
        cache,
        loginPassword: '',
        keyPassword,
        clearKeyPassword: newBackupPassword,
        attemptResume: false,
    });
};

export const getSSOSetupData = async ({
    user,
    cache,
}: {
    user: User;
    cache: AuthCacheResult;
}): Promise<SSOSetupData | null> => {
    const { api, verifyOutboundPublicKeys, appName } = cache;

    if (!verifyOutboundPublicKeys) {
        throw new Error('Invalid requirements');
    }

    const [unprivatizationContextData, deviceData] = await Promise.all([
        getUnprivatizationContextData({ api }).catch(noop),
        createAuthDevice({ api }),
    ]);

    if (!unprivatizationContextData) {
        return null;
    }

    await setPersistedAuthDeviceDataByUser({ user, deviceData });

    const parsedUnprivatizationData = await parseUnprivatizationData({
        unprivatizationData: unprivatizationContextData.data,
        addresses: unprivatizationContextData.addresses,
    });

    await validateUnprivatizationData({
        userContext: {
            appName,
            getUser: async () => user,
            getUserKeys: async () => [],
            getAddressKeys: async () => [],
        },
        api,
        verifyOutboundPublicKeys,
        parsedUnprivatizationData,
        options: {
            newMemberCreation: false,
            validateRevision: false,
        },
    });

    return {
        type: 'setup',
        parsedUnprivatizationData,
        unprivatizationContextData,
        deviceData,
        authDevices: [],
        organizationData: unprivatizationContextData.organizationData,
        intent: {
            capabilities: new Set([SSOLoginCapabilites.SETUP_BACKUP_PASSWORD]),
            step: SSOLoginCapabilites.SETUP_BACKUP_PASSWORD,
        },
    };
};

export const getSSOSetPasswordData = ({
    deviceSecretUser,
}: {
    deviceSecretUser: DeviceSecretUser;
}): SSOSetPasswordData => {
    return {
        type: 'set-password',
        keyPassword: deviceSecretUser.keyPassword,
        authDevices: [],
        deviceSecretData: deviceSecretUser.deviceSecretData,
        intent: {
            capabilities: new Set([SSOLoginCapabilites.NEW_BACKUP_PASSWORD]),
            step: SSOLoginCapabilites.NEW_BACKUP_PASSWORD,
        },
    };
};

const createSSOPolling = ({ api, user }: { api: Api; user: User }): SSOPolling => {
    let intervalHandle: ReturnType<typeof setInterval> | undefined;

    const run = async () => {
        try {
            return await getAuthDeviceDataByUser({ user, api, refreshUser: true });
        } catch (e) {
            if (e instanceof AuthDeviceInvalidError) {
                await deleteAuthDevice({ user, api, deviceID: e.deviceID }).catch(noop);
            }
            throw e;
        }
    };

    let id = {};
    let context: { success?: SSOPollingSuccessCb; error?: SSOPollingErrorCb } = {};

    const unsubscribe = () => {
        clearInterval(intervalHandle);
    };

    return {
        addListener: (handleSuccess, handleError) => {
            context.success = handleSuccess;
            context.error = handleError;
            return () => {
                unsubscribe();
                context.success = undefined;
                context.error = undefined;
            };
        },
        start: () => {
            let ignored = 0;
            const handler = () => {
                const documentIsVisible = document.visibilityState === 'visible';
                if (!documentIsVisible && ignored < 3) {
                    ignored++;
                    return;
                }
                ignored = 0;
                const latestId = id;
                run()
                    .then((data) => {
                        if (latestId === id) {
                            context.success?.(data);
                            unsubscribe();
                        }
                    })
                    .catch((e) => {
                        if (latestId === id) {
                            context.error?.(e);
                        }
                    });
            };

            clearInterval(intervalHandle);
            intervalHandle = setInterval(handler, 10_000);
            id = {};

            return unsubscribe;
        },
    };
};

export const getSSOInactiveData = async ({
    deviceDataSerialized,
    cache,
    user: cachedUser,
}: {
    deviceDataSerialized: DeviceDataSerialized;
    cache: AuthCacheResult;
    user: User;
}): Promise<SSOInactiveData> => {
    const { api } = cache;

    const authDevices = await getAllAuthDevices({ user: cachedUser, api });
    const authDeviceSelf = authDevices.find(({ ID }) => {
        return ID === deviceDataSerialized.serializedDeviceData.id;
    });
    // If we can't find ourselves, just throw to create a new device
    if (!authDeviceSelf) {
        throw new AuthDeviceInvalidError(deviceDataSerialized.serializedDeviceData.id, 'Missing device');
    }
    const activeAuthDevicesExceptSelf = authDevices.filter(
        ({ ID, State }) => ID !== deviceDataSerialized.serializedDeviceData.id && State === AuthDeviceState.Active
    );

    const [user, addresses, organizationData] = await Promise.all([
        cache.data.user || syncUser(cache),
        cache.data.addresses || syncAddresses(cache),
        getOrganizationData({ api }),
    ]);

    const address = addresses.find(({ ID }) => ID === authDeviceSelf.ActivationAddressID);
    if (!address) {
        throw new AuthDeviceInvalidError(authDeviceSelf.ID, 'Missing address');
    }

    return {
        type: 'inactive',
        deviceData: {
            deviceOutput: authDeviceSelf,
            deviceSecretData: deviceDataSerialized.deviceSecretData,
        },
        authDevices: activeAuthDevicesExceptSelf,
        address,
        organizationData,
        poll: createSSOPolling({ api, user }),
        intent: getSSOIntent({ user, authDevices: activeAuthDevicesExceptSelf }),
    };
};

export const getSSOUnlockData = async ({ cache }: { cache: AuthCacheResult }): Promise<SSOUnlockData> => {
    const { api, verifyOutboundPublicKeys } = cache;

    if (!verifyOutboundPublicKeys) {
        throw new Error('Invalid requirements');
    }

    let [user, addresses, organizationData] = await Promise.all([
        cache.data.user || syncUser(cache),
        cache.data.addresses || syncAddresses(cache),
        getOrganizationData({ api }),
    ]);

    // Creating a new device
    const primaryAddress = addresses[0];
    const primaryAddressKey = primaryAddress?.Keys?.[0];
    if (!primaryAddress || !primaryAddressKey) {
        throw new Error('Unexpected SSO user missing primary address key ');
    }

    const deviceData = await createAuthDeviceToActivate({ primaryAddressKey, api });
    await setPersistedAuthDeviceDataByUser({ user, deviceData });
    const authDevices = await getAllAuthDevices({ user, api: cache.api });
    const activeAuthDevicesExceptSelf = authDevices.filter(
        ({ ID, State }) => ID !== deviceData.deviceOutput.ID && State === AuthDeviceState.Active
    );

    return {
        type: 'unlock',
        deviceData,
        authDevices: activeAuthDevicesExceptSelf,
        address: primaryAddress,
        organizationData,
        poll: createSSOPolling({ api, user }),
        intent: getSSOIntent({ authDevices: activeAuthDevicesExceptSelf, user }),
    };
};

export const handlePrepareSSOData = async ({ cache }: { cache: AuthCacheResult }): Promise<AuthActionResponse> => {
    const user = cache.data.user;
    if (!user) {
        throw new Error('Invalid state');
    }

    if (user.Keys.length === 0) {
        const ssoData = await getSSOSetupData({ user, cache });
        if (ssoData === null) {
            return finalizeLogin({ cache, loginPassword: '' });
        }
        cache.data.ssoData = ssoData;
        return {
            cache,
            to: AuthStep.SSO,
        };
    }

    // Attempt to use device secret
    try {
        const deviceSecretUser = await getAuthDeviceDataByUser({ user, api: cache.api });
        if (user.Flags['has-temporary-password']) {
            cache.data.ssoData = getSSOSetPasswordData({ deviceSecretUser });
            return {
                cache,
                to: AuthStep.SSO,
            };
        }
        return await finalizeLogin({
            cache,
            loginPassword: '',
            clearKeyPassword: '',
            keyPassword: deviceSecretUser.keyPassword,
        });
    } catch (e) {
        if (e instanceof AuthDeviceInactiveError) {
            const deviceDataSerialized = e.deviceDataSerialized;
            const ssoInactiveData = await getSSOInactiveData({ user, deviceDataSerialized, cache });
            cache.data.ssoData = ssoInactiveData;

            return {
                cache,
                to: AuthStep.SSO,
            };
        }

        if (e instanceof AuthDeviceNonExistingError || e instanceof AuthDeviceInvalidError) {
            if (e instanceof AuthDeviceInvalidError) {
                await deleteAuthDevice({
                    api: cache.api,
                    user,
                    deviceID: e.deviceID,
                }).catch(noop);
            }

            // Fall through to create
        } else {
            throw e;
        }
    }

    // "Login with a device having no secret", step 3
    const ssoUnlockData = await getSSOUnlockData({ cache });
    cache.data.ssoData = ssoUnlockData;
    return {
        cache,
        to: AuthStep.SSO,
    };
};
