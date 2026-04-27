import { createSelector } from '@reduxjs/toolkit';

import { selectAddresses } from '@proton/account/addresses';
import type { SessionRecoverySliceReducerState } from '@proton/account/recovery/sessionRecovery';
import { selectUser } from '@proton/account/user';
import { selectUserSettings } from '@proton/account/userSettings';
import { MNEMONIC_STATUS, SessionRecoveryState } from '@proton/shared/lib/interfaces';
import { getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';

export const selectSessionRecoverySliceState = (state: SessionRecoverySliceReducerState) => state.sessionRecovery;

export const selectSessionRecoveryData = createSelector(
    [selectUser, selectUserSettings, selectAddresses, selectSessionRecoverySliceState],
    ({ value: user }, { value: userSettings }, { value: addresses }, sessionRecoverySliceState) => {
        const sessionRecoveryState: SessionRecoveryState = !user?.AccountRecovery
            ? SessionRecoveryState.NONE
            : user.AccountRecovery.State;
        const isSessionRecoveryInitiatedByCurrentSession = !!user?.AccountRecovery?.IsCurrentSession;

        const hasMigratedKeys = getHasMigratedAddressKeys(addresses);
        const isPrivateUser = !!user?.isPrivate;

        const loadingAddresses = !addresses;

        const isSessionRecoveryEnabled = !!userSettings?.SessionAccountRecovery;
        const isSessionRecoveryAvailable = !loadingAddresses && hasMigratedKeys && isPrivateUser;

        const sessionRecoveryInitiated =
            sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD ||
            sessionRecoveryState === SessionRecoveryState.INSECURE;

        const isSessionRecoveryInitiationAvailable =
            isSessionRecoveryAvailable && isSessionRecoveryEnabled && !sessionRecoveryInitiated;

        /**
         * Determines whether applications should display session recovery in progress "notifications".
         * Notifications here means banners or modals and not the browser notifications.
         */
        const shouldNotifySessionRecoveryInProgress =
            isSessionRecoveryAvailable &&
            sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD &&
            !sessionRecoverySliceState.gracePeriodConfirmed &&
            !isSessionRecoveryInitiatedByCurrentSession;

        const shouldNotifySessionRecoveryCancelled =
            isSessionRecoveryAvailable &&
            sessionRecoveryState === SessionRecoveryState.CANCELLED &&
            !sessionRecoverySliceState.canceledStateDismissed;

        const shouldNotifyPasswordResetAvailable =
            isSessionRecoveryAvailable && sessionRecoveryState === SessionRecoveryState.INSECURE;

        return {
            isSessionRecoveryEnabled,
            isSessionRecoveryAvailable,
            sessionRecoveryState,
            sessionRecoveryInitiated,
            isSessionRecoveryInitiatedByCurrentSession,
            isSessionRecoveryInitiationAvailable,
            shouldNotifySessionRecoveryInProgress,
            shouldNotifySessionRecoveryCancelled,
            shouldNotifyPasswordResetAvailable,
            loading: !user || !addresses || !userSettings,
        };
    }
);

export const selectAvailableRecoveryMethods = createSelector(
    [selectUser, selectUserSettings],
    ({ value: user }, { value: userSettings }) => {
        const recoveryPhrase = user && user.MnemonicStatus === MNEMONIC_STATUS.SET;
        const recoveryEmail = !!userSettings?.Email.Reset && !!userSettings?.Email.Value;
        const recoveryPhone = !!userSettings?.Phone.Reset && !!userSettings?.Phone.Value;

        const availableRecoveryMethods = [
            recoveryEmail && ('email' as const),
            recoveryPhone && ('sms' as const),
            recoveryPhrase && ('mnemonic' as const),
        ].filter(isTruthy);

        const hasRecoveryMethod = availableRecoveryMethods.length > 0;
        const hasAccountRecoveryMethod = (['email', 'sms'] as const).some((accountRecoveryMethod) =>
            availableRecoveryMethods.includes(accountRecoveryMethod)
        );

        return { hasAccountRecoveryMethod, availableRecoveryMethods, hasRecoveryMethod, loading: !userSettings };
    }
);

export const selectSessionRecoveryGracePeriodEndTime = createSelector([selectUser], ({ value: user }) => {
    if (!user || !user.AccountRecovery || user.AccountRecovery.State !== SessionRecoveryState.GRACE_PERIOD) {
        return null;
    }
    return user.AccountRecovery.EndTime * 1000;
});
