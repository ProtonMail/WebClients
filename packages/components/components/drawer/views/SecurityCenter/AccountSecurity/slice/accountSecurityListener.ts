import { selectUser, selectUserSettings } from '@proton/account';
import { selectFeatures } from '@proton/features';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { MNEMONIC_STATUS } from '@proton/shared/lib/interfaces';
import { getPrimaryRecoverySecret } from '@proton/shared/lib/recoveryFile/recoveryFile';
import { getHasFIDO2SettingEnabled, getHasTOTPSettingEnabled } from '@proton/shared/lib/settings/twoFactor';

import { AccountSecuritySlice, securityCenterSliceActions } from './accountSecuritySlice';

export const startAccountSecurityListener = (startListening: SharedStartListening<AccountSecuritySlice>) => {
    startListening({
        predicate: (action, currentState, nextState) => {
            const hasChange =
                selectUser(currentState) !== selectUser(nextState) ||
                selectUserSettings(currentState) !== selectUserSettings(nextState) ||
                selectFeatures(currentState) !== selectFeatures(nextState);

            return hasChange;
        },
        effect: async (action, listenerApi) => {
            const state = listenerApi.getState();

            const accountSecurity = state.accountSecurity;
            const user = state.user.value;
            const userSettings = state.userSettings.value;

            if (!userSettings || !user || !userSettings) {
                return;
            }

            const primaryRecoverySecret = getPrimaryRecoverySecret(user.Keys);

            const recoveryByEmail = !!userSettings.Email.Reset && !!userSettings.Email.Value;
            const recoveryByPhone = !!userSettings.Phone.Reset && !!userSettings.Phone.Value;

            const hasRecoveryPhrase = user.MnemonicStatus === MNEMONIC_STATUS.SET;
            const hasCurrentRecoveryFile = primaryRecoverySecret !== undefined;

            const hasTOTPEnabled = getHasTOTPSettingEnabled(userSettings);
            const hasFIDO2Enabled = getHasFIDO2SettingEnabled(userSettings);

            const nextAccountSecurity: AccountSecuritySlice['accountSecurity'] = {
                loading: false,
                accountRecoverySet: recoveryByEmail || recoveryByPhone || hasRecoveryPhrase,
                dataRecoverySet: hasRecoveryPhrase || hasCurrentRecoveryFile,
                twoFactorAuthSet: hasTOTPEnabled || hasFIDO2Enabled,
            };

            const shouldUpdateStore = (Object.keys(nextAccountSecurity) as (keyof typeof nextAccountSecurity)[]).some(
                (key) => accountSecurity[key] !== nextAccountSecurity[key]
            );

            if (shouldUpdateStore) {
                listenerApi.dispatch(securityCenterSliceActions.setAccountSecurity(nextAccountSecurity));
            }
        },
    });
};
