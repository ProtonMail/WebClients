import { MNEMONIC_STATUS, SessionRecoveryState } from '@proton/shared/lib/interfaces';

import useUser from './useUser';
import useUserSettings from './useUserSettings';

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

    const isPrivateUser = user?.isPrivate;

    return isPrivateUser;
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
