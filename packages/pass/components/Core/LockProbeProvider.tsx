import { type FC, type PropsWithChildren, createContext } from 'react';
import { useSelector } from 'react-redux';

import { useActivityProbe } from '../../hooks/useActivityProbe';
import { useVisibleEffect } from '../../hooks/useVisibleEffect';
import { offlineResume } from '../../store/actions/creators/client';
import { selectRequestInFlight } from '../../store/request/selectors';
import { selectLockTTL } from '../../store/selectors/settings';
import type { Callback, MaybeNull } from '../../types/utils';
import { epochToMs } from '../../utils/time/epoch';
import type { ActivityProbe } from '../../utils/time/probe';
import { useOnline } from './ConnectivityProvider';

const LockProbeContext = createContext<MaybeNull<ActivityProbe>>(null);

/** Extend the lock time every time we reach the TTL half-time */
const ttlToProbeTimeout = (ttl: number) => epochToMs(ttl / 2);

type Props = { onProbe: Callback };

export const LockProbeProvider: FC<PropsWithChildren<Props>> = ({ onProbe, children }) => {
    const probe = useActivityProbe();
    const lockTTL = useSelector(selectLockTTL);
    const offlineResuming = useSelector(selectRequestInFlight(offlineResume.requestID()));
    const online = useOnline();

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
