import { useEffect } from 'react';

import { DAY, HOUR } from '@proton/shared/lib/constants';
import { removeItem } from '@proton/shared/lib/helpers/storage';
import { MNEMONIC_STATUS, SessionRecoveryState } from '@proton/shared/lib/interfaces';

import { FeatureFlag, useFlag } from '../containers/unleash';
import useAuthentication from './useAuthentication';
import useLocalState from './useLocalState';
import useUser from './useUser';
import useUserSettings from './useUserSettings';

export const useIsSessionRecoveryInitiatedByCurrentSession = () => {
    const [user] = useUser();
    const authentication = useAuthentication();

    if (!user?.AccountRecovery) {
        return null;
    }

    return user.AccountRecovery.UID === authentication.getUID();
};

export const useSessionRecoveryState = () => {
    const [user] = useUser();

    if (!user?.AccountRecovery) {
        return SessionRecoveryState.NONE;
    }

    return user.AccountRecovery.State;
};

export const useIsSessionRecoveryEnabled = () => {
    const [userSettings] = useUserSettings();

    return !!userSettings.SessionAccountRecovery;
};

export const useHasRecoveryMethod = () => {
    const [user] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const hasRecoveryEmail = !!userSettings.Email.Reset && !!userSettings.Email.Value;
    const hasRecoveryPhone = !!userSettings.Phone.Reset && !!userSettings.Phone.Value;
    const hasRecoveryPhrase = user.MnemonicStatus === MNEMONIC_STATUS.SET;
    const hasRecoveryMethod = hasRecoveryEmail || hasRecoveryPhone || hasRecoveryPhrase;

    return [hasRecoveryMethod, loadingUserSettings] as const;
};

export const useIsSessionRecoveryAvailable = () => {
    const [user] = useUser();
    const feature = useFlag(FeatureFlag.SignedInAccountRecovery);

    const isPrivateUser = user?.isPrivate;

    return feature && isPrivateUser;
};

export const useIsSessionRecoveryInitiationAvailable = () => {
    const isSessionRecoveryAvailable = useIsSessionRecoveryAvailable();
    const isSessionRecoveryEnabled = useIsSessionRecoveryEnabled();
    const sessionRecoveryState = useSessionRecoveryState();

    const sessionRecoveryInitiated =
        sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD ||
        sessionRecoveryState === SessionRecoveryState.INSECURE;

    return isSessionRecoveryAvailable && isSessionRecoveryEnabled && !sessionRecoveryInitiated;
};

export const useHasConfirmedSessionRecoveryInProgress = () => {
    const authentication = useAuthentication();
    const confirmedLocalStorageKey = `sr-ip--confirmed:${authentication.getUID()}`;

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
            setHasConfirmed(() => true);
        },
    };
};

/**
 * Determines whether applications should display session recovery in progress "notifications".
 * Notifications here means banners or modals and not the browser notifications.
 */
export const useShouldNotifySessionRecoveryInProgress = () => {
    const isSessionRecoveryAvailable = useIsSessionRecoveryAvailable();
    const sessionRecoveryState = useSessionRecoveryState();
    const isSessionRecoveryInitiatedByCurrentSession = useIsSessionRecoveryInitiatedByCurrentSession();
    const { hasConfirmedSessionRecoveryInProgress } = useHasConfirmedSessionRecoveryInProgress();

    return (
        isSessionRecoveryAvailable &&
        sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD &&
        !hasConfirmedSessionRecoveryInProgress &&
        !isSessionRecoveryInitiatedByCurrentSession
    );
};

/**
 * Determines whether applications should display password reset available "notifications".
 * Notifications here means banners or modals and not the browser notifications.
 */
export const useShouldNotifyPasswordResetAvailable = () => {
    const isSessionRecoveryAvailable = useIsSessionRecoveryAvailable();
    const sessionRecoveryState = useSessionRecoveryState();

    return isSessionRecoveryAvailable && sessionRecoveryState === SessionRecoveryState.INSECURE;
};

export const useSessionRecoveryGracePeriodHoursRemaining = () => {
    const [user] = useUser();

    if (user.AccountRecovery === null || user.AccountRecovery.State !== SessionRecoveryState.GRACE_PERIOD) {
        return null;
    }

    const msRemaining = user.AccountRecovery.EndTime * 1000 - Date.now();

    return Math.floor(msRemaining / HOUR);
};

export const useSessionRecoveryInsecureTimeRemaining = () => {
    const [user] = useUser();

    if (user.AccountRecovery === null || user.AccountRecovery.State !== SessionRecoveryState.INSECURE) {
        return null;
    }

    const msRemaining = user.AccountRecovery.EndTime * 1000 - Date.now();

    const inHours = Math.floor(msRemaining / HOUR);
    const inDays = Math.floor(msRemaining / DAY);

    return {
        inHours,
        inDays,
    };
};

export const useHasDismissedSessionRecoveryCancelled = () => {
    const authentication = useAuthentication();
    const cancelledLocalStorageKey = `sr-ip--cancelled:${authentication.getUID()}`;

    const [hasDismissed, setHasDismissed] = useLocalState(false, cancelledLocalStorageKey);

    const sessionRecoveryState = useSessionRecoveryState();
    const isCancelled = sessionRecoveryState === SessionRecoveryState.CANCELLED;

    useEffect(() => {
        if (!isCancelled) {
            // Clear up local storage
            removeItem(cancelledLocalStorageKey);
        }
    }, [isCancelled]);

    return {
        hasDismissedSessionRecoveryCancelled: hasDismissed,
        dismissSessionRecoveryCancelled: () => {
            setHasDismissed(true);
        },
    };
};

export const useShouldNotifySessionRecoveryCancelled = () => {
    const isSessionRecoveryAvailable = useIsSessionRecoveryAvailable();
    const sessionRecoveryState = useSessionRecoveryState();
    const { hasDismissedSessionRecoveryCancelled } = useHasDismissedSessionRecoveryCancelled();

    return (
        isSessionRecoveryAvailable &&
        sessionRecoveryState === SessionRecoveryState.CANCELLED &&
        !hasDismissedSessionRecoveryCancelled
    );
};
