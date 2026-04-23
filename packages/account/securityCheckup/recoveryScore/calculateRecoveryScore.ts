import {
    getIsPerfectDeviceRecoveryState,
    getIsPerfectEmailState,
    getIsPerfectPhoneState,
    getIsPerfectPhraseState,
} from '@proton/shared/lib/helpers/securityCheckup';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';
import clamp from '@proton/utils/clamp';

export type RecoveryScoreItemId =
    | 'email'
    | 'phone'
    | 'deviceRecovery'
    | 'recoveryFile'
    | 'recoveryContacts'
    | 'recoveryPhrase'
    | 'signedInReset'
    | 'qrCodeSignIn'
    | 'emergencyContacts'
    | 'passwordVerification';

export type RecoveryScoreItem = {
    id: RecoveryScoreItemId;
    isAvailable: boolean;
    isEnabled: boolean;
    /** Omitted or true: counts toward the score. False: gated until recovery email or SMS is configured. */
    countsTowardScore?: boolean;
};

export type RecoveryScoreState = {
    securityState: SecurityState;
    recoveryFile: { isAvailable: boolean; isEnabled: boolean };
    recoveryContacts: { isAvailable: boolean; isEnabled: boolean };
    signedInReset: { isAvailable: boolean; isEnabled: boolean };
    qrCodeSignIn: { isAvailable: boolean; isEnabled: boolean };
    emergencyContacts: { isAvailable: boolean; isEnabled: boolean };
};

const MIN_SCORE = 0;
const MAX_SCORE = 10;

export const calculateRecoveryScore = (
    state: RecoveryScoreState
): { score: number; maxScore: number; scoreItems: RecoveryScoreItem[] } => {
    const emailEnabled = getIsPerfectEmailState(state.securityState);
    const phoneEnabled = getIsPerfectPhoneState(state.securityState);
    const hasPasswordResetOption = emailEnabled || phoneEnabled;

    const scoreItems: RecoveryScoreItem[] = [
        {
            id: 'email',
            isAvailable: true,
            isEnabled: emailEnabled,
        },
        {
            id: 'phone',
            isAvailable: true,
            isEnabled: phoneEnabled,
        },
        {
            id: 'deviceRecovery',
            isAvailable: state.securityState.deviceRecovery.isAvailable,
            isEnabled: getIsPerfectDeviceRecoveryState(state.securityState),
            countsTowardScore: hasPasswordResetOption,
        },
        {
            id: 'recoveryFile',
            isAvailable: state.recoveryFile.isAvailable,
            isEnabled: state.recoveryFile.isEnabled,
            countsTowardScore: hasPasswordResetOption,
        },
        {
            id: 'recoveryContacts',
            isAvailable: state.recoveryContacts.isAvailable,
            isEnabled: state.recoveryContacts.isEnabled,
            countsTowardScore: hasPasswordResetOption,
        },
        {
            id: 'recoveryPhrase',
            isAvailable: state.securityState.phrase.isAvailable,
            isEnabled: getIsPerfectPhraseState(state.securityState),
        },
        {
            id: 'signedInReset',
            isAvailable: state.signedInReset.isAvailable,
            isEnabled: state.signedInReset.isEnabled,
        },
        {
            id: 'qrCodeSignIn',
            isAvailable: state.qrCodeSignIn.isAvailable,
            isEnabled: state.qrCodeSignIn.isEnabled,
        },
        {
            id: 'emergencyContacts',
            isAvailable: state.emergencyContacts.isAvailable,
            isEnabled: state.emergencyContacts.isEnabled,
        },
        {
            id: 'passwordVerification',
            isAvailable: true,
            isEnabled: true, // password verification flow is not implemented yet
        },
    ];

    const availableOptions = scoreItems.filter((item) => item.isAvailable);
    const enabledAndActiveOptions = availableOptions.filter(
        (item) => item.isEnabled && item.countsTowardScore !== false
    );
    const score = clamp(enabledAndActiveOptions.length, MIN_SCORE, MAX_SCORE);

    return { score, maxScore: MAX_SCORE, scoreItems };
};
