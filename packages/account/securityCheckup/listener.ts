import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { TelemetryAccountSecurityCheckupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import {
    getIsPerfectDeviceRecoveryState,
    getIsPerfectEmailState,
    getIsPerfectPhoneState,
    getIsPerfectPhraseState,
} from '@proton/shared/lib/helpers/securityCheckup';
import { MNEMONIC_STATUS, SETTINGS_STATUS } from '@proton/shared/lib/interfaces';
import SecurityCheckupCohort from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';
import { getIsMnemonicAvailable } from '@proton/shared/lib/mnemonic';
import { getIsRecoveryFileAvailable } from '@proton/shared/lib/recoveryFile/recoveryFile';

import type { AddressesState } from '../addresses';
import { selectAddresses } from '../addresses';
import type { UserState } from '../user';
import { selectUser } from '../user';
import type { UserKeysState } from '../userKeys';
import { selectUserKeys } from '../userKeys';
import type { UserSettingsState } from '../userSettings';
import { selectUserSettings } from '../userSettings';
import getSource from './helpers/getSource';
import getValidSecurityCheckupSession from './helpers/getValidSecurityCheckupSession';
import {
    removeSecurityCheckupSessionItem,
    setSecurityCheckupSessionItem,
} from './helpers/securityCheckupSessionStorage';
import type { SecurityCheckupReduxState } from './slice';
import { securityCheckupSlice, selectSecurityCheckup } from './slice';

interface RequiredState
    extends UserSettingsState,
        UserState,
        AddressesState,
        UserKeysState,
        SecurityCheckupReduxState {}

export const securityCheckupListener = (startListening: SharedStartListening<RequiredState>) => {
    /**
     * Calculate security state
     */
    startListening({
        predicate: (action, currentState, previousState) => {
            const previousUser = selectUser(previousState);
            const currentUser = selectUser(currentState);

            const previousUserKeys = selectUserKeys(previousState);
            const currentUserKeys = selectUserKeys(currentState);

            const previousAddresses = selectAddresses(previousState).value;
            const currentAddresses = selectAddresses(currentState).value;

            const previousUserSettings = selectUserSettings(previousState);
            const currentUserSettings = selectUserSettings(currentState);

            return (
                currentUser !== previousUser ||
                currentUserKeys !== previousUserKeys ||
                currentAddresses !== previousAddresses ||
                currentUserSettings !== previousUserSettings
            );
        },
        effect: async (action, listenerApi) => {
            const securityCheckupEnabled = listenerApi.extra.unleashClient.isEnabled('SecurityCheckup');
            if (!securityCheckupEnabled) {
                return;
            }

            const {
                getState,
                dispatch,
                extra: { config },
            } = listenerApi;

            const { user, userKeys, addresses, userSettings, securityCheckup } = getState();
            const { actions } = securityCheckupSlice;

            if (!user.value || !userKeys.value || !addresses.value || !userSettings.value) {
                if (!securityCheckup.loading) {
                    dispatch(actions.setLoading({ loading: true }));
                }
                return;
            }

            const isMnemonicAvailable = getIsMnemonicAvailable({
                addresses: addresses.value,
                user: user.value,
                app: config.APP_NAME,
            });
            const isRecoveryFileAvailable = getIsRecoveryFileAvailable({
                user: user.value,
                addresses: addresses.value,
                userKeys: userKeys.value,
                appName: config.APP_NAME,
            });

            const securityState: SecurityState = {
                phrase: {
                    isAvailable: isMnemonicAvailable,
                    isSet: user.value.MnemonicStatus === MNEMONIC_STATUS.SET,
                    isOutdated: user.value.MnemonicStatus === MNEMONIC_STATUS.OUTDATED,
                },
                email: {
                    value: userSettings.value.Email.Value,
                    isEnabled: !!userSettings.value.Email.Reset,
                    verified: userSettings.value.Email.Status === SETTINGS_STATUS.VERIFIED,
                },
                phone: {
                    value: userSettings.value.Phone.Value,
                    isEnabled: !!userSettings.value.Phone.Reset,
                    verified: userSettings.value.Phone.Status === SETTINGS_STATUS.VERIFIED,
                },
                deviceRecovery: {
                    isAvailable: isRecoveryFileAvailable,
                    isEnabled: !!userSettings.value.DeviceRecovery,
                },
            };

            dispatch(actions.setSecurityState({ securityState }));

            if (securityCheckup.loading) {
                dispatch(actions.setLoading({ loading: false }));
            }
        },
    });

    /**
     * Persist session in session storage on session change
     */
    startListening({
        predicate: (action, currentState, previousState) => {
            const previousSecurityCheckup = selectSecurityCheckup(previousState);
            const currentSecurityCheckup = selectSecurityCheckup(currentState);

            return previousSecurityCheckup.session !== currentSecurityCheckup.session;
        },
        effect: async (action, listenerApi) => {
            const securityCheckupEnabled = listenerApi.extra.unleashClient.isEnabled('SecurityCheckup');
            if (!securityCheckupEnabled) {
                return;
            }

            const { getState } = listenerApi;
            const { user, securityCheckup } = getState();

            if (!user.value || !securityCheckup.session) {
                return;
            }

            setSecurityCheckupSessionItem(securityCheckup.session, user.value.ID);
        },
    });

    /**
     * Remove security checkup session from session storage on clear dispatch
     */
    startListening({
        predicate: (action) => {
            return securityCheckupSlice.actions.clearSession.match(action);
        },
        effect: async (action, listenerApi) => {
            const securityCheckupEnabled = listenerApi.extra.unleashClient.isEnabled('SecurityCheckup');
            if (!securityCheckupEnabled) {
                return;
            }

            const { getState } = listenerApi;
            const { user } = getState();

            if (!user.value) {
                return;
            }

            removeSecurityCheckupSessionItem(user.value.ID);
        },
    });

    /**
     * Send telemetry on cohort transition
     */
    startListening({
        predicate: (action, currentState, previousState) => {
            const previousSecurityCheckup = selectSecurityCheckup(previousState);
            const currentSecurityCheckup = selectSecurityCheckup(currentState);

            return (
                previousSecurityCheckup.cohort !== undefined &&
                currentSecurityCheckup.cohort !== undefined &&
                previousSecurityCheckup.cohort !== currentSecurityCheckup.cohort
            );
        },
        effect: async (action, listenerApi) => {
            const securityCheckupEnabled = listenerApi.extra.unleashClient.isEnabled('SecurityCheckup');
            if (!securityCheckupEnabled) {
                return;
            }

            // Only send telemetry if we are in the security checkup
            // The Cohort can change outside the security checkup. Ie enabling the recovery phrase on the recovery page
            if (!listenerApi.extra.history.location.pathname.includes(SECURITY_CHECKUP_PATHS.ROOT)) {
                return;
            }

            const { user, securityCheckup } = listenerApi.getState();

            if (!user.value) {
                return;
            }

            const { cohort, session, securityState } = securityCheckup;
            if (!cohort || cohort === SecurityCheckupCohort.NO_RECOVERY_METHOD) {
                // No change should have occurred
                return;
            }

            const securityCheckupSession = getValidSecurityCheckupSession({
                currentSession: session,
                currentCohort: cohort,
            });

            const isPerfectPhraseState = getIsPerfectPhraseState(securityState);
            const isPerfectEmailState = getIsPerfectEmailState(securityState);
            const isPerfectPhoneState = getIsPerfectPhoneState(securityState);
            const isPerfectDeviceState = getIsPerfectDeviceRecoveryState(securityState);
            const singleMethod = (() => {
                if (isPerfectPhraseState) {
                    return 'phrase';
                }

                if (isPerfectEmailState && isPerfectDeviceState) {
                    return 'email';
                }

                if (isPerfectPhoneState && isPerfectDeviceState) {
                    return 'phone';
                }

                return 'unknown';
            })();

            const {
                event,
                dimensions = {},
            }: { event?: TelemetryAccountSecurityCheckupEvents; dimensions?: Record<string, string> } = (() => {
                if (cohort === SecurityCheckupCohort.COMPLETE_RECOVERY_MULTIPLE) {
                    return { event: TelemetryAccountSecurityCheckupEvents.completeRecoveryMultiple };
                }

                if (cohort === SecurityCheckupCohort.COMPLETE_RECOVERY_SINGLE) {
                    return {
                        event: TelemetryAccountSecurityCheckupEvents.completeRecoverySingle,
                        dimensions: {
                            singleMethod,
                        },
                    };
                }

                if (cohort === SecurityCheckupCohort.ACCOUNT_RECOVERY_ENABLED) {
                    return { event: TelemetryAccountSecurityCheckupEvents.accountRecoveryEnabled };
                }

                return { event: undefined };
            })();

            if (!event) {
                return;
            }

            void sendTelemetryReport({
                api: listenerApi.extra.api,
                measurementGroup: TelemetryMeasurementGroups.accountSecurityCheckup,
                event,
                dimensions: {
                    initialCohort: securityCheckupSession.initialCohort,
                    ...dimensions,
                },
            });
        },
    });

    /**
     * Get touchpoint source
     */
    startListening({
        predicate: (_, currentState) => {
            const currentSecurityCheckup = selectSecurityCheckup(currentState);

            return !currentSecurityCheckup.source;
        },
        effect: async (action, listenerApi) => {
            // Only calculate source if we are in the security checkup
            if (!listenerApi.extra.history.location.pathname.includes(SECURITY_CHECKUP_PATHS.ROOT)) {
                return;
            }

            const { pathname, search } = listenerApi.extra.history.location;
            const source = getSource({ pathname, search: new URLSearchParams(search) });
            if (!source) {
                return;
            }

            listenerApi.dispatch(securityCheckupSlice.actions.setSource({ source }));
        },
    });
};
