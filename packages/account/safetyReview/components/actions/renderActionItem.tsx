import type { ReactNode } from 'react';

import type { RecoveryActionItem } from '../../recoveryState/recoveryState';
import type { SafetyReviewCardsItemProps } from '../cards/interface';
import type { SafetyReviewContainerProps } from '../interface';
import { EnableRecoveryEmail } from './accountRecovery/email/EnableRecoveryEmail';
import { SetRecoveryEmail } from './accountRecovery/email/SetRecoveryEmail';
import { VerifyRecoveryEmail } from './accountRecovery/email/VerifyRecoveryEmail';
import { EnableRecoveryPhone } from './accountRecovery/phone/EnableRecoveryPhone';
import { SetRecoveryPhone } from './accountRecovery/phone/SetRecoveryPhone';
import { VerifyRecoveryPhone } from './accountRecovery/phone/VerifyRecoveryPhone';
import { Congratulations } from './congratulations/Congratulations';
import { AddEmergencyContacts } from './delegatedAccess/AddEmergencyContacts';
import { AddRecoveryContacts } from './delegatedAccess/AddRecoveryContacts';
import { UpsellEmergencyContacts } from './delegatedAccess/UpsellEmergencyContacts';
import { EnableDeviceRecovery } from './deviceRecovery/EnableDeviceRecovery';
import { PasswordVerification } from './password/PasswordVerification';
import { DownloadRecoveryFile } from './recoveryFile/DownloadRecoveryFile';
import { DownloadRecoveryPhrase } from './recoveryPhrase/DownloadRecoveryPhrase';
import { EnableQrCodeSignIn } from './settings/EnableQrCodeSignIn';
import { EnableSignedInReset } from './settings/EnableSignedInReset';

export const renderActionItem = (
    recoveryItem: RecoveryActionItem | null,
    sharedProps: SafetyReviewCardsItemProps | null,
    safetyReviewProps: SafetyReviewContainerProps
): ReactNode => {
    const allProps = {
        ...sharedProps,
        ...safetyReviewProps,
    };

    if (!recoveryItem) {
        return <Congratulations {...allProps} />;
    }

    switch (recoveryItem.id) {
        case 'passwordVerification':
            return <PasswordVerification {...allProps} recoveryItem={recoveryItem} />;
        case 'setRecoveryEmail':
            return <SetRecoveryEmail {...allProps} recoveryItem={recoveryItem} />;
        case 'verifyRecoveryEmail':
            return <VerifyRecoveryEmail {...allProps} recoveryItem={recoveryItem} />;
        case 'enableRecoveryEmail':
            return <EnableRecoveryEmail {...allProps} recoveryItem={recoveryItem} />;
        case 'setRecoveryPhone':
            return <SetRecoveryPhone {...allProps} recoveryItem={recoveryItem} />;
        case 'verifyRecoveryPhone':
            return <VerifyRecoveryPhone {...allProps} recoveryItem={recoveryItem} />;
        case 'enableRecoveryPhone':
            return <EnableRecoveryPhone {...allProps} recoveryItem={recoveryItem} />;
        case 'deviceRecovery':
            return <EnableDeviceRecovery {...allProps} recoveryItem={recoveryItem} />;
        case 'recoveryFile':
            return <DownloadRecoveryFile {...allProps} recoveryItem={recoveryItem} />;
        case 'recoveryContacts':
            return <AddRecoveryContacts {...allProps} recoveryItem={recoveryItem} />;
        case 'recoveryPhrase':
            return <DownloadRecoveryPhrase {...allProps} recoveryItem={recoveryItem} />;
        case 'signedInReset':
            return <EnableSignedInReset {...allProps} recoveryItem={recoveryItem} />;
        case 'qrCodeSignIn':
            return <EnableQrCodeSignIn {...allProps} recoveryItem={recoveryItem} />;
        case 'addEmergencyContacts':
            return <AddEmergencyContacts {...allProps} recoveryItem={recoveryItem} />;
        case 'upsellEmergencyContacts':
            return <UpsellEmergencyContacts {...allProps} recoveryItem={recoveryItem} />;
    }

    throw new Error('Unknown type');
};
