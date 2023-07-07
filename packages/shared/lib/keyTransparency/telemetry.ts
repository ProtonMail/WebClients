import { AddressAuditWarningDetails, AddressAuditWarningReason } from '@proton/key-transparency/lib';

export const getWarningReason = (warningDetails?: AddressAuditWarningDetails) => {
    if (!warningDetails) {
        return 'undefined';
    }
    const { reason, sklVerificationFailed, addressWasDisabled } = warningDetails;
    if (reason === AddressAuditWarningReason.UnverifiableHistory) {
        if (addressWasDisabled) {
            return 'disabled_address';
        }

        if (sklVerificationFailed) {
            return 'skl_verification_failed';
        }

        return 'unverifiable_history';
    }
    // should not fall here
    return 'unknown';
};
