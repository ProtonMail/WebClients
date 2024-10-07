import type { ReactNode } from 'react';
import { createContext, useContext, useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import useLocalState from '@proton/components/hooks/useLocalState';
import { useSessionRecoveryState } from '@proton/components/hooks/useSessionRecovery';
import { removeItem } from '@proton/shared/lib/helpers/storage';
import { SessionRecoveryState } from '@proton/shared/lib/interfaces';

interface SRContext {
    hasDismissedSessionRecoveryCancelled: boolean;
    dismissSessionRecoveryCancelled: () => void;
    hasConfirmedSessionRecoveryInProgress: boolean;
    confirmSessionRecoveryInProgress: () => void;
}

const defaultSRContext: SRContext = {
    hasDismissedSessionRecoveryCancelled: false,
    dismissSessionRecoveryCancelled: () => {},
    hasConfirmedSessionRecoveryInProgress: false,
    confirmSessionRecoveryInProgress: () => {},
};

const SessionRecoveryContext = createContext<SRContext>(defaultSRContext);
export const useSessionRecoveryLocalStorage = () => useContext(SessionRecoveryContext);

interface Props {
    children: ReactNode;
}

const useHasDismissedSessionRecoveryCancelled = () => {
    const [user] = useUser();
    const cancelledLocalStorageKey = `sr--cancelled:${user.ID}`;

    const [hasDismissed, setHasDismissed] = useLocalState(false, cancelledLocalStorageKey);

    const sessionRecoveryState = useSessionRecoveryState();
    const isCancelled = sessionRecoveryState === SessionRecoveryState.CANCELLED;

    useEffect(() => {
        if (!isCancelled) {
            // Clear up local storage
            removeItem(cancelledLocalStorageKey);
            setHasDismissed(false);
        }
    }, [isCancelled]);

    return {
        hasDismissedSessionRecoveryCancelled: hasDismissed,
        dismissSessionRecoveryCancelled: () => {
            setHasDismissed(true);
        },
    };
};

const useHasConfirmedSessionRecoveryInProgress = () => {
    const [user] = useUser();
    const confirmedLocalStorageKey = `sr--confirmed:${user.ID}`;

    const [hasConfirmed, setHasConfirmed] = useLocalState(false, confirmedLocalStorageKey);

    const sessionRecoveryState = useSessionRecoveryState();
    const isGracePeriod = sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD;
    useEffect(() => {
        if (!isGracePeriod) {
            // Clear up local storage when not in grace period
            removeItem(confirmedLocalStorageKey);
        }
    }, [isGracePeriod]);

    return {
        hasConfirmedSessionRecoveryInProgress: hasConfirmed,
        confirmSessionRecoveryInProgress: () => {
            setHasConfirmed(true);
        },
    };
};

const SessionRecoveryLocalStorageManager = ({ children }: Props) => {
    const { hasDismissedSessionRecoveryCancelled, dismissSessionRecoveryCancelled } =
        useHasDismissedSessionRecoveryCancelled();

    const { hasConfirmedSessionRecoveryInProgress, confirmSessionRecoveryInProgress } =
        useHasConfirmedSessionRecoveryInProgress();

    const value: SRContext = {
        hasDismissedSessionRecoveryCancelled,
        dismissSessionRecoveryCancelled,
        hasConfirmedSessionRecoveryInProgress,
        confirmSessionRecoveryInProgress,
    };

    return <SessionRecoveryContext.Provider value={value}>{children}</SessionRecoveryContext.Provider>;
};

export default SessionRecoveryLocalStorageManager;
