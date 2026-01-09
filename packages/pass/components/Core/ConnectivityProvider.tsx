import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { BottomBarProps } from '@proton/pass/components/Layout/Bar/BottomBar';
import { BottomBar } from '@proton/pass/components/Layout/Bar/BottomBar';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { ConnectivityStatus, getConnectivityWarning } from '@proton/pass/lib/network/connectivity.utils';
import type { MaybeNull } from '@proton/pass/types';

type Props = { service: ConnectivityService };
type ConnectivityState = {
    status: ConnectivityStatus;
    check: () => Promise<ConnectivityStatus>;
};

const ConnectivityContext = createContext<MaybeNull<ConnectivityState>>(null);

export const ConnectivityProvider: FC<PropsWithChildren<Props>> = ({ children, service }) => {
    const [status, setStatus] = useState(() => service.getStatus());
    const ctx = useMemo(() => ({ check: service.check, status }), [status]);

    useEffect(() => service.subscribe(setStatus), []);

    return <ConnectivityContext.Provider value={ctx}>{children}</ConnectivityContext.Provider>;
};

export const useOnline = () => {
    const ctx = useContext(ConnectivityContext);
    return ctx ? ctx.status === ConnectivityStatus.ONLINE : true;
};

export const useOffline = () => !useOnline();

export const useConnectivity = () => useContext(ConnectivityContext)?.status ?? ConnectivityStatus.ONLINE;
export const useCheckConnectivity = () => useContext(ConnectivityContext)?.check;
export const useOnlineRef = () => useStatefulRef(useOnline());

export const useConnectivityBar = (propsFactory: (status: ConnectivityStatus) => BottomBarProps) => {
    const connectivity = useConnectivity();
    const props = propsFactory(connectivity);
    return <BottomBar {...props} text={props.text ?? getConnectivityWarning(connectivity)} />;
};
