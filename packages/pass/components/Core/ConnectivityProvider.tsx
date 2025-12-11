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
import type { ApiSubscriptionEvent, MaybeNull } from '@proton/pass/types';
import { asyncLock, cancelable } from '@proton/pass/utils/fp/promises';
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
    const retryTimer = useRef<NodeJS.Timeout>();
    const retryCount = useRef<number>(0);

    const navigatorOnline = useNavigatorOnline();
    const [status, setStatus] = useState(() => ConnectivityStatus[navigatorOnline ? 'ONLINE' : 'OFFLINE']);
    const online = status === ConnectivityStatus.ONLINE && navigatorOnline;

    const check = useCallback(
        asyncLock((): Promise<ConnectivityStatus> => {
            retryCount.current++;
            return Promise.resolve(onPing?.())
                .catch(noop)
                .then(async () => {
                    const nextStatus = await (async (): Promise<ConnectivityStatus> => {
                        if (!getApiState) return ConnectivityStatus[navigator.onLine ? 'ONLINE' : 'OFFLINE'];
                        const state = await getApiState();
                        return intoConnectivityStatus(state);
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
        if (navigatorOnline) void check();
    }, [navigatorOnline]);

    useEffect(() => {
        if (online) retryCount.current = 0;
        else {
            const cancelableCheck = cancelable(check);

            const retryableCheck = async () => {
                cancelableCheck
                    .run()
                    .then((next) => {
                        if (next !== ConnectivityStatus.ONLINE) {
                            const ms = getConnectivityRetryTimeout(next, retryCount.current);
                            retryTimer.current = setTimeout(retryableCheck, ms);
                        }
                    })
                    .catch(noop);
            };

            void retryableCheck();

            return () => {
                cancelableCheck.cancel();
                clearTimeout(retryTimer.current);
            };
        }
    }, [online]);

    const ctx = useMemo(() => ({ check, status }), [status]);

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
