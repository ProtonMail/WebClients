import { formatDistanceToNow } from 'date-fns';
import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { AppLink, useConfig, useKeyTransparencyContext } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type {
    AddressAuditWarningDetails,
    LocalStorageAuditResult,
    SelfAuditResult,
} from '@proton/key-transparency/lib';
import { AddressAuditStatus, AddressAuditWarningReason } from '@proton/key-transparency/lib';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { dateLocale } from '@proton/shared/lib/i18n';

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

const SelfAuditResults = ({ selfAuditResult }: { selfAuditResult: SelfAuditResult }) => {
    const { APP_NAME } = useConfig();
    const appName = getAppName(APP_NAME);

    if (selfAuditResult?.error) {
        if (selfAuditResult.error.tooManyRetries) {
            return (
                <div className="flex flex-nowrap">
                    <Icon name="exclamation-circle" className="shrink-0 mr-2 mt-0.5 color-warning" />
                    <span className="flex-1 text-break">{c('loc_nightly: Key transparency details')
                        .t`Key verification was interrupted too many times, there might be a technical issue preventing ${appName} from verifying your keys.`}</span>
                </div>
            );
        } else {
            return (
                <span>{c('loc_nightly: Key transparency details')
                    .t`Key verification was interrupted, it will be restarted automatically.`}</span>
            );
        }
    }

    const addressAuditWarningMessage = (details: AddressAuditWarningDetails) => {
        switch (details.reason) {
            case AddressAuditWarningReason.UnverifiableHistory:
                if (details.addressWasDisabled) {
                    return (
                        <span>{c('loc_nightly: Key transparency details')
                            .t`${appName} detected that this address has been disabled and re-enabled recently. During that period, data shared to that address might not have been encrypted with your keys.`}</span>
                    );
                } else {
                    return (
                        <span>{c('loc_nightly: Key transparency details')
                            .t`${appName} could not verify some changes made to this address' keys in the past. This might be due to a recent key deletion or a password reset.`}</span>
                    );
                }
            case AddressAuditWarningReason.AddressWithNoKeys: {
                return (
                    <span>{c('loc_nightly: Key transparency details')
                        .t`${appName} detected that this address has no encryption keys. Please re-login to generate keys for this address.`}</span>
                );
            }
        }
    };

    const verifyYourKeysLink = (
        <AppLink to="/encryption-keys" toApp={APPS.PROTONACCOUNT} target="_self">{c(
            'loc_nightly: Key transparency details'
        ).t`Verify your keys.`}</AppLink>
    );

    const getMessageWithFingerprint = (primaryKeyFingerprint: string | undefined) => {
        if (!primaryKeyFingerprint) {
            return;
        }
        const fingerprintMessage = c('loc_nightly: Key transparency details')
            .t`To verify the security of your end-to-end encryption with this contact, compare the following fingerprint with the one the recipient sees in their Account (Settings > Encryption & Keys).`;
        return (
            <>
                <div className="flex flex-column gap-1">
                    <p>{fingerprintMessage}</p>
                    <code className="bg-weak p-1 rounded user-select text-sm text-break">{primaryKeyFingerprint}</code>
                </div>
            </>
        );
    };

    const getAddressAuditFailures = () => {
        const failedAddressAuditMessage = c('loc_nightly: Key transparency details')
            .t`${appName} failed to verify that the keys of this address are consistent with Key Transparency.`;
        const failedAddressAudits = selfAuditResult.addressAuditResults.filter(
            ({ status }) => status === AddressAuditStatus.Failure
        );
        return failedAddressAudits.map(({ email }) => {
            return (
                <div>
                    <p>{failedAddressAuditMessage}</p>
                    <ul className="unstyled">
                        <li className="flex flex-nowrap" key={email}>
                            <Icon name="exclamation-circle" className="shrink-0 mr-2 mt-0.5 color-danger" />
                            <strong className="flex-1 text-break">{email}</strong>
                        </li>
                    </ul>
                </div>
            );
        });
    };

    const getAddressAuditWarnings = () => {
        const warningAddressAudits = selfAuditResult.addressAuditResults
            .filter(({ status }) => status === AddressAuditStatus.Warning)
            .filter(
                ({ warningDetails }) =>
                    !(
                        warningDetails?.reason === AddressAuditWarningReason.UnverifiableHistory &&
                        !warningDetails.addressWasDisabled
                    )
            );
        return warningAddressAudits.map(({ email, warningDetails }) => {
            return (
                <div>
                    <p>{addressAuditWarningMessage(warningDetails!)}</p>
                    <ul className="unstyled">
                        <li className="flex flex-nowrap" key={email}>
                            <Icon name="exclamation-circle" className="shrink-0 mr-2 mt-0.5 color-warning" />
                            <strong className="flex-1 text-break">{email}</strong>
                        </li>
                    </ul>
                </div>
            );
        });
    };

    const getLSAuditFailuresOwn = () => {
        const failedLSAudits = selfAuditResult.localStorageAuditResultsOwnAddress.filter((audit) => !audit.success);
        const failedLSAuditsDeduplicated = uniqueByEmail(failedLSAudits);
        const failedLSAuditMessage = (
            <div>
                <span className="mr-1">{c('loc_nightly: Key transparency details')
                    .t`${appName} detected that changes you made recently to the keys of this address have not been properly applied.`}</span>
                {verifyYourKeysLink}
            </div>
        );
        return failedLSAuditsDeduplicated.map(({ email }) => {
            return (
                <div>
                    <p>{failedLSAuditMessage}</p>
                    <ul className="unstyled">
                        <li className="flex flex-nowrap" key={email}>
                            <Icon name="exclamation-circle" className="shrink-0 mr-2 mt-0.5 color-danger" />
                            <strong className="flex-1 text-break">{email}</strong>
                        </li>
                    </ul>
                </div>
            );
        });
    };

    const getLSAuditFailuresOther = () => {
        const failedLSAuditsOther = selfAuditResult.localStorageAuditResultsOtherAddress.filter(
            (audit) => !audit.success
        );
        const failedLSAuditsOtherDeduplicated = uniqueByEmail(failedLSAuditsOther);
        const message = c('loc_nightly: Key transparency details')
            .t`${appName} detected that the keys used in the past for this address may not be authentic.`;
        return failedLSAuditsOtherDeduplicated.map(({ email, primaryKeyFingerprint }) => {
            return (
                <div>
                    <p>{message}</p>
                    <ul className="unstyled">
                        <li className="flex flex-nowrap" key={email}>
                            <Icon name="exclamation-circle" className="shrink-0 mr-2 mt-0.5 color-danger" />
                            <strong className="flex-1 text-break">{email}</strong>
                        </li>
                    </ul>
                    <p>{getMessageWithFingerprint(primaryKeyFingerprint)}</p>
                </div>
            );
        });
    };

    const getAuditSuccess = () => {
        const successEmails = selfAuditResult.addressAuditResults
            .filter(
                ({ status, warningDetails }) =>
                    status === AddressAuditStatus.Success ||
                    (status === AddressAuditStatus.Warning &&
                        warningDetails?.reason === AddressAuditWarningReason.UnverifiableHistory &&
                        !warningDetails.addressWasDisabled)
            )
            .map(({ email }) => email);
        if (!successEmails.length) {
            return <></>;
        }
        return (
            <div>
                <p>{c('loc_nightly').t`The following addresses were successfully audited with Key Transparency:`}</p>
                <ul className="unstyled">
                    {successEmails.map((email) => (
                        <li className="flex flex-nowrap" key={email}>
                            <Icon name="checkmark" className="shrink-0 mr-2 mt-0.5 color-success" />
                            <strong className="flex-1 text-break">{email}</strong>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const alerts = [
        ...getAddressAuditFailures(),
        ...getLSAuditFailuresOwn(),
        ...getLSAuditFailuresOther(),
        ...getAddressAuditWarnings(),
        getAuditSuccess(),
    ];

    return (
        <>
            {alerts.map((alert, index) => (
                <>
                    {alert}
                    {index !== alerts.length - 1 && <hr />}
                </>
            ))}
        </>
    );
};

const NoResultFallback = () => {
    return <span>{c('loc_nightly: Key transparency details').t`Key verification is pending`}</span>;
};

const KeyTransparencyDetailsModal = (props: ModalProps) => {
    const {
        ktState: { selfAuditResult },
    } = useKeyTransparencyContext();

    const { onClose } = props;

    const auditTime = selfAuditResult
        ? formatDistanceToNow(new Date(selfAuditResult.auditTime), {
              locale: dateLocale,
              addSuffix: true,
          })
        : undefined;

    const introductionText = c('loc_nightly: Key transparency details')
        .t`${BRAND_NAME} automatically verifies your and your contacts’ encryption keys to ensure their authenticity. This ensures that only the owner of the email address can read messages sent to it.`;

    return (
        <ModalTwo size="medium" data-testid="key-transparency-details:modal" {...props}>
            <ModalTwoHeader title={c('loc_nightly: Key transparency details').t`Key verification (Beta)`} />
            <ModalTwoContent>
                {auditTime && (
                    <div className="bg-weak p-3 rounded color-weak">{
                        // translator: the variable auditTime is a string that indicates how long ago last verification happened. E.g.: less than a minute ago, 14 minutes ago, about 2 hours ago
                        c('loc_nightly: Key transparency details').t`Last verified: ${auditTime}`
                    }</div>
                )}
                <p>
                    <span className="mr-1">{introductionText}</span>
                    <Href href={getKnowledgeBaseUrl('/key-transparency')}>{c('Link').t`Learn more`}</Href>
                </p>
                <hr />
                {!!selfAuditResult && <SelfAuditResults selfAuditResult={selfAuditResult} />}
                {!selfAuditResult && <NoResultFallback />}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="ml-auto" color="norm" onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default KeyTransparencyDetailsModal;
