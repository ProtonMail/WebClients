import type { ReactNode } from 'react';

import { EnableRecoveryEmail } from '@proton/account/safetyReview/components/actions/accountRecovery/email/EnableRecoveryEmail';
import { SetRecoveryEmail } from '@proton/account/safetyReview/components/actions/accountRecovery/email/SetRecoveryEmail';
import { VerifyRecoveryEmail } from '@proton/account/safetyReview/components/actions/accountRecovery/email/VerifyRecoveryEmail';
import { EnableRecoveryPhone } from '@proton/account/safetyReview/components/actions/accountRecovery/phone/EnableRecoveryPhone';
import { SetRecoveryPhone } from '@proton/account/safetyReview/components/actions/accountRecovery/phone/SetRecoveryPhone';
import { VerifyRecoveryPhone } from '@proton/account/safetyReview/components/actions/accountRecovery/phone/VerifyRecoveryPhone';
import { Congratulations } from '@proton/account/safetyReview/components/actions/congratulations/Congratulations';
import { AddEmergencyContacts } from '@proton/account/safetyReview/components/actions/delegatedAccess/AddEmergencyContacts';
import { AddRecoveryContacts } from '@proton/account/safetyReview/components/actions/delegatedAccess/AddRecoveryContacts';
import { UpsellEmergencyContacts } from '@proton/account/safetyReview/components/actions/delegatedAccess/UpsellEmergencyContacts';
import { EnableDeviceRecovery } from '@proton/account/safetyReview/components/actions/deviceRecovery/EnableDeviceRecovery';
import { DownloadRecoveryFile } from '@proton/account/safetyReview/components/actions/recoveryFile/DownloadRecoveryFile';
import { DownloadRecoveryPhrase } from '@proton/account/safetyReview/components/actions/recoveryPhrase/DownloadRecoveryPhrase';
import { EnableQrCodeSignIn } from '@proton/account/safetyReview/components/actions/settings/EnableQrCodeSignIn';
import { EnableSignedInReset } from '@proton/account/safetyReview/components/actions/settings/EnableSignedInReset';
import type { SafetyReviewCardsItemProps } from '@proton/account/safetyReview/components/cards/interface';
import type { SafetyReviewContainerProps } from '@proton/account/safetyReview/components/interface';
import type { RecoveryActionItem } from '@proton/account/safetyReview/recoveryState/recoveryState';

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
            return null;
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
