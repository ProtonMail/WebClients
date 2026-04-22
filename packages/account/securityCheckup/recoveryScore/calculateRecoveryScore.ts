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
            isAvailable: hasPasswordResetOption && state.securityState.deviceRecovery.isAvailable,
            isEnabled: getIsPerfectDeviceRecoveryState(state.securityState),
        },
        {
            id: 'recoveryFile',
            isAvailable: hasPasswordResetOption && state.recoveryFile.isAvailable,
            isEnabled: state.recoveryFile.isEnabled,
        },
        {
            id: 'recoveryContacts',
            isAvailable: hasPasswordResetOption && state.recoveryContacts.isAvailable,
            isEnabled: state.recoveryContacts.isEnabled,
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
    const enabledOptions = availableOptions.filter((item) => item.isEnabled);
    const score = clamp(enabledOptions.length, MIN_SCORE, MAX_SCORE);

    return { score, maxScore: MAX_SCORE, scoreItems };
};
