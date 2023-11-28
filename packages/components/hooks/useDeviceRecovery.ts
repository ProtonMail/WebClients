import { useEffect } from 'react';

import {
    getHasRecoveryMessage,
    getKeysFromDeviceRecovery,
    removeDeviceRecovery,
    storeDeviceRecovery,
} from '@proton/shared/lib/recoveryFile/deviceRecovery';
import arraysContainSameElements from '@proton/utils/arraysContainSameElements';

import { useFlag } from '../../components/containers/unleash';
import useApi from './useApi';
import useAuthentication from './useAuthentication';
import useIsRecoveryFileAvailable from './useIsRecoveryFileAvailable';
import useUser from './useUser';
import { useUserKeys } from './useUserKeys';
import useUserSettings from './useUserSettings';

export const useIsDeviceRecoveryEnabled = () => {
    const [userSettings] = useUserSettings();
    const authentication = useAuthentication();

    return userSettings.DeviceRecovery && authentication.getTrusted();
};

export const useIsDeviceRecoveryAvailable = () => {
    const hasTrustedDeviceRecovery = useFlag('TrustedDeviceRecovery');
    const [recoveryFileAvailable, loading] = useIsRecoveryFileAvailable();
    return [recoveryFileAvailable && hasTrustedDeviceRecovery, loading];
};

export const useDeviceRecovery = () => {
    const [userKeys] = useUserKeys();
    const [user] = useUser();
    const api = useApi();

    const [isDeviceRecoveryAvailable] = useIsDeviceRecoveryAvailable();
    const isDeviceRecoveryEnabled = useIsDeviceRecoveryEnabled();
    const hasRecoveryMessage = getHasRecoveryMessage(user.ID);

    const privateKeyFingerPrints = userKeys?.map((key) => key.privateKey.getFingerprint()) || [];

    useEffect(() => {
        let aborted = false;
        const run = async () => {
            const shouldRemoveDeviceRecovery = hasRecoveryMessage && !isDeviceRecoveryEnabled;
            if (shouldRemoveDeviceRecovery) {
                removeDeviceRecovery(user.ID);
                return;
            }

            const shouldStoreDeviceRecovery =
                isDeviceRecoveryAvailable && (isDeviceRecoveryEnabled || hasRecoveryMessage);
            if (!privateKeyFingerPrints.length || !shouldStoreDeviceRecovery) {
                return;
            }

            const storedKeys = (await getKeysFromDeviceRecovery(user)) || [];
            if (aborted) {
                return;
            }
            const storedKeyFingerprints = storedKeys.map((key) => key.getFingerprint());
            const userKeysHaveUpdated = !arraysContainSameElements(storedKeyFingerprints, privateKeyFingerPrints);

            if (!userKeysHaveUpdated || aborted) {
                return;
            }

            await storeDeviceRecovery({ api, user, userKeys });
        };

        void run();
        return () => {
            aborted = true;
        };
    }, [
        isDeviceRecoveryAvailable,
        isDeviceRecoveryEnabled,
        hasRecoveryMessage,
        privateKeyFingerPrints.join(''),
        user.ID,
    ]);
};
