import { APPS, DAY, HOUR } from '@proton/shared/lib/constants';
import { MNEMONIC_STATUS, SessionRecoveryState } from '@proton/shared/lib/interfaces';
import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';

import { useSessionRecoveryLocalStorage } from '../containers/account/sessionRecovery/SessionRecoveryLocalStorageManager';
import { useFlag } from '../containers/unleash';
import useAddresses from './useAddresses';
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

export const useHasRecoveryMethod = () => {
    const [user] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const hasRecoveryEmail = !!userSettings?.Email.Reset && !!userSettings?.Email.Value;
    const hasRecoveryPhone = !!userSettings?.Phone.Reset && !!userSettings?.Phone.Value;
    const hasRecoveryPhrase = user.MnemonicStatus === MNEMONIC_STATUS.SET;
    const hasRecoveryMethod = hasRecoveryEmail || hasRecoveryPhone || hasRecoveryPhrase;

    return [hasRecoveryMethod, loadingUserSettings] as const;
};

export const useIsSessionRecoveryAvailable = () => {
    const [user] = useUser();
    const [addresses = [], loadingAddresses] = useAddresses();
    const { APP_NAME } = useConfig();

    const hasMigratedKeys = getHasMigratedAddressKeys(addresses);
    const feature = useFlag('SignedInAccountRecovery');
    const isPrivateUser = user?.isPrivate;

    return [
        APP_NAME !== APPS.PROTONVPN_SETTINGS && !loadingAddresses && hasMigratedKeys && feature && isPrivateUser,
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

    if (!user.AccountRecovery || user.AccountRecovery.State !== SessionRecoveryState.INSECURE) {
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
