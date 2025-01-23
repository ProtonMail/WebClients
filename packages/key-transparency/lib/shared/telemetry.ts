import { type AddressAuditWarningDetails, AddressAuditWarningReason } from '../interfaces';

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
    if (reason === AddressAuditWarningReason.AddressWithNoKeys) {
        return 'address_with_no_keys';
    }
    // should not fall here
    return 'unknown';
};
