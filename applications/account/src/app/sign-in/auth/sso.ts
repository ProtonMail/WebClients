import {
    parseUnprivatizationData,
    setupKeysWithUnprivatization,
    validateUnprivatizationData,
} from '@proton/account/members/unprivatization';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { activateAuthDeviceConfig } from '@proton/shared/lib/api/authDevice';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { BackupPasswordError } from '@proton/shared/lib/authentication/error';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { handleUnlockKey } from '@proton/shared/lib/authentication/unlockKey';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Address, Api, KeySalt, User } from '@proton/shared/lib/interfaces';
import {
    generateKeySaltAndPassphrase,
    getDecryptedUserKeysHelper,
    getResetAddressesKeysV2,
} from '@proton/shared/lib/keys';
import type {
    AuthDeviceOutput,
    DeviceDataSerialized,
    DeviceSecretData,
    DeviceSecretUser,
} from '@proton/shared/lib/keys/device';
import {
    AuthDeviceInactiveError,
    AuthDeviceInvalidError,
    AuthDeviceNonExistingError,
    AuthDeviceState,
    createAuthDevice,
    createAuthDeviceToActivate,
    deleteAuthDevice,
    encryptAuthDeviceSecret,
    getAllAuthDevices,
    getAuthDeviceDataByUser,
    setPersistedAuthDeviceDataByUser,
} from '@proton/shared/lib/keys/device';
import { changeSSOUserKeysPasswordHelper } from '@proton/shared/lib/keys/password';
import { getOrganizationData, getUnprivatizationContextData } from '@proton/shared/lib/keys/unprivatization/helper';
import getRandomString from '@proton/utils/getRandomString';
import noop from '@proton/utils/noop';

import type { AuthSession } from '../../content/authSession';
import { finalizeSignIn } from './finalizeSignIn';
import {
    type SSODataTypes,
    type SSOInactiveData,
    SSOLoginCapabilites,
    type SSOSetPasswordData,
    type SSOSetupData,
    type SSOUnlockData,
} from './interface';
import type { LoginFlowContext } from './loginFlowContext';

/**
 * Whether the organization disabled the SSO backup password. Only present on SSO login responses.
 */
export const getBackupPasswordDisabled = (authResponse: AuthResponse) =>
    authResponse.SSOBackupPasswordDisabled === true;

/**
 * Whether the member is signing in for the first time since being converted to SSO.
 */
export const getFirstLoginAfterConversion = (authResponse: AuthResponse) =>
    authResponse.FirstLoginAfterConversion === true;

const getSSOIntent = ({
    user,
    authDevices,
    backupPasswordDisabled,
    firstLoginAfterConversion,
}: {
    user: User;
    authDevices: AuthDeviceOutput[];
    backupPasswordDisabled: boolean;
    firstLoginAfterConversion: boolean;
}) => {
    // A member converted to SSO gets a dedicated screen the first time they sign in, which leads to
    // the backup password: their pre-conversion password, kept as one even when the organization
    // disabled backup passwords
    if (firstLoginAfterConversion) {
        return {
            capabilities: new Set([
                SSOLoginCapabilites.FIRST_LOGIN_AFTER_CONVERSION,
                SSOLoginCapabilites.ENTER_BACKUP_PASSWORD,
                SSOLoginCapabilites.ASK_ADMIN,
            ]),
            step: SSOLoginCapabilites.FIRST_LOGIN_AFTER_CONVERSION,
        };
    }

    const hasOtherDevices = authDevices.length > 0;

    // Nothing to enter for a member of an organization that disabled the backup password, nor for
    // one still on an administrator-set temporary password. Either way the only ways in are another
    // device or an administrator.
    const canEnterBackupPassword = !backupPasswordDisabled && !user.Flags['has-temporary-password'];

    // Ordered by precedence: the member lands on the first capability
    const capabilities = [
        ...(hasOtherDevices ? [SSOLoginCapabilites.OTHER_DEVICES] : []),
        SSOLoginCapabilites.ASK_ADMIN,
        ...(canEnterBackupPassword ? [SSOLoginCapabilites.ENTER_BACKUP_PASSWORD] : []),
    ];

    return {
        capabilities: new Set(capabilities),
        step: capabilities[0],
    };
};

const getIntent = (context: LoginFlowContext, user: User, authDevices: AuthDeviceOutput[]) =>
    getSSOIntent({
        user,
        authDevices,
        backupPasswordDisabled: getBackupPasswordDisabled(context.authResponse),
        firstLoginAfterConversion: getFirstLoginAfterConversion(context.authResponse),
    });

const getSSOSetPasswordData = async (
    context: LoginFlowContext,
    {
        deviceSecret,
        organizationData: maybeOrganizationData,
    }: {
        /** The key password, and the device secret to re-encrypt with the new backup password. */
        deviceSecret: Pick<DeviceSecretUser, 'keyPassword' | 'deviceSecretData'>;
        organizationData?: SSODataTypes['organizationData'];
    }
): Promise<SSOSetPasswordData> => {
    const organizationData = maybeOrganizationData ?? (await getOrganizationData({ api: context.api }));
    // Nothing to choose when the backup password is disabled: the keys are re-encrypted with a
    // random password instead of one the member picks
    const step = getBackupPasswordDisabled(context.authResponse)
        ? SSOLoginCapabilites.NEW_BACKUP_PASSWORD_DISABLED
        : SSOLoginCapabilites.NEW_BACKUP_PASSWORD;
    return {
        type: 'set-password',
        keyPassword: deviceSecret.keyPassword,
        authDevices: [],
        deviceSecretData: deviceSecret.deviceSecretData,
        organizationData: organizationData,
        intent: {
            capabilities: new Set([step]),
            step,
        },
    };
};

/**
 * Unlocks the keys with the backup password, activates this device, then signs in.
 * A wrong password throws a `PasswordError`, so the caller can let the user retry.
 * A member who still has a temporary password gets no session yet, like after a device approval (see
 * `confirmSSODevice`): it would be persisted, so reloading the page would sign them in without a new backup password.
 */
export const unlockSSO = async (
    context: LoginFlowContext,
    {
        user,
        salts,
        addresses,
        ssoData,
        clearKeyPassword,
    }: {
        user: User;
        salts: KeySalt[];
        addresses: Address[] | undefined;
        ssoData: SSODataTypes;
        clearKeyPassword: string;
    }
): Promise<SSOSignInResult> => {
    if (ssoData.type === 'set-password') {
        throw new Error('Invalid state');
    }

    await wait(500);

    const unlockResult = await handleUnlockKey(user, salts, clearKeyPassword).catch(() => undefined);
    if (!unlockResult) {
        throw new BackupPasswordError();
    }

    const keyPassword = unlockResult.keyPassword;

    const encryptedSecret = await encryptAuthDeviceSecret({
        keyPassword,
        deviceSecretData: ssoData.deviceData.deviceSecretData,
    });
    await context.api(
        activateAuthDeviceConfig({
            DeviceID: ssoData.deviceData.deviceOutput.ID,
            EncryptedSecret: encryptedSecret,
        })
    );

    if (user.Flags['has-temporary-password']) {
        return {
            type: 'set-password',
            ssoData: await getSSOSetPasswordData(context, {
                deviceSecret: { keyPassword, deviceSecretData: ssoData.deviceData.deviceSecretData },
                organizationData: ssoData.organizationData,
            }),
            user,
        };
    }

    return {
        type: 'session',
        session: await finalizeSignIn(context, {
            user,
            addresses,
            loginPassword: '',
            clearKeyPassword,
            keyPassword,
            source: SessionSource.Saml,
        }),
    };
};

/**
 * When the organization has disabled the SSO backup password there is no user-chosen password to
 * derive the key passphrase from, so a random one is generated instead. It is never shown to the
 * user: the passphrase is only recoverable through the device secret, which means signing in on a
 * new device always requires another device or an administrator to approve it.
 */
const generateRandomBackupPassword = () => getRandomString(32);

/** Sets up the keys of a member joining the organization through SSO, then signs in. */
export const setupSSOUserKeys = async (
    context: LoginFlowContext,
    {
        ssoData,
        newPassword,
    }: {
        ssoData: SSOSetupData;
        /** Null when the organization disabled the backup password, see {@link generateRandomBackupPassword} */
        newPassword: string | null;
    }
): Promise<AuthSession> => {
    const { api, preAuthKTVerifier } = context;
    const {
        deviceData,
        parsedUnprivatizationData,
        unprivatizationContextData: { addresses },
    } = ssoData;

    const backupPassword = newPassword ?? generateRandomBackupPassword();

    const { passphrase, salt } = await generateKeySaltAndPassphrase(backupPassword);
    const { onSKLPublishSuccess, ...resetPayload } = await getResetAddressesKeysV2({
        addresses,
        passphrase,
        supportV6Keys: false, // pqc: TODO (future)
        preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
    });
    if (!resetPayload.privateKeys || !onSKLPublishSuccess) {
        throw new Error('Missing keys payload');
    }
    const encryptedDeviceSecret = await encryptAuthDeviceSecret({
        keyPassword: passphrase,
        deviceSecretData: deviceData.deviceSecretData,
    });

    await setupKeysWithUnprivatization({
        api,
        password: backupPassword,
        parsedUnprivatizationData,
        payload: {
            ...resetPayload,
            salt,
            encryptedDeviceSecret,
        },
    });

    await onSKLPublishSuccess();

    // The keys just changed, so the session is created from freshly fetched data
    return finalizeSignIn(context, {
        user: undefined,
        addresses: undefined,
        loginPassword: '',
        keyPassword: passphrase,
        // Deliberately empty when the backup password is disabled, so that no offline key is
        // derived from a password the user has no way of entering
        clearKeyPassword: newPassword ?? '',
        source: SessionSource.Saml,
    });
};

/** Re-encrypts the keys with a new backup password (or a random one when disabled), then signs in. */
export const changeSSOUserKeysPassword = async (
    context: LoginFlowContext,
    {
        user: maybeUser,
        oldKeyPassword,
        newBackupPassword,
        deviceSecretData,
    }: {
        user: User | undefined;
        oldKeyPassword: string;
        /** Null when the organization disabled the backup password, see {@link generateRandomBackupPassword} */
        newBackupPassword: string | null;
        deviceSecretData: DeviceSecretData;
    }
): Promise<AuthSession> => {
    const { api } = context;
    const user = maybeUser ?? (await getUser(api));
    const userKeys = await getDecryptedUserKeysHelper(user, oldKeyPassword);

    const { keyPassword } = await changeSSOUserKeysPasswordHelper({
        newBackupPassword: newBackupPassword ?? generateRandomBackupPassword(),
        deviceSecretData,
        api,
        user,
        userKeys,
    });

    // The keys just changed, so the session is created from freshly fetched data
    return finalizeSignIn(context, {
        user: undefined,
        addresses: undefined,
        loginPassword: '',
        keyPassword,
        // See the equivalent note in setupSSOUserKeys
        clearKeyPassword: newBackupPassword ?? '',
        attemptResume: false,
        source: SessionSource.Saml,
    });
};

const getSSOSetupData = async (context: LoginFlowContext, { user }: { user: User }): Promise<SSOSetupData | null> => {
    const { api, ktActivation, appName } = context;

    const unprivatizationContextData = await getUnprivatizationContextData({ api }).catch((error) => {
        const { code } = getApiError(error);
        if (code === API_CUSTOM_ERROR_CODES.UNPRIVATIZATION_NOT_ALLOWED) {
            // Expected error, unprivatization is not yet allowed for this organization.
            // Fall back to vpn sso login.
            return null;
        }
        throw error;
    });

    if (!unprivatizationContextData) {
        return null;
    }

    const deviceData = await createAuthDevice({ api });

    await setPersistedAuthDeviceDataByUser({ user, deviceData });

    const parsedUnprivatizationData = await parseUnprivatizationData({
        unprivatizationData: unprivatizationContextData.data,
        addresses: unprivatizationContextData.addresses,
    });

    await validateUnprivatizationData({
        ktUserContext: {
            ktActivation,
            appName,
            getUser: async () => user,
            getUserKeys: async () => [],
        },
        api,
        parsedUnprivatizationData,
        options: {
            newMemberCreation: false,
            validateRevision: false,
        },
    });

    // The organization can disable the backup password, in which case the member joins without
    // being asked to set one
    const setupStep = getBackupPasswordDisabled(context.authResponse)
        ? SSOLoginCapabilites.SETUP_WITHOUT_BACKUP_PASSWORD
        : SSOLoginCapabilites.SETUP_BACKUP_PASSWORD;

    return {
        type: 'setup',
        parsedUnprivatizationData,
        unprivatizationContextData,
        deviceData,
        authDevices: [],
        organizationData: unprivatizationContextData.organizationData,
        intent: {
            capabilities: new Set([setupStep]),
            step: setupStep,
        },
    };
};

/**
 * What approving this device leads to: a session, or, for a member who still has a temporary password, the data to
 * set a new backup password first. See {@link confirmSSODevice}.
 */
/**
 * How an SSO sign-in with an approved device or the backup password ends: a session, or, for a member who still has
 * a temporary password, the data (and fresh user) to set a new backup password first.
 */
export type SSOSignInResult =
    { type: 'session'; session: AuthSession } | { type: 'set-password'; ssoData: SSOSetPasswordData; user: User };

/**
 * Signs in with the key password from a device another device or an administrator approved.
 * A member who still has a temporary password gets no session yet: it would be persisted, so reloading the page
 * would sign them in without the new backup password. The session is created once that password is set, like when
 * the page prepares the sign-in for an approved device (see `prepareSSOSignIn`).
 */
export const confirmSSODevice = async (
    context: LoginFlowContext,
    {
        deviceSecretUser,
        addresses,
        organizationData,
    }: {
        deviceSecretUser: DeviceSecretUser;
        addresses: Address[] | undefined;
        /** Already loaded with the SSO data; reused, so the organization logo is cleaned up with it. */
        organizationData: SSODataTypes['organizationData'];
    }
): Promise<SSOSignInResult> => {
    if (deviceSecretUser.user.Flags['has-temporary-password']) {
        return {
            type: 'set-password',
            ssoData: await getSSOSetPasswordData(context, { deviceSecret: deviceSecretUser, organizationData }),
            user: deviceSecretUser.user,
        };
    }
    return {
        type: 'session',
        session: await finalizeSignIn(context, {
            user: deviceSecretUser.user,
            addresses,
            loginPassword: '',
            clearKeyPassword: '',
            keyPassword: deviceSecretUser.keyPassword,
            source: SessionSource.Saml,
        }),
    };
};

/**
 * Polls every 10 seconds (less often while the page is hidden) until another device or an administrator approves
 * this device, then calls `onApproved` once. Errors go to `onError` and polling continues. Returns a stop function.
 */
export const pollDeviceApproval = ({
    api,
    user,
    onApproved,
    onError,
}: {
    api: Api;
    user: User;
    onApproved: (deviceSecretUser: DeviceSecretUser) => void;
    onError: (error: unknown) => void;
}) => {
    let stopped = false;
    let hiddenTicks = 0;
    let intervalHandle: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
        stopped = true;
        clearInterval(intervalHandle);
    };

    const check = async () => {
        try {
            return await getAuthDeviceDataByUser({ user, api, refreshUser: true });
        } catch (e) {
            if (e instanceof AuthDeviceInvalidError) {
                await deleteAuthDevice({ user, api, deviceID: e.deviceID }).catch(noop);
            }
            throw e;
        }
    };

    intervalHandle = setInterval(() => {
        if (document.visibilityState !== 'visible' && hiddenTicks < 3) {
            hiddenTicks++;
            return;
        }
        hiddenTicks = 0;
        check()
            .then((deviceSecretUser) => {
                // A check that was already running when polling stopped doesn't report
                if (!stopped) {
                    stop();
                    onApproved(deviceSecretUser);
                }
            })
            .catch((error) => {
                if (!stopped) {
                    onError(error);
                }
            });
    }, 10_000);

    return stop;
};

const getSSOInactiveData = async (
    context: LoginFlowContext,
    {
        user,
        addresses: maybeAddresses,
        deviceDataSerialized,
    }: {
        user: User;
        /** Reused when they were loaded already. */
        addresses: Address[] | undefined;
        deviceDataSerialized: DeviceDataSerialized;
    }
): Promise<SSOInactiveData> => {
    const { api } = context;

    const authDevices = await getAllAuthDevices({ user, api });
    const authDeviceSelf = authDevices.find(({ ID }) => ID === deviceDataSerialized.serializedDeviceData.id);
    // If we can't find ourselves, just throw to create a new device
    if (!authDeviceSelf) {
        throw new AuthDeviceInvalidError(deviceDataSerialized.serializedDeviceData.id, 'Missing device');
    }
    const activeAuthDevicesExceptSelf = authDevices.filter(
        ({ ID, State }) => ID !== deviceDataSerialized.serializedDeviceData.id && State === AuthDeviceState.Active
    );

    const [addresses, organizationData] = await Promise.all([
        maybeAddresses ?? getAllAddresses(api),
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
        addresses,
        organizationData,
        intent: getIntent(context, user, activeAuthDevicesExceptSelf),
    };
};

const getSSOUnlockData = async (
    context: LoginFlowContext,
    {
        user,
        addresses: maybeAddresses,
    }: {
        user: User;
        /** Reused when they were loaded already. */
        addresses: Address[] | undefined;
    }
): Promise<SSOUnlockData> => {
    const { api } = context;

    const [addresses, organizationData] = await Promise.all([
        maybeAddresses ?? getAllAddresses(api),
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
    const authDevices = await getAllAuthDevices({ user, api });
    const activeAuthDevicesExceptSelf = authDevices.filter(
        ({ ID, State }) => ID !== deviceData.deviceOutput.ID && State === AuthDeviceState.Active
    );

    return {
        type: 'unlock',
        deviceData,
        authDevices: activeAuthDevicesExceptSelf,
        address: primaryAddress,
        addresses,
        organizationData,
        intent: getIntent(context, user, activeAuthDevicesExceptSelf),
    };
};

/** SSO accounts either sign in directly (the device can unlock the keys) or continue in the SSO steps. */
export type PrepareSSOResult = { type: 'session'; session: AuthSession } | { type: 'sso'; ssoData: SSODataTypes };

export const prepareSSOSignIn = async (
    context: LoginFlowContext,
    { user, addresses }: { user: User; addresses: Address[] | undefined }
): Promise<PrepareSSOResult> => {
    const { api } = context;

    if (user.Keys.length === 0) {
        const ssoData = await getSSOSetupData(context, { user });
        // When ssoData is null, it means that the organization is not yet setup for global SSO, and it proceeds with the regular VPN SSO flow
        if (ssoData === null) {
            return {
                type: 'session',
                session: await finalizeSignIn(context, {
                    user,
                    addresses,
                    loginPassword: '',
                    source: SessionSource.Saml,
                }),
            };
        }
        return { type: 'sso', ssoData };
    }

    // Attempt to use device secret
    try {
        const deviceSecretUser = await getAuthDeviceDataByUser({ user, api });
        if (user.Flags['has-temporary-password']) {
            return { type: 'sso', ssoData: await getSSOSetPasswordData(context, { deviceSecret: deviceSecretUser }) };
        }
        return {
            type: 'session',
            session: await finalizeSignIn(context, {
                user,
                addresses,
                loginPassword: '',
                clearKeyPassword: '',
                keyPassword: deviceSecretUser.keyPassword,
                source: SessionSource.Saml,
            }),
        };
    } catch (e) {
        if (e instanceof AuthDeviceInactiveError) {
            return {
                type: 'sso',
                ssoData: await getSSOInactiveData(context, {
                    user,
                    addresses,
                    deviceDataSerialized: e.deviceDataSerialized,
                }),
            };
        }

        if (e instanceof AuthDeviceNonExistingError || e instanceof AuthDeviceInvalidError) {
            if (e instanceof AuthDeviceInvalidError) {
                await deleteAuthDevice({
                    api,
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
    return { type: 'sso', ssoData: await getSSOUnlockData(context, { user, addresses }) };
};
