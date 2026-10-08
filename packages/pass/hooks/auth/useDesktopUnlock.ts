import { useCallback, useState } from 'react';

import { useNotifications } from '@proton/app-context/useNotifications';

import { useOnlineRef } from '../../components/Core/ConnectivityProvider';
import { useUnlock } from '../../components/Lock/UnlockProvider';
import type { UnlockDTO } from '../../lib/auth/lock/types';
import { LockMode } from '../../lib/auth/lock/types';
import { useAutoUnlock } from './useAutoUnlock';

export const useDesktopUnlock = ({ silentErrors } = { silentErrors: false }) => {
    const { createNotification } = useNotifications();
    const unlock = useUnlock();
    const online = useOnlineRef();

    return useCallback(async (): Promise<Extract<UnlockDTO, { mode: LockMode.DESKTOP }>> => {
        /** The unlock secret is fetched in the service worker (triggering the OS biometric
         * prompt) by the desktop lock adapter — see `desktopLockAdapterFactory`. The popup
         * only dispatches the unlock, so it completes even if the popup is torn down while
         * the prompt is in the foreground (Firefox/Windows — see IDTEAM-5762). */
        const dto: UnlockDTO = { mode: LockMode.DESKTOP, key: '', offline: !online.current };

        await unlock(dto).catch((err: Error) => {
            if (!silentErrors) createNotification({ type: 'error', text: err.message });
            throw err;
        });

        return dto;
    }, []);
};

export const useAutoDesktopUnlock = ({ silentErrors } = { silentErrors: false }) => {
    const [loading, setLoading] = useState(false);
    const desktopUnlock = useDesktopUnlock({ silentErrors });

    const onUnlock = useCallback(async () => {
        try {
            setLoading(true);
            await desktopUnlock();
        } finally {
            setLoading(false);
        }
    }, [desktopUnlock]);

    useAutoUnlock({ loading, onUnlock });

    return { loading, onUnlock };
};
