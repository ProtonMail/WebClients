import { useState } from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { verifyCustomDomain } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { DNSSectionID, getDNSSections } from './DomainUtils';
import { useAliasDomains, useCustomDomain } from './DomainsProvider';

type Props = { domainID: number };

export const CustomDomainDNS = ({ domainID }: Props) => {
    const { onVerify } = useAliasDomains();
    const domain = useCustomDomain(domainID);
    const verify = useRequest(verifyCustomDomain, { onSuccess: onVerify.bind(null, domainID) });
    /** Section where we should display BE errors.
     * BE will return errors for all sections,
     * but we only want to display errors and loading state for the section where user clicked "Verify" */
    const [activeSection, setActiveSection] = useState<MaybeNull<DNSSectionID>>(null);

    const isActiveSection = (id: string) => activeSection === id;

    const handleVerifyClick = (id: DNSSectionID) => {
        setActiveSection(id);
        verify.dispatch({
            domainID,
            // Don't show notification if domain ownership and MX record are already verified
            silent: domain?.OwnershipVerified && domain?.MxVerified,
        });
    };

    return (
        domain && (
            <div className="pb-1">
                {ENV === 'development' && (
                    <Banner variant="info" className="mb-4">
                        {/* No need to translate development text */}
                        You are on staging env. Don't forget to replace 'proton.me' below with 'proton.black'
                    </Banner>
                )}
                <div>{c('Info').t`Please follow the steps below to set up your domain.`}</div>
                <div className="mb-5">{c('Info').t`DNS changes could take up to 24 hours to update.`}</div>
                {getDNSSections(domain).map(({ id, title, isVerified, errorMessages, content }, index, sections) => {
                    const disabled = index !== 0 && !domain.OwnershipVerified;

                    return (
                        <div key={`domain-dns-section-${title}`}>
                            <div className={clsx(disabled && 'opacity-30')}>
                                <h5 className="text-bold mb-3">
                                    {title} {isVerified ? '✅' : '🚫'}
                                </h5>
                                <div className="mb-3">{content}</div>
                                {isActiveSection(id) && !isVerified && !verify.loading && (
                                    <Banner variant="danger" className="mb-3">
                                        {id === DNSSectionID.MX
                                            ? c('Error').t`Your DNS is not correctly set. The MX record we obtain is:`
                                            : c('Error').t`Your DNS is not correctly set. The TXT record we obtain is:`}
                                        {errorMessages?.map((error) => <div>{error}</div>) ?? (
                                            <div>{c('Info').t`(Empty)`}</div>
                                        )}
                                    </Banner>
                                )}
                            </div>
                            <Button
                                color="norm"
                                shape="solid"
                                onClick={() => handleVerifyClick(id)}
                                disabled={disabled || (verify.loading && !isActiveSection(id))}
                                loading={verify.loading && isActiveSection(id)}
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
