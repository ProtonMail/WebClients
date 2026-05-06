import { c } from 'ttag';

import type { RecoveryItem, RecoveryItemIds } from '@proton/account/safetyReview/recoveryState/recoveryState';

export const getEmailCopy = (item: Extract<RecoveryItem, { id: 'recoveryEmail' }>) => {
    if (!item.data.hasValue) {
        return c('Recovery score item').t`Add recovery email`;
    }
    if (!item.data.isVerified) {
        return c('Recovery score item').t`Verify recovery email`;
    }
    if (!item.data.hasReset) {
        return c('Recovery score item').t`Enable email recovery`;
    }
    return c('Recovery score item').t`Email recovery enabled`;
};

export const getPhoneCopy = (item: Extract<RecoveryItem, { id: 'recoveryPhone' }>) => {
    if (!item.data.hasValue) {
        return c('Recovery score item').t`Add recovery phone`;
    }
    if (!item.data.isVerified) {
        return c('Recovery score item').t`Verify recovery phone`;
    }
    if (!item.data.hasReset) {
        return c('Recovery score item').t`Enable recovery by phone`;
    }
    return c('Recovery score item').t`Phone recovery enabled`;
};

export const getRecoveryScoreItemCopy = (item: RecoveryItem) => {
    if (item.id === 'recoveryEmail') {
        return getEmailCopy(item);
    }

    if (item.id === 'recoveryPhone') {
        return getPhoneCopy(item);
    }

    const copyByItemId: Record<
        Exclude<RecoveryItemIds, 'recoveryEmail' | 'recoveryPhone'>,
        { positive: string; negative: string }
    > = {
        deviceRecovery: {
            positive: c('Recovery score item').t`Data recovery allowed on this device`,
            negative: c('Recovery score item').t`Allow data recovery on this device`,
        },
        recoveryFile: {
            positive: c('Recovery score item').t`Recovery file downloaded`,
            negative: c('Recovery score item').t`Download recovery file`,
        },
        recoveryContacts: {
            positive: c('Recovery score item').t`Recovery contacts added`,
            negative: c('Recovery score item').t`Add recovery contacts`,
        },
        recoveryPhrase: {
            positive: c('Recovery score item').t`Recovery phrase saved`,
            negative: c('Recovery score item').t`Save recovery phrase`,
        },
        signedInReset: {
            positive: c('Recovery score item').t`Password reset allowed from settings`,
            negative: c('Recovery score item').t`Allow password reset from settings`,
        },
        qrCodeSignIn: {
            positive: c('Recovery score item').t`Sign-in with QR code allowed`,
            negative: c('Recovery score item').t`Allow scanning QR code to sign in`,
        },
        emergencyContacts: {
            positive: c('Recovery score item').t`Emergency contacts added`,
            negative: c('Recovery score item').t`Add emergency contacts`,
        },
        passwordVerification: {
            positive: c('Recovery score item').t`Password verified`,
            negative: c('Recovery score item').t`Verify password`,
        },
    };

    const itemCopy = copyByItemId[item.id];

    return item.isEnabled ? itemCopy.positive : itemCopy.negative;
};
