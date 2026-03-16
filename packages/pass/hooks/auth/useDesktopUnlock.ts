import { useCallback, useRef } from 'react';

import { useOffline } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { unlock as unlockAction } from '@proton/pass/store/actions';
import type { MaybePromise } from '@proton/pass/types';

type Options = {
    onStart?: () => MaybePromise<void>;
    onSuccess?: () => MaybePromise<void>;
    onFailure?: () => MaybePromise<void>;
};

export const useDesktopUnlock = () => {
    const offline = useOffline();
    const optionsRef = useRef<Options>();
    const { getDesktopUnlockSecret } = usePassCore();

    const desktopUnlock = useRequest(unlockAction, {
        initial: true,
        onStart: () => optionsRef.current?.onStart?.(),
        onSuccess: () => optionsRef.current?.onSuccess?.(),
        onFailure: () => optionsRef.current?.onFailure?.(),
    });

    const unlock = useCallback(async (options: Options) => {
        optionsRef.current = options;
        const key = await getDesktopUnlockSecret?.();
        if (!key) throw new Error();
        desktopUnlock.dispatch({ mode: LockMode.DESKTOP, key, offline });
    }, []);

    return unlock;
};
