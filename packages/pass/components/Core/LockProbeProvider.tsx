import { type FC, type PropsWithChildren, createContext, useContext } from 'react';
import { useSelector } from 'react-redux';

import { type ActivityProbe, useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { offlineResume } from '@proton/pass/store/actions';
import { selectLockTTL, selectRequestInFlight } from '@proton/pass/store/selectors';
import type { Callback, MaybeNull } from '@proton/pass/types';
import { epochToMs } from '@proton/pass/utils/time/epoch';

import { useConnectivity } from './ConnectivityProvider';

const LockProbeContext = createContext<MaybeNull<ActivityProbe>>(null);
export const useLockProbe = () => useContext(LockProbeContext);

/** Extend the lock time every time we reach the TTL half-time */
const ttlToProbeTimeout = (ttl: number) => epochToMs(ttl / 2);

type Props = { onProbe: Callback };

export const LockProbeProvider: FC<PropsWithChildren<Props>> = ({ onProbe, children }) => {
    const probe = useActivityProbe();
    const lockTTL = useSelector(selectLockTTL);
    const offlineResuming = useSelector(selectRequestInFlight(offlineResume.requestID()));
    const online = useConnectivity();

    useVisibleEffect(
        (visible) => {
            if (visible && lockTTL && !offlineResuming) probe.start(onProbe, ttlToProbeTimeout(lockTTL));
            else probe.cancel();
        },
        /* re-start the probe when the `lockTTL` changes and/or connectivity resumes */
        [lockTTL, offlineResuming, online]
    );

    return <LockProbeContext.Provider value={probe}>{children}</LockProbeContext.Provider>;
};
