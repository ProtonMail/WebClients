import { useCallback } from 'react';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useOnlineRef } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import { LockMode } from '@proton/pass/lib/auth/lock/types';

export const useDesktopUnlock = () => {
    const { getDesktopUnlockSecret } = usePassCore();

    const { createNotification } = useNotifications();
    const unlock = useUnlock((err) => createNotification({ type: 'error', text: err.message }));
    const online = useOnlineRef();

    return useCallback(async (): Promise<Extract<UnlockDTO, { mode: LockMode.DESKTOP }>> => {
        const key = await getDesktopUnlockSecret?.().catch((err) => {
            createNotification({ type: 'error', text: err.message });
            throw err;
        });
        if (!key) throw new Error();

        const dto: UnlockDTO = { mode: LockMode.DESKTOP, key, offline: !online.current };
        await unlock(dto);

        return dto;
    }, []);
};
