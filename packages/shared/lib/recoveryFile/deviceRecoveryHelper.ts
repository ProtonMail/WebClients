import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getSettings } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Address, Api, PreAuthKTVerifier, User, UserSettings } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import {
    attemptDeviceRecovery,
    getIsDeviceRecoveryAvailable,
    storeDeviceRecovery,
} from '@proton/shared/lib/recoveryFile/deviceRecovery';
import { removeDeviceRecovery } from '@proton/shared/lib/recoveryFile/storage';
import noop from '@proton/utils/noop';

const getUserSettings = (api: Api) => {
    return api<{ UserSettings: UserSettings }>(getSettings()).then(({ UserSettings }) => UserSettings);
};

export const deviceRecovery = async ({
    keyPassword,
    persistent,
    user: initialUser,
    appName,
    addresses: initialAddresses,
    preAuthKTVerifier,
    api,
}: {
    keyPassword: string;
    persistent: boolean;
    user: User;
    appName: APP_NAMES;
    addresses: Address[] | undefined;
    preAuthKTVerifier: PreAuthKTVerifier;
    api: Api;
}) => {
    let user = initialUser;
    let trusted = false;

    if (!keyPassword) {
        return {
            trusted,
            user,
        };
    }

    let addresses = initialAddresses || (await getAllAddresses(api));

    const numberOfReactivatedKeys = await attemptDeviceRecovery({
        api,
        user,
        addresses,
        keyPassword,
        preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
    }).catch(noop);

    if (numberOfReactivatedKeys !== undefined && numberOfReactivatedKeys > 0) {
        // Keys have gotten reactivated, so let's refetch to be sure we're up to date
        [user, addresses] = await Promise.all([getUser(api), getAllAddresses(api)]);
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
            const userSettings = await getUserSettings(api);

            if (userSettings.DeviceRecovery) {
                const deviceRecoveryUpdated = await storeDeviceRecovery({ api, user, userKeys }).catch(noop);
                if (deviceRecoveryUpdated) {
                    // Storing device recovery (when setting a new recovery secret) modifies the user object
                    user = await getUser(api);
                }
                trusted = true;
            }
        }
    } else {
        removeDeviceRecovery(user.ID);
    }

    return {
        user,
        trusted,
    };
};
