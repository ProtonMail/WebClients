import { useCallback, useEffect, useState } from 'react';

import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { api } from '@proton/pass/lib/api/api';
import { DeviceForkExpiredError, getDeviceForkConsumeOptions, pollDeviceFork } from '@proton/pass/lib/auth/device-fork';
import type { MaybeNull } from '@proton/pass/types/utils';
import { getClientID } from '@proton/shared/lib/apps/helper';

export type DeviceLoginStatus = 'waiting' | 'consuming' | 'expired' | 'failed';

/** Signs in through account's "sign in with another device" flow: opens the
 * browser on the first fork only, later forks (the previous one expired)
 * are reachable with `reopen`. */
export const useDeviceLogin = () => {
    const authService = useAuthService();
    const { onLink } = usePassCore();
    const { APP_NAME, SSO_URL } = usePassConfig();
    const openLink = useStatefulRef(onLink);

    const [attempt, setAttempt] = useState(0);
    const [status, setStatus] = useState<DeviceLoginStatus>('waiting');
    const [url, setUrl] = useState<MaybeNull<string>>(null);

    useEffect(() => {
        const controller = new AbortController();
        let opened = false;

        setStatus('waiting');
        setUrl(null);

        const run = async () => {
            try {
                const fork = await pollDeviceFork({
                    api,
                    clientID: getClientID(APP_NAME),
                    host: SSO_URL,
                    signal: controller.signal,
                    onFork: ({ url }) => {
                        setUrl(url);
                        if (!opened) openLink.current(url);
                        opened = true;
                    },
                });

                setStatus('consuming');
                const { payload, pullFork } = getDeviceForkConsumeOptions(fork);
                await authService.consumeFork(payload, undefined, pullFork);
            } catch (err) {
                if (controller.signal.aborted) return;
                setStatus(err instanceof DeviceForkExpiredError ? 'expired' : 'failed');
            }
        };

        void run();

        return () => controller.abort();
    }, [attempt, authService, APP_NAME, SSO_URL]);

    const retry = useCallback(() => setAttempt((count) => count + 1), []);
    const reopen = useCallback(() => url && openLink.current(url), [url]);

    return { status, url, retry, reopen };
};
