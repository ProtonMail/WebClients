import { c } from 'ttag';

import {
    AddressAuditStatus,
    AddressAuditWarningDetails,
    AddressAuditWarningReason,
    LocalStorageAuditResult,
    SelfAuditResult,
} from '@proton/key-transparency/lib/interfaces';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';

const addressAuditFailedMessage = (appName: string) => {
    return c('loc_nightly: Key transparency failure details')
        .t`${appName} failed to verify that the keys of this address are consistent with Key Transparency.`;
};

const addressAuditWarningMessage = (appName: string, details: AddressAuditWarningDetails) => {
    switch (details.reason) {
        case AddressAuditWarningReason.NullSKL:
            return c('loc_nightly: Key transparency failure details')
                .t`${appName} is not able to verify the keys of this address with Key Transparency. This can happen if you have signed up with an old ${BRAND_NAME} client.`;
        case AddressAuditWarningReason.UnverifiableHistory:
            if (details.addressWasDisabled) {
                return c('loc_nightly: Key transparency failure details')
                    .t`${appName} detected that this address has been disabled in the past. During that period, data shared to this address might not have been encrypted correctly.`;
            } else {
                return c('loc_nightly: Key transparency failure details')
                    .t`${appName} could not verify some changes made to the keys of this address in the past. This can happen if you deleted a key, marked a key as compromised or did a password reset.`;
            }
    }
};

const localStorageAuditFailedMessage = (appName: string, isOwnAddress: boolean) => {
    if (isOwnAddress) {
        return c('loc_nightly: Key transparency failure details')
            .t`${appName} detected that changes you made recently to the keys of this address have not been properly applied.`;
    } else {
        return c('loc_nightly: Key transparency failure details')
            .t`${appName} detected that the keys used in the past for this address may not be authentic.`;
    }
};

const uniqueByEmail = (failedAudits: LocalStorageAuditResult[]): LocalStorageAuditResult[] => {
    const seen = new Set<string>();
    return failedAudits.filter(({ email }) => {
        const canonicalEmail = canonicalizeInternalEmail(email);
        if (seen.has(canonicalEmail)) {
            return false;
        }
        seen.add(canonicalEmail);
        return true;
    });
};

export interface SelfAuditAlertProps {
    warning: boolean;
    email: string;
    message: string;
}

export const getSelfAuditAlerts = (
    selfAuditResult: SelfAuditResult,
    isAuditingOwnKeys: boolean,
    appName: string
): SelfAuditAlertProps[] => {
    const lsAudits = isAuditingOwnKeys
        ? selfAuditResult.localStorageAuditResultsOwnAddress
        : selfAuditResult.localStorageAuditResultsOtherAddress;
    const failedLSAudits = lsAudits.filter((audit) => !audit.success);
    const failedLSAuditsDeduplicated = uniqueByEmail(failedLSAudits);
    const failedLSAuditMessage = localStorageAuditFailedMessage(appName, isAuditingOwnKeys);
    const failedLSAuditsAlerts = failedLSAuditsDeduplicated.map(({ email }) => {
        return { email, message: failedLSAuditMessage, warning: false };
    });
    if (!isAuditingOwnKeys) {
        return failedLSAuditsAlerts;
    }
    const failedAddressAudits = selfAuditResult.addressAuditResults.filter(
        ({ status }) => status === AddressAuditStatus.Failure
    );
    const warningAddressAudits = selfAuditResult.addressAuditResults.filter(
        ({ status }) => status === AddressAuditStatus.Warning
    );
    const failedAddressAuditMessage = addressAuditFailedMessage(appName);

    const failedAddressAuditAlerts = failedAddressAudits.map(({ email }) => {
        return { email, message: failedAddressAuditMessage, warning: false };
    });
    const warningAddressAuditAlerts = warningAddressAudits.map(({ email, warningDetails }) => {
        return { email, message: addressAuditWarningMessage(appName, warningDetails!), warning: true };
    });

    return [...failedAddressAuditAlerts, ...warningAddressAuditAlerts, ...failedLSAuditsAlerts];
};
