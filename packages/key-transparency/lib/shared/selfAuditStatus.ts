import {
    type AddressAuditResult,
    AddressAuditStatus,
    AddressAuditWarningReason,
    type SelfAuditResult,
} from '../interfaces';

export type SelfAuditStatus = 'failure' | 'warning';

/**
 * Unverifiable history is expected after a key deletion or a password reset, so the user isn't
 * warned about it, unless the address was disabled in the meantime.
 */
export const getIsHiddenAddressAuditWarning = ({ status, warningDetails }: AddressAuditResult) => {
    return (
        status === AddressAuditStatus.Warning &&
        warningDetails?.reason === AddressAuditWarningReason.UnverifiableHistory &&
        !warningDetails.addressWasDisabled
    );
};

const getHasSelfAuditFailure = (selfAuditResult: SelfAuditResult) => {
    return (
        selfAuditResult.addressAuditResults.some(({ status }) => status === AddressAuditStatus.Failure) ||
        selfAuditResult.localStorageAuditResultsOwnAddress.some(({ success }) => !success) ||
        selfAuditResult.localStorageAuditResultsOtherAddress.some(({ success }) => !success)
    );
};

const getHasSelfAuditWarning = (selfAuditResult: SelfAuditResult) => {
    return (
        !!selfAuditResult.error?.tooManyRetries ||
        selfAuditResult.addressAuditResults.some(
            (result) => result.status === AddressAuditStatus.Warning && !getIsHiddenAddressAuditWarning(result)
        )
    );
};

/**
 * What a self-audit result shows the user: a failure, a warning, or nothing.
 */
export const getSelfAuditStatus = (selfAuditResult: SelfAuditResult): SelfAuditStatus | undefined => {
    if (getHasSelfAuditFailure(selfAuditResult)) {
        return 'failure';
    }
    if (getHasSelfAuditWarning(selfAuditResult)) {
        return 'warning';
    }
};
