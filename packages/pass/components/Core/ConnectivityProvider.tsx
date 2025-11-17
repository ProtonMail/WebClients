import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { BottomBarProps } from '@proton/pass/components/Layout/Bar/BottomBar';
import { BottomBar } from '@proton/pass/components/Layout/Bar/BottomBar';
import { useNavigatorOnline } from '@proton/pass/hooks/useNavigatorOnline';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import {
    ConnectivityStatus,
    getConnectivityRetryTimeout,
    getConnectivityWarning,
    intoConnectivityStatus,
} from '@proton/pass/lib/api/connectivity';
import type { ApiSubscriptionEvent, Maybe, MaybeNull } from '@proton/pass/types';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import type { PubSub } from '@proton/pass/utils/pubsub/factory';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import { usePassCore } from './PassCoreProvider';

type Props = {
    onPing?: () => Promise<void>;
    subscribe?: PubSub<ApiSubscriptionEvent>['subscribe'];
};

type ConnectivityState = {
    status: ConnectivityStatus;
    check: () => Promise<ConnectivityStatus>;
};

const ConnectivityContext = createContext<MaybeNull<ConnectivityState>>(null);

export const ConnectivityProvider: FC<PropsWithChildren<Props>> = ({ children, onPing, subscribe }) => {
    const { getApiState } = usePassCore();
    const navigatorOnline = useNavigatorOnline();
    const [status, setStatus] = useState(ConnectivityStatus[navigatorOnline ? 'ONLINE' : 'OFFLINE']);
    const online = status === ConnectivityStatus.ONLINE && navigatorOnline;
    const retryCount = useRef<number>(0);

    const checkApiOnline = useCallback(
        asyncLock((): Promise<ConnectivityStatus> => {
            retryCount.current++;
            return Promise.resolve(onPing?.())
                .catch(noop)
                .then(async () => {
                    const nextStatus = await (async (): Promise<ConnectivityStatus> => {
                        if (!getApiState) return ConnectivityStatus[navigator.onLine ? 'ONLINE' : 'OFFLINE'];
                        return intoConnectivityStatus(await getApiState());
                    })();

                    setStatus(nextStatus);
                    await wait(50); /* ensure refs are synced */
                    return nextStatus;
                });
        }),
        []
    );

    useEffect(
        () =>
            subscribe?.((event) => {
                if (event.type === 'connectivity') {
                    setStatus(intoConnectivityStatus(event));
                }
            }),
        []
    );

    useEffect(() => {
        if (navigatorOnline) void checkApiOnline();
    }, [navigatorOnline]);

    useEffect(() => {
        if (!online) {
            let timer: Maybe<NodeJS.Timeout>;

            const checkWithRetry = () =>
                checkApiOnline().then((next) => {
                    if (next !== ConnectivityStatus.ONLINE) {
                        const ms = getConnectivityRetryTimeout(next, retryCount.current);
                        timer = setTimeout(checkWithRetry, ms);
                    }
                });

            void checkWithRetry();
            return () => clearTimeout(timer);
        } else retryCount.current = 0;
    }, [online]);

    const ctx = useMemo(() => ({ check: checkApiOnline, status }), [status]);

    return <ConnectivityContext.Provider value={ctx}>{children}</ConnectivityContext.Provider>;
};

export const useOnline = () => {
    const ctx = useContext(ConnectivityContext);
    return ctx ? ctx.status === ConnectivityStatus.ONLINE : true;
};
export const useConnectivity = () => useContext(ConnectivityContext)?.status ?? ConnectivityStatus.ONLINE;
export const useCheckConnectivity = () => useContext(ConnectivityContext)?.check;
export const useOnlineRef = () => useStatefulRef(useOnline());

export const useConnectivityBar = (propsFactory: (status: ConnectivityStatus) => BottomBarProps) => {
    const connectivity = useConnectivity();
    const props = propsFactory(connectivity);
    return <BottomBar {...props} text={props.text ?? getConnectivityWarning(connectivity)} />;
};
