import { c } from 'ttag';

import type { RecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';

export const getPositiveRecoveryActionItemCopy = (item: RecoveryActionItem) => {
    switch (item.id) {
        case 'passwordVerification':
            return c('safety_review').t`Verified password`;
        case 'setRecoveryEmail':
            return c('safety_review').t`Added recovery email`;
        case 'verifyRecoveryEmail':
            return c('safety_review').t`Verified recovery email`;
        case 'enableRecoveryEmail':
            return c('safety_review').t`Enabled email recovery`;
        case 'setRecoveryPhone':
            return c('safety_review').t`Added recovery phone`;
        case 'verifyRecoveryPhone':
            return c('safety_review').t`Verified recovery phone`;
        case 'enableRecoveryPhone':
            return c('safety_review').t`Enabled phone recovery`;
        case 'deviceRecovery':
            return c('safety_review').t`Enabled device recovery`;
        case 'recoveryFile':
            return c('safety_review').t`Downloaded recovery file`;
        case 'recoveryContacts':
            return c('safety_review').t`Added recovery contacts`;
        case 'recoveryPhrase':
            return c('safety_review').t`Saved recovery phrase`;
        case 'signedInReset':
            return c('safety_review').t`Enabled password reset from settings`;
        case 'qrCodeSignIn':
            return c('safety_review').t`Enabled QR code sign-in`;
        case 'upsellEmergencyContacts':
            return c('safety_review').t`Emergency contacts enabled`;
        case 'addEmergencyContacts':
            return c('safety_review').t`Added emergency contacts`;
    }
};

export const getNegativeRecoveryActionItemCopy = (item: RecoveryActionItem) => {
    switch (item.id) {
        case 'passwordVerification':
            return c('safety_review').t`Verify password`;
        case 'setRecoveryEmail':
            return c('safety_review').t`Add recovery email`;
        case 'verifyRecoveryEmail':
            return c('safety_review').t`Verify recovery email`;
        case 'enableRecoveryEmail':
            return c('safety_review').t`Enable email recovery`;
        case 'setRecoveryPhone':
            return c('safety_review').t`Add recovery phone`;
        case 'verifyRecoveryPhone':
            return c('safety_review').t`Verify recovery phone`;
        case 'enableRecoveryPhone':
            return c('safety_review').t`Enable phone recovery`;
        case 'deviceRecovery':
            return c('safety_review').t`Enable device recovery`;
        case 'recoveryFile':
            return c('safety_review').t`Download recovery file`;
        case 'recoveryContacts':
            return c('safety_review').t`Add recovery contacts`;
        case 'recoveryPhrase':
            return c('safety_review').t`Save recovery phrase`;
        case 'signedInReset':
            return c('safety_review').t`Enable password reset from settings`;
        case 'qrCodeSignIn':
            return c('safety_review').t`Enable QR code sign-in`;
        case 'upsellEmergencyContacts':
            return c('safety_review').t`Enable emergency contacts`;
        case 'addEmergencyContacts':
            return c('safety_review').t`Add emergency contacts`;
    }
};
