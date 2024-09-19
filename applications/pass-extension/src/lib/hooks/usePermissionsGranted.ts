import { useCallback, useEffect, useState } from 'react';

import { useExtensionContext } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';
import { checkExtensionPermissions } from 'proton-pass-extension/lib/utils/permissions';

import { WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';

/* On hook first run : we programatically check the permissions
 * using the browser API. We then setup a listener for the worker
 * `PERMISSIONS_UPDATE` message in order to gracefully handle changes
 * while the clients are running */
export const usePermissionsGranted = (): boolean => {
    const [valid, setValid] = useState<boolean>(false);
    const { port } = useExtensionContext();

    const checkForPermissions = useCallback(async () => {
        try {
            const check = await checkExtensionPermissions();
            setValid(check);
        } catch (_) {}
    }, []);

    useEffect(() => {
        const handleMessage = (message: WorkerMessageWithSender) => {
            if (message.sender === 'background' && message.type === WorkerMessageType.PERMISSIONS_UPDATE) {
                setValid(message.payload.check);
            }
        };

        void checkForPermissions();

        port.onMessage.addListener(handleMessage);
        return () => port.onMessage.removeListener(handleMessage);
    }, []);

    return valid;
};
