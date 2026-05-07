import type { SafetyReviewRecoveryState } from '../interfaces';

export enum SafetyReviewCohort {
    NO_RECOVERY_METHOD = 'NO_RECOVERY_METHOD',
    ACCOUNT_RECOVERY_ENABLED = 'ACCOUNT_RECOVERY_ENABLED',
    COMPLETE_RECOVERY_SINGLE = 'COMPLETE_RECOVERY_SINGLE',
    COMPLETE_RECOVERY = 'COMPLETE_RECOVERY',
}

export const getCohort = ({
    email,
    phone,
    deviceRecovery,
    phrase,
    recoveryContactsData,
    emergencyContactsData,
}: SafetyReviewRecoveryState) => {
    const isPerfectPhraseState = phrase.isAvailable && phrase.isSet;
    const isPerfectEmergencyContactsState = emergencyContactsData.isAvailable && emergencyContactsData.isEnabled;

    const isPerfectEmailOrPhoneState = email.isEnabled || phone.isEnabled;

    const hasDataRecoveryMethod =
        (deviceRecovery.isAvailable && deviceRecovery.isEnabled) ||
        (recoveryContactsData.isAvailable && recoveryContactsData.isEnabled);

    /**
     * COMPLETE_RECOVERY
     **/
    if (isPerfectPhraseState && isPerfectEmailOrPhoneState && hasDataRecoveryMethod) {
        return SafetyReviewCohort.COMPLETE_RECOVERY;
    }

    if (isPerfectEmergencyContactsState && isPerfectPhraseState) {
        return SafetyReviewCohort.COMPLETE_RECOVERY;
    }

    if (isPerfectEmergencyContactsState && isPerfectEmailOrPhoneState && hasDataRecoveryMethod) {
        return SafetyReviewCohort.COMPLETE_RECOVERY;
    }

    /**
     * COMPLETE_RECOVERY_SINGLE
     **/
    if (isPerfectPhraseState && !isPerfectEmailOrPhoneState) {
        return SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE;
    }

    if (isPerfectPhraseState && isPerfectEmailOrPhoneState && !hasDataRecoveryMethod) {
        return SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE;
    }

    if (isPerfectEmergencyContactsState && !isPerfectEmailOrPhoneState) {
        return SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE;
    }

    if (isPerfectEmergencyContactsState && isPerfectEmailOrPhoneState && !hasDataRecoveryMethod) {
        return SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE;
    }

    if (isPerfectEmailOrPhoneState && hasDataRecoveryMethod) {
        return SafetyReviewCohort.COMPLETE_RECOVERY_SINGLE;
    }

    /**
     * ACCOUNT_RECOVERY_ENABLED
     **/
    if (isPerfectEmailOrPhoneState && !hasDataRecoveryMethod) {
        return SafetyReviewCohort.ACCOUNT_RECOVERY_ENABLED;
    }

    return SafetyReviewCohort.NO_RECOVERY_METHOD;
};
