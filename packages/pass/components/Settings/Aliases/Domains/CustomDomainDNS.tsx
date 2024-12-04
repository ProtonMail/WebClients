import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert, Icon } from '@proton/components';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { verifyCustomDomain } from '@proton/pass/store/actions';
import clsx from '@proton/utils/clsx';

import { getDNSSections } from './DomainUtils';
import { useAliasDomains, useCustomDomain } from './DomainsProvider';

type Props = { domainID: number };

export const CustomDomainDNS = ({ domainID }: Props) => {
    const { onVerify } = useAliasDomains();
    const domain = useCustomDomain(domainID);
    const verify = useRequest(verifyCustomDomain, { onSuccess: onVerify.bind(null, domainID) });

    return (
        domain && (
            <div className="pb-1">
                <div>{c('Info').t`Please follow the steps below to set up your domain.`}</div>
                <div className="mb-5">{c('Info').t`DNS changes could take up to 24 hours to update.`}</div>
                {getDNSSections(domain).map(({ title, isVerified, errorMessages, content }, index, sections) => {
                    const disabled = index !== 0 && !domain.OwnershipVerified;

                    return (
                        <div key={`domain-dns-section-${title}`}>
                            <div className={clsx(disabled && 'opacity-30')}>
                                <h5 className="text-bold mb-3">
                                    {title} {isVerified ? '✅' : '🚫'}
                                </h5>
                                <div className="mb-3">{content}</div>
                                {errorMessages &&
                                    errorMessages.map((error) => (
                                        <Alert type="error" key={error} className="mb-3 color-danger">
                                            {error}
                                        </Alert>
                                    ))}
                            </div>
                            <Button
                                color="norm"
                                shape="solid"
                                onClick={() => verify.dispatch(domainID)}
                                disabled={disabled}
                                loading={verify.loading}
                                className="mb-5"
                            >
                                {isVerified ? c('Action').t`Re-verify` : c('Action').t`Verify`}
                            </Button>

                            {!domain.OwnershipVerified && index === 0 && (
                                <Card className="my-5 p-1 flex flex-nowrap gap-2 text-sm" type="danger">
                                    <Icon name="info-circle-filled" size={4} className="shrink-0" />
                                    <span> {c('Error').t`A domain ownership must be verified first.`}</span>
                                </Card>
                            )}
                            {index < sections.length - 1 && <hr />}
                        </div>
                    );
                })}
            </div>
        )
    );
};
