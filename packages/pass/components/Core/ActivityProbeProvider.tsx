import { type FC, type PropsWithChildren, createContext } from 'react';
import { useSelector } from 'react-redux';

import { type ActivityProbe, useActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { useVisibleEffect } from '@proton/pass/hooks/useVisibleEffect';
import { selectLockTTL } from '@proton/pass/store/selectors';
import type { Callback, MaybeNull } from '@proton/pass/types';
import { epochToMs } from '@proton/pass/utils/time/epoch';

const ActivityProbeContext = createContext<MaybeNull<ActivityProbe>>(null);

type Props = { onProbe: Callback };

/** Extend the lock time every time we reach the TTL half-time */
const ttlToProbeTimeout = (ttl: number) => epochToMs(ttl / 2);

export const ActivityProbeProvider: FC<PropsWithChildren<Props>> = ({ onProbe, children }) => {
    const probe = useActivityProbe();
    const lockTTL = useSelector(selectLockTTL);

    useVisibleEffect(
        (visible) => {
            if (visible && lockTTL) probe.start(onProbe, ttlToProbeTimeout(lockTTL));
            else probe.cancel();
        },
        [lockTTL]
    );

    return <ActivityProbeContext.Provider value={probe}>{children}</ActivityProbeContext.Provider>;
};
