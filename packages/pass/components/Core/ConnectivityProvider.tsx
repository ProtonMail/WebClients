import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useOnline } from '@proton/components/index';
import usePrevious from '@proton/hooks/usePrevious';
import type { BottomBarProps } from '@proton/pass/components/Layout/Bar/BottomBar';
import { BottomBar } from '@proton/pass/components/Layout/Bar/BottomBar';
import type { ApiSubscriptionEvent } from '@proton/pass/types';
import type { PubSub } from '@proton/pass/utils/pubsub/factory';

import { usePassCore } from './PassCoreProvider';

type Props = {
    onPing?: () => Promise<void>;
    onReconnect?: () => void;
    subscribe?: PubSub<ApiSubscriptionEvent>['subscribe'];
};

const ConnectivityContext = createContext<boolean>(true);

export const ConnectivityProvider: FC<PropsWithChildren<Props>> = ({ children, onPing, onReconnect, subscribe }) => {
    const { getApiState } = usePassCore();

    const [apiOnline, setApiOnline] = useState<boolean>(true);
    const navigatorOnline = useOnline();

    const online = apiOnline && navigatorOnline;
    const wasOnline = usePrevious(online);
    const wasOffline = wasOnline !== undefined && !wasOnline;

    const checkApiOnline = useCallback(async () => {
        try {
            await onPing?.();
        } catch {
        } finally {
            const state = await getApiState?.();
            setApiOnline(state?.online ?? true);
        }
    }, []);

    useEffect(
        () =>
            subscribe?.((event) => {
                if (event.type === 'network') setApiOnline(event.online);
            }),
        []
    );

    useEffect(() => {
        if (wasOffline && navigatorOnline) void checkApiOnline();
    }, [navigatorOnline]);

    useEffect(() => {
        if (wasOffline && online) onReconnect?.();
    }, [online]);

    return <ConnectivityContext.Provider value={online}>{children}</ConnectivityContext.Provider>;
};

export const useConnectivityBar = (propsFactory: (online: boolean) => BottomBarProps) => {
    const online = useContext(ConnectivityContext);
    const props = propsFactory(online);

    return (
        <BottomBar
            {...props}
            text={props.text ?? c('Info').t`Internet connection lost. Please check your device's connectivity.`}
        />
    );
};
