import { useEffect, useState } from 'react';

import { differenceInMilliseconds } from 'date-fns';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useSessionRecoveryLocalStorage } from '@proton/components/containers/account/sessionRecovery/SessionRecoveryLocalStorageManager';
import { useInterval } from '@proton/hooks';
import { APPS, DAY, HOUR, MINUTE, SECOND } from '@proton/shared/lib/constants';
import { MNEMONIC_STATUS, SessionRecoveryState } from '@proton/shared/lib/interfaces';
import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';

import useAuthentication from './useAuthentication';
import useConfig from './useConfig';
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

    return !!userSettings?.SessionAccountRecovery;
};

export const useAvailableRecoveryMethods = () => {
    const [user] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const recoveryPhrase = user.MnemonicStatus === MNEMONIC_STATUS.SET;
    const recoveryEmail = !!userSettings?.Email.Reset && !!userSettings?.Email.Value;
    const recoveryPhone = !!userSettings?.Phone.Reset && !!userSettings?.Phone.Value;

    const availableRecoveryMethods = [
        recoveryEmail && ('email' as const),
        recoveryPhone && ('sms' as const),
        recoveryPhrase && ('mnemonic' as const),
    ].filter(isTruthy);

    return [availableRecoveryMethods, loadingUserSettings] as const;
};

export const useIsSessionRecoveryAvailable = () => {
    const [user] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();
    const { APP_NAME } = useConfig();

    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);
    const isPrivateUser = user?.isPrivate;

    return [
        APP_NAME !== APPS.PROTONVPN_SETTINGS && !loadingAddresses && hasMigratedKeys && isPrivateUser,
        loadingAddresses,
    ];
};

export const useIsSessionRecoveryInitiationAvailable = () => {
    const [isSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const isSessionRecoveryEnabled = useIsSessionRecoveryEnabled();
    const sessionRecoveryState = useSessionRecoveryState();

    const sessionRecoveryInitiated =
        sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD ||
        sessionRecoveryState === SessionRecoveryState.INSECURE;

    return isSessionRecoveryAvailable && isSessionRecoveryEnabled && !sessionRecoveryInitiated;
};

/**
 * Determines whether applications should display session recovery in progress "notifications".
 * Notifications here means banners or modals and not the browser notifications.
 */
export const useShouldNotifySessionRecoveryInProgress = () => {
    const [isSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const sessionRecoveryState = useSessionRecoveryState();
    const isSessionRecoveryInitiatedByCurrentSession = useIsSessionRecoveryInitiatedByCurrentSession();
    const { hasConfirmedSessionRecoveryInProgress } = useSessionRecoveryLocalStorage();

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
    const [isSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const sessionRecoveryState = useSessionRecoveryState();

    return isSessionRecoveryAvailable && sessionRecoveryState === SessionRecoveryState.INSECURE;
};

export const useSessionRecoveryGracePeriodHoursRemaining = () => {
    const [user] = useUser();

    if (!user.AccountRecovery || user.AccountRecovery.State !== SessionRecoveryState.GRACE_PERIOD) {
        return null;
    }

    const msRemaining = user.AccountRecovery.EndTime * 1000 - Date.now();

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

export const useShouldNotifySessionRecoveryCancelled = () => {
    const [isSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const sessionRecoveryState = useSessionRecoveryState();
    const { hasDismissedSessionRecoveryCancelled } = useSessionRecoveryLocalStorage();

    return (
        isSessionRecoveryAvailable &&
        sessionRecoveryState === SessionRecoveryState.CANCELLED &&
        !hasDismissedSessionRecoveryCancelled
    );
};
