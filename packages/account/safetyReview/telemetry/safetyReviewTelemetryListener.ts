import { userThunk } from '@proton/account/user';
import type { ContactEmailsState } from '@proton/mail/store/contactEmails';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';

import type { DelegatedAccessState } from '../../delegatedAccess';
import { selectEnrichedOutgoingDelegatedAccess } from '../../delegatedAccess/shared/outgoing/selector';
import { selectAccountRecovery } from '../../recovery/accountRecovery';
import { selectMnemonicData } from '../../recovery/mnemonic';
import { selectRecoveryFileData } from '../../recovery/recoveryFile';
import type { UserSettingsState } from '../../userSettings';
import type { SafetyReviewRecoveryState } from './interfaces';
import { safetyReviewListenerStarted, safetyReviewListenerStopped } from './listenerActions';
import { getSafetyReviewCohortChangeTelemetry, sendSafetyReviewPageLoadTelemetryReport } from './safetyReviewTelemetry';
import {
    type SafetyReviewReduxState,
    safetyReviewTelemetrySlice,
    selectSafetyReviewTelemetry,
} from './safetyReviewTelemetrySlice';
import { SafetyReviewCohort } from './utils/getCohort';
import { getSource } from './utils/getSource';
import { getValidSafetyReviewSession } from './utils/getValidSafetyReviewSession';
import {
    getSafetyReviewSessionItem,
    removeSafetyReviewSessionItem,
    setSafetyReviewSessionItem,
} from './utils/safetyReviewSessionStorage';

interface RequiredState extends UserSettingsState, DelegatedAccessState, ContactEmailsState, SafetyReviewReduxState {}

export const safetyReviewTelemetryListener = (startListening: SharedStartListening<RequiredState>) => {
    /**
     * Recalculate cohort whenever recovery-related state changes
     */
    startListening({
        predicate: (_, currentState, previousState) => {
            return (
                selectAccountRecovery(currentState) !== selectAccountRecovery(previousState) ||
                selectMnemonicData(currentState) !== selectMnemonicData(previousState) ||
                selectRecoveryFileData(currentState) !== selectRecoveryFileData(previousState) ||
                selectEnrichedOutgoingDelegatedAccess(currentState) !==
                    selectEnrichedOutgoingDelegatedAccess(previousState)
            );
        },
        effect: (_, listenerApi) => {
            const state = listenerApi.getState();
            const accountRecovery = selectAccountRecovery(state);
            const mnemonicData = selectMnemonicData(state);
            const recoveryFileData = selectRecoveryFileData(state);
            const outgoingDelegatedAccess = selectEnrichedOutgoingDelegatedAccess(state);

            if (
                accountRecovery.loading ||
                mnemonicData.loading ||
                recoveryFileData.loading ||
                outgoingDelegatedAccess.loading
            ) {
                return;
            }

            const params: SafetyReviewRecoveryState = {
                email: {
                    isEnabled: accountRecovery.emailRecovery.perfect,
                    hasValue: !!accountRecovery.emailRecovery.value,
                },
                phone: {
                    isEnabled: accountRecovery.phoneRecovery.perfect,
                    hasValue: !!accountRecovery.phoneRecovery.value,
                },
                deviceRecovery: {
                    isAvailable: recoveryFileData.isRecoveryFileAvailable,
                    isEnabled: recoveryFileData.hasDeviceRecoveryEnabled,
                },
                phrase: { isAvailable: mnemonicData.isMnemonicAvailable, isSet: mnemonicData.isMnemonicSet },
                recoveryContactsData: {
                    isAvailable: outgoingDelegatedAccess.isAvailable,
                    isEnabled:
                        outgoingDelegatedAccess.isAvailable &&
                        outgoingDelegatedAccess.recoveryContacts.items.length > 0,
                },
                emergencyContactsData: {
                    isAvailable: outgoingDelegatedAccess.isAvailable,
                    isEnabled:
                        outgoingDelegatedAccess.isAvailable &&
                        outgoingDelegatedAccess.emergencyContacts.items.length > 0,
                },
            };

            listenerApi.dispatch(safetyReviewTelemetrySlice.actions.setRecoveryState(params));
        },
    });

    /**
     * Persist session in session storage on session change
     */
    startListening({
        predicate: (_, currentState, previousState) => {
            const previousSafetyReviewTelemetry = selectSafetyReviewTelemetry(previousState);
            const currentSafetyReviewTelemetry = selectSafetyReviewTelemetry(currentState);

            return previousSafetyReviewTelemetry.session !== currentSafetyReviewTelemetry.session;
        },
        effect: async (_, listenerApi) => {
            const { getState } = listenerApi;
            const { user, safetyReviewTelemetry } = getState();

            if (!user.value || !safetyReviewTelemetry.session) {
                return;
            }

            setSafetyReviewSessionItem(safetyReviewTelemetry.session, user.value.ID);
        },
    });

    /**
     * Remove safety review session from session storage on clear dispatch
     */
    startListening({
        predicate: (action) => {
            return safetyReviewTelemetrySlice.actions.clearSession.match(action);
        },
        effect: async (_, listenerApi) => {
            const { getState } = listenerApi;
            const { user } = getState();

            if (!user.value) {
                return;
            }

            removeSafetyReviewSessionItem(user.value.ID);
        },
    });

    /**
     * Send telemetry on cohort transition
     */
    startListening({
        // Only send telemetry if we are in the safety review
        // The Cohort can change outside the safety review. Ie enabling the recovery phrase on the recovery page
        actionCreator: safetyReviewListenerStarted,
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();

            while (true) {
                const [action, state] = await Promise.race([
                    listenerApi.take((_, currentState, previousState) => {
                        const previousSafetyReviewTelemetry = selectSafetyReviewTelemetry(previousState);
                        const currentSafetyReviewTelemetry = selectSafetyReviewTelemetry(currentState);

                        return (
                            previousSafetyReviewTelemetry.cohort !== undefined &&
                            currentSafetyReviewTelemetry.cohort !== undefined &&
                            previousSafetyReviewTelemetry.cohort !== currentSafetyReviewTelemetry.cohort
                        );
                    }),
                    listenerApi.take((action) => safetyReviewListenerStopped.match(action)),
                ]);

                if (safetyReviewListenerStopped.match(action)) {
                    listenerApi.subscribe();
                    break;
                }

                const { safetyReviewTelemetry } = state;
                const { cohort, session, recoveryState } = safetyReviewTelemetry;

                if (!cohort || cohort === SafetyReviewCohort.NO_RECOVERY_METHOD) {
                    continue;
                }

                const safetyReviewTelemetrySession = getValidSafetyReviewSession({
                    currentSession: session,
                    currentCohort: cohort,
                });

                const cohortChangeTelemetry = getSafetyReviewCohortChangeTelemetry({
                    api: listenerApi.extra.api,
                    initialCohort: safetyReviewTelemetrySession.initialCohort,
                    variant: 'B',
                });

                if (cohort === SafetyReviewCohort.COMPLETE_RECOVERY) {
                    void cohortChangeTelemetry.sendCompleteRecoveryMultiple();
                    continue;
                }

                if (cohort === SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE) {
                    const { email, phone, deviceRecovery, phrase, recoveryContactsData, emergencyContactsData } =
                        recoveryState;

                    const isPerfectEmailState = email.isEnabled;
                    const isPerfectPhoneState = phone.isEnabled;
                    const isPerfectDeviceState = deviceRecovery.isAvailable && deviceRecovery.isEnabled;
                    const isPerfectRecoveryContacts =
                        recoveryContactsData.isAvailable && recoveryContactsData.isEnabled;
                    const isPerfectPhraseState = phrase.isAvailable && phrase.isSet;
                    const isPerfectEmergencyContacts =
                        emergencyContactsData.isAvailable && emergencyContactsData.isEnabled;

                    const singleMethod = (() => {
                        if (isPerfectPhraseState) {
                            return 'phrase';
                        }
                        if (isPerfectEmergencyContacts) {
                            return 'emergency-contacts';
                        }

                        const hasDataRecoveryMethod = isPerfectDeviceState || isPerfectRecoveryContacts;

                        if (isPerfectEmailState && hasDataRecoveryMethod) {
                            return 'email';
                        }
                        if (isPerfectPhoneState && hasDataRecoveryMethod) {
                            return 'phone';
                        }

                        return 'unknown';
                    })();

                    void cohortChangeTelemetry.sendCompleteRecoverySingle({ singleMethod });
                    continue;
                }

                if (cohort === SafetyReviewCohort.ACCOUNT_RECOVERY_ENABLED) {
                    void cohortChangeTelemetry.sendAccountRecoveryEnabled();
                }
            }
        },
    });

    /**
     * Get touchpoint source
     */
    startListening({
        actionCreator: safetyReviewListenerStarted,
        effect: async (action, listenerApi) => {
            const user = await listenerApi.dispatch(userThunk());

            const { pathname, search } = new URL(action.payload.href);
            const source = getSource({ pathname, search: new URLSearchParams(search) });
            if (source) {
                listenerApi.dispatch(safetyReviewTelemetrySlice.actions.setSource({ source }));
            }
            const persistedSession = getSafetyReviewSessionItem(user.ID);
            const state = listenerApi.getState().safetyReviewTelemetry;

            const session = getValidSafetyReviewSession({
                currentSession: persistedSession,
                currentCohort: state.cohort || SafetyReviewCohort.NO_RECOVERY_METHOD,
            });
            listenerApi.dispatch(safetyReviewTelemetrySlice.actions.setSession({ session }));

            sendSafetyReviewPageLoadTelemetryReport({
                api: listenerApi.extra.api,
                initialCohort: session.initialCohort,
                source,
                variant: 'B',
            });
        },
    });

    startListening({
        actionCreator: safetyReviewListenerStopped,
        effect: async (_, listenerApi) => {
            listenerApi.dispatch(safetyReviewTelemetrySlice.actions.clearSession());
            listenerApi.dispatch(safetyReviewTelemetrySlice.actions.clearSource());
        },
    });
};
