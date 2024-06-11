import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { BottomBarProps } from '@proton/pass/components/Layout/Bar/BottomBar';
import { BottomBar } from '@proton/pass/components/Layout/Bar/BottomBar';
import { useNavigatorOnline } from '@proton/pass/hooks/useNavigatorOnline';
import type { ApiSubscriptionEvent } from '@proton/pass/types';
import type { PubSub } from '@proton/pass/utils/pubsub/factory';
import noop from '@proton/utils/noop';

import { usePassCore } from './PassCoreProvider';

type Props = {
    onPing?: () => Promise<void>;
    subscribe?: PubSub<ApiSubscriptionEvent>['subscribe'];
};

const ConnectivityContext = createContext<boolean>(true);

export const ConnectivityProvider: FC<PropsWithChildren<Props>> = ({ children, onPing, subscribe }) => {
    const { getApiState } = usePassCore();
    const navigatorOnline = useNavigatorOnline();
    const [apiOnline, setApiOnline] = useState(navigatorOnline);
    const online = apiOnline && navigatorOnline;

    const checkApiOnline = useCallback(
        () =>
            Promise.resolve(onPing?.())
                .catch(noop)
                .finally(async () => {
                    const apiState = await getApiState?.();
                    setApiOnline(apiState?.online ?? navigator.onLine);
                }),
        []
    );

    useEffect(
        () =>
            subscribe?.((event) => {
                if (event.type === 'network') {
                    setApiOnline(event.online);
                }
            }),
        []
    );

    useEffect(() => {
        if (navigatorOnline) void checkApiOnline();
    }, [navigatorOnline]);

    useEffect(() => {
        if (!online) {
            void checkApiOnline();
            const handle = setInterval(checkApiOnline, 5_000);
            return () => clearInterval(handle);
        }
    }, [online]);

    return <ConnectivityContext.Provider value={online}>{children}</ConnectivityContext.Provider>;
};

export const useConnectivity = () => useContext(ConnectivityContext);

export const useConnectivityRef = () => {
    const online = useConnectivity();
    const ref = useRef(online);
    ref.current = online;
    return ref;
};

export const useConnectivityBar = (propsFactory: (online: boolean) => BottomBarProps) => {
    const online = useConnectivity();
    const props = propsFactory(online);

    return (
        <BottomBar
            {...props}
            text={props.text ?? c('Info').t`Internet connection lost. Please check your device's connectivity.`}
        />
    );
};
