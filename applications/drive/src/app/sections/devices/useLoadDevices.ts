import { useCallback } from 'react';

import { c } from 'ttag';

import { getDrive } from '@proton/drive';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useDevicesStore } from './useDevices.store';

export function useLoadDevices() {
    const loadDevices = useCallback(async (ac: AbortController) => {
        const { setItem: setDevice, setLoading } = useDevicesStore.getState();
        setLoading(true);
        try {
            for await (const device of getDrive().iterateDevices(ac.signal)) {
                if (ac.signal.aborted) {
                    return;
                }
                setDevice(device);
            }
        } catch (e) {
            const errorNotificationText = c('Notification').t`Error while listing devices`;
            handleSdkError(e, { fallbackMessage: errorNotificationText });
        }
        setLoading(false);
    }, []);

    return { loadDevices };
}
