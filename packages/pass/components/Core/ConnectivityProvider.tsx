import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { BottomBarProps } from '@proton/pass/components/Layout/Bar/BottomBar';
import { BottomBar } from '@proton/pass/components/Layout/Bar/BottomBar';
import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';
import { clientBusy, clientOffline } from '@proton/pass/lib/client';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { ConnectivityStatus, getConnectivityWarning } from '@proton/pass/lib/network/connectivity.utils';
import { offlineResume } from '@proton/pass/store/actions/creators/client';
import { selectRequestInFlight } from '@proton/pass/store/request/selectors';
import type { AppStatus, MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

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

export const useLobbyConnectivityBar = (status: AppStatus) =>
    useConnectivityBar((connectivity) => ({
        className: clsx('bg-danger fixed bottom-0 left-0'),
        hidden: connectivity === ConnectivityStatus.ONLINE || clientBusy(status),
        text:
            connectivity === ConnectivityStatus.DOWNTIME
                ? c('Info').t`Servers are unreachable`
                : c('Info').t`No network connection`,
    }));

export const useAppConnectivityBar = (status: AppStatus, localID?: number) => {
    const offline = clientOffline(status);
    const dispatch = useDispatch();
    const offlineResuming = useSelector(selectRequestInFlight(offlineResume.requestID()));

    return useConnectivityBar((connectivity) => ({
        className: clsx('shrink-0', offline ? 'bg-weak border-top' : 'bg-danger'),
        hidden: connectivity === ConnectivityStatus.ONLINE && !offline,
        text: offline ? (
            <div className="flex items-center gap-2">
                <span>{c('Info').t`Offline mode`}</span>

                <Button
                    className="text-sm"
                    onClick={() => dispatch(offlineResume.intent({ localID }))}
                    shape="underline"
                    size="small"
                    loading={offlineResuming}
                    disabled={offlineResuming}
                >
                    {offlineResuming ? c('Info').t`Reconnecting` : c('Info').t`Reconnect`}
                </Button>
            </div>
        ) : undefined,
    }));
};
