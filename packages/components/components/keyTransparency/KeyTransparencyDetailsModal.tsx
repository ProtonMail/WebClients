import { formatDistanceToNow } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Alert,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useConfig,
    useKeyTransparencyContext,
} from '@proton/components';
import {
    AddressAuditStatus,
    AddressAuditWarningDetails,
    AddressAuditWarningReason,
    LocalStorageAuditResult,
    SelfAuditResult,
} from '@proton/key-transparency/lib';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { dateLocale } from '@proton/shared/lib/i18n';

import { AlertType } from '../alert/Alert';

interface SelfAuditAlertProps {
    alertType: AlertType;
    email: string;
    message: string;
}

const SelfAuditAlert = ({ email, alertType, message }: SelfAuditAlertProps) => {
    return (
        <Alert type={alertType}>
            <div className="flex flex-column gap-0.5">
                <span className="text-strong text-break">{email}</span>
                <span>{message}</span>
            </div>
        </Alert>
    );
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

const OwnKeysSection = ({ selfAuditResult }: { selfAuditResult: SelfAuditResult }) => {
    const { APP_NAME } = useConfig();
    const appName = getAppName(APP_NAME);
    const introductionText = c('loc_nightly: Key transparency failure details')
        .t`${appName} periodically verifies that your keys are consistent with the public Key Transparency state.
Inconsistencies might cause other ${BRAND_NAME} users to use the wrong encryption keys when communicating with you.`;

    const addressAuditWarningMessage = (details: AddressAuditWarningDetails) => {
        switch (details.reason) {
            case AddressAuditWarningReason.NullSKL:
                return c('loc_nightly: Key transparency failure details')
                    .t`${appName} is not able to verify the keys of this address with Key Transparency. Please contact our Customer Support to get some help.`;
            case AddressAuditWarningReason.UnverifiableHistory:
                if (details.addressWasDisabled) {
                    return c('loc_nightly: Key transparency failure details')
                        .t`${appName} detected that this address has been disabled in the past. During that period, data shared to this address might not have been encrypted correctly.`;
                } else {
                    return c('loc_nightly: Key transparency failure details')
                        .t`${appName} could not verify some changes made to this address' keys in the past. This might be due to a recent key deletion or a password reset.`;
                }
        }
    };

    const getSelfAuditAlertsOwn = (): SelfAuditAlertProps[] => {
        const failedAddressAuditMessage = c('loc_nightly: Key transparency failure details')
            .t`${appName} failed to verify that the keys of this address are consistent with Key Transparency.`;
        const failedAddressAudits = selfAuditResult.addressAuditResults.filter(
            ({ status }) => status === AddressAuditStatus.Failure
        );
        const failedAddressAuditAlerts = failedAddressAudits.map(({ email }) => {
            return { email, message: failedAddressAuditMessage, alertType: 'error' as AlertType };
        });
        const warningAddressAudits = selfAuditResult.addressAuditResults.filter(
            ({ status }) => status === AddressAuditStatus.Warning
        );
        const warningAddressAuditAlerts = warningAddressAudits.map(({ email, warningDetails }) => {
            return { email, message: addressAuditWarningMessage(warningDetails!), alertType: 'warning' as AlertType };
        });
        const successAddressAuditMessage = c('loc_nightly: Key transparency failure details')
            .t`This address was successfully audited with Key Transparency.`;
        const successAddressAudits = selfAuditResult.addressAuditResults.filter(
            ({ status }) => status === AddressAuditStatus.Success
        );
        const successAddressAuditAlerts = successAddressAudits.map(({ email }) => {
            return { email, message: successAddressAuditMessage, alertType: 'success' as AlertType };
        });

        const failedLSAudits = selfAuditResult.localStorageAuditResultsOwnAddress.filter((audit) => !audit.success);
        const failedLSAuditsDeduplicated = uniqueByEmail(failedLSAudits);
        const failedLSAuditMessage = c('loc_nightly: Key transparency failure details')
            .t`${appName} detected that changes you made recently to the keys of this address have not been properly applied.`;
        const failedLSAuditsAlerts = failedLSAuditsDeduplicated.map(({ email }) => {
            return { email, message: failedLSAuditMessage, alertType: 'error' as AlertType };
        });

        return [
            ...failedAddressAuditAlerts,
            ...failedLSAuditsAlerts,
            ...warningAddressAuditAlerts,
            ...successAddressAuditAlerts,
        ];
    };

    const auditTime = formatDistanceToNow(new Date(selfAuditResult.auditTime), {
        locale: dateLocale,
        addSuffix: true,
    });

    const alertsOwn = getSelfAuditAlertsOwn();
    return (
        <div className="flex flex-column">
            <Alert className="mb-2" type="info">
                <span className="mr-2">{introductionText}</span>
            </Alert>
            <span className="color-weak">{
                // translator: the variable auditTime is a string that indicates how long ago last verification happened. E.g.: less than a minute ago, 14 minutes ago, about 2 hours ago
                c('loc_nightly: Key Transparency failure details').t`Last verification: ${auditTime}`
            }</span>
            {alertsOwn.map((alert) => {
                return (
                    <span key={alert.email} className="mb-2">
                        <SelfAuditAlert {...alert} />
                    </span>
                );
            })}
        </div>
    );
};

const OtherKeysSection = ({ selfAuditResult }: { selfAuditResult: SelfAuditResult }) => {
    const { APP_NAME } = useConfig();
    const appName = getAppName(APP_NAME);
    const introductionText = c('loc_nightly: Key transparency failure details')
        .t`${appName} verifies that the encryption keys of your contacts are consistent with the public Key Transparency state.
Inconsistencies might cause end-to-end encrypted data to be accessible to someone else than the intended recipient.`;
    const getSelfAuditAlertsOther = (): SelfAuditAlertProps[] => {
        const failedLSAudits = selfAuditResult.localStorageAuditResultsOtherAddress.filter((audit) => !audit.success);
        const failedLSAuditsDeduplicated = uniqueByEmail(failedLSAudits);
        const failedLSAuditMessage = c('loc_nightly: Key transparency failure details')
            .t`${appName} detected that the keys used in the past for this address may not be authentic.`;
        const failedLSAuditsAlerts = failedLSAuditsDeduplicated.map(({ email }) => {
            return { email, message: failedLSAuditMessage, alertType: 'error' as AlertType };
        });
        return failedLSAuditsAlerts;
    };

    const alertsOwn = getSelfAuditAlertsOther();
    if (!alertsOwn.length) {
        return <></>;
    }
    return (
        <div className="flex flex-column">
            <Alert className="mb-2" type="info">
                <span className="mr-2">{introductionText}</span>
            </Alert>
            {alertsOwn.map((alert) => {
                return (
                    <span key={alert.email} className="mb-2">
                        <SelfAuditAlert {...alert} />
                    </span>
                );
            })}
        </div>
    );
};

const NoResultFallback = () => {
    return <span>{c('loc_nightly: Key transparency failure details').t`Key verification is pending`}</span>;
};

const KeyTransparencyDetailsModal = (props: ModalProps) => {
    const {
        ktState: { selfAuditResult },
    } = useKeyTransparencyContext();

    const { onClose } = props;

    return (
        <ModalTwo size="large" data-testid="key-transparency-details:modal" {...props}>
            <ModalTwoHeader
                title={c('loc_nightly: Key transparency failure details').t`Key Transparency verification`}
            />
            <ModalTwoContent>
                {selfAuditResult && (
                    <div>
                        <OwnKeysSection selfAuditResult={selfAuditResult} />
                        <OtherKeysSection selfAuditResult={selfAuditResult} />
                    </div>
                )}
                {!selfAuditResult && <NoResultFallback />}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="ml-auto" color="norm" onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default KeyTransparencyDetailsModal;
