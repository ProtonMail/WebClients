import { createSelector } from '@reduxjs/toolkit';

import { getIsOutgoingDelegatedAccessAvailable } from '@proton/account/delegatedAccess/available';
import { selectEnrichedOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/shared/outgoing/selector';
import { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { selectSessionRecoveryData } from '@proton/account/recovery/sessionRecoverySelectors';
import { selectSecurityCheckup } from '@proton/account/securityCheckup';
import { selectUser } from '@proton/account/user';
import { selectUserSettings } from '@proton/account/userSettings';

import { type RecoveryScoreState, calculateRecoveryScore } from './calculateRecoveryScore';

export const selectRecoveryScore = createSelector(
    [
        selectSecurityCheckup,
        selectUser,
        selectUserSettings,
        selectRecoveryFileData,
        selectSessionRecoveryData,
        selectEnrichedOutgoingDelegatedAccess,
    ],
    (
        securityState,
        { value: user },
        { value: userSettings },
        { isRecoveryFileAvailable, hasOutdatedRecoveryFile, recoverySecrets },
        { isSessionRecoveryAvailable, isSessionRecoveryEnabled },
        { items }
    ) => {
        const isEmergencyAccessAvailable = !!user && user.isPrivate && getIsOutgoingDelegatedAccessAvailable(user);
        const isRecoveryContactsAvailable = isEmergencyAccessAvailable;
        const recoveryScoreState: RecoveryScoreState = {
            securityState: securityState.securityState,
            recoveryFile: {
                isAvailable: isRecoveryFileAvailable,
                isEnabled: isRecoveryFileAvailable && !hasOutdatedRecoveryFile && recoverySecrets.length > 0,
            },
            recoveryContacts: {
                isAvailable: isRecoveryContactsAvailable,
                isEnabled: isRecoveryContactsAvailable && items.recoveryContacts.length > 0,
            },
            signedInReset: {
                isAvailable: isSessionRecoveryAvailable,
                isEnabled: isSessionRecoveryAvailable && isSessionRecoveryEnabled,
            },
            qrCodeSignIn: {
                isAvailable: true,
                isEnabled: !userSettings?.Flags.EdmOptOut,
            },
            emergencyContacts: {
                isAvailable: isEmergencyAccessAvailable,
                isEnabled: isEmergencyAccessAvailable && items.emergencyContacts.length > 0,
            },
        };
        const { score, maxScore, scoreItems } = calculateRecoveryScore(recoveryScoreState);
        return { score, maxScore, scoreItems, securityState: securityState.securityState };
    }
);
