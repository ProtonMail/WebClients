import { useEffect, useState } from 'react';

import { differenceInMilliseconds } from 'date-fns';

import { sessionRecoverySlice } from '@proton/account/recovery/sessionRecovery';
import {
    selectSessionRecoveryData,
    selectSessionRecoveryGracePeriodEndTime,
} from '@proton/account/recovery/sessionRecoverySelectors';
import { useUser } from '@proton/account/user/hooks';
import { useInterval } from '@proton/hooks';
import { useDispatch, useSelector } from '@proton/redux-shared-store';
import { DAY, HOUR, MINUTE, SECOND } from '@proton/shared/lib/constants';
import { SessionRecoveryState } from '@proton/shared/lib/interfaces';

export const useSessionRecoveryLocalStorage = () => {
    const dispatch = useDispatch();
    return {
        dismissCanceledState: () => dispatch(sessionRecoverySlice.actions.setState({ canceledStateDismissed: true })),
        confirmGracePeriod: () => dispatch(sessionRecoverySlice.actions.setState({ gracePeriodConfirmed: true })),
    };
};

export const useIsSessionRecoveryInitiatedByCurrentSession = () => {
    return useSelector(selectSessionRecoveryData).isSessionRecoveryInitiatedByCurrentSession;
};

export const useIsSessionRecoveryAvailable = () => {
    const { isSessionRecoveryAvailable, loading } = useSelector(selectSessionRecoveryData);
    return [isSessionRecoveryAvailable, loading];
};

export const useIsSessionRecoveryInitiationAvailable = () => {
    return useSelector(selectSessionRecoveryData).isSessionRecoveryInitiationAvailable;
};

export const useSessionRecoveryGracePeriodHoursRemaining = () => {
    const value = useSelector(selectSessionRecoveryGracePeriodEndTime);
    if (value === null) {
        return null;
    }
    const msRemaining = value - Date.now();
    return Math.ceil(msRemaining / HOUR);
};

export const useSessionRecoveryInsecureTimeRemaining = () => {
    const [user] = useUser();

    const [now, setNow] = useState(() => new Date());
    const [interval, setInterval] = useState(HOUR);

    const [timeRemaining, setTimeRemaining] = useState<{
        inHours: number;
        inDays: number;
        inMinutes: number;
        inSeconds: number;
    }>();

    const diff = user?.AccountRecovery?.EndTime
        ? differenceInMilliseconds(user.AccountRecovery.EndTime * 1000, now)
        : 0;

    useInterval(
        () => {
            setNow(new Date());
        },
        diff < 0 ? null : interval
    );

    useEffect(() => {
        const inDays = Math.floor(diff / DAY);
        const inHours = Math.floor(diff / HOUR);
        const inMinutes = Math.floor(diff / MINUTE);
        const inSeconds = Math.floor(diff / SECOND);

        if (inMinutes <= 1) {
            setInterval(SECOND);
        } else if (inHours <= 1) {
            setInterval(MINUTE);
        } else {
            setInterval(HOUR);
        }

        setTimeRemaining({
            inHours,
            inDays,
            inMinutes,
            inSeconds,
        });
    }, [diff]);

    if (!user.AccountRecovery || user.AccountRecovery.State !== SessionRecoveryState.INSECURE) {
        return null;
    }

    if (diff <= 0 || !timeRemaining) {
        return null;
    }

    return timeRemaining;
};
