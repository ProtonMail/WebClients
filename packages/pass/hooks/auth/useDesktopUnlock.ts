import { useCallback, useState } from 'react';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useOnlineRef } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useUnlock } from '@proton/pass/components/Lock/UnlockProvider';
import { PASS_DESKTOP_NATIVE_MESSAGE_TIMEOUT } from '@proton/pass/constants';
import { useAutoUnlock } from '@proton/pass/hooks/auth/useAutoUnlock';
import type { UnlockDTO } from '@proton/pass/lib/auth/lock/types';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { NativeMessageError, getNativeMessageErrorKind } from '@proton/pass/lib/native-messaging/errors';
import { NativeMessageErrorType } from '@proton/pass/types';

export const useDesktopUnlock = ({ silentErrors } = { silentErrors: false }) => {
    const { getDesktopUnlockSecret } = usePassCore();

    const { createNotification } = useNotifications();
    const unlock = useUnlock();
    const online = useOnlineRef();

    return useCallback(async (): Promise<Extract<UnlockDTO, { mode: LockMode.DESKTOP }>> => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const key = await Promise.race([
            getDesktopUnlockSecret?.(),
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new NativeMessageError(NativeMessageErrorType.TIMEOUT)),
                    PASS_DESKTOP_NATIVE_MESSAGE_TIMEOUT
                );
            }),
        ])
            .catch((err: Error) => {
                if (!silentErrors) createNotification({ type: 'error', text: err.message });
                /** Re-throw infrastructure errors — the biometric check never ran,
                 * so these should not count as failed auth attempts in the adapter */
                if (getNativeMessageErrorKind(err) !== 'auth') throw err;
                return '';
            })
            .finally(() => clearTimeout(timeoutId));

        const dto: UnlockDTO = { mode: LockMode.DESKTOP, key: key ?? '', offline: !online.current };

        await unlock(dto).catch((err: Error) => {
            /** key is empty when native messaging already failed and showed a notification above */
            if (key) createNotification({ type: 'error', text: err.message });
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
