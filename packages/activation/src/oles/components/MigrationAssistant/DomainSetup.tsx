import type { FC } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Card } from '@proton/atoms/Card/Card';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { DomainModal } from '@proton/components/index';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import type { Domain } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';

const DomainSetup: FC<{ domain?: Domain }> = ({ domain }) => {
    const [newDomainModalProps, setNewDomainModalOpen, renderNewDomain] = useModalState();

    const cardBody =
        !domain || !getIsDomainActive(domain) ? (
            <div className="flex justify-space-between items-center">
                <div>
                    <p className="m-0">{!domain ? c('BOSS').t`Add a domain` : c('BOSS').t`Verify your domain`}</p>
                    <span className="text-weak text-sm">{c('BOSS').t`Required to create user accounts`}</span>
                </div>
                <ButtonLike onClick={() => setNewDomainModalOpen(true)} size="small">{c('BOSS').t`Set up`}</ButtonLike>
            </div>
        ) : (
            <>
                <IcCheckmark /> {c('BOSS').t`Domain ownership verified`}
            </>
        );

    return (
        <section className="mb-8">
            <header className="mb-2">
                <div className="text-bold">{domain ? domain.DomainName : c('BOSS').t`Domain setup`}</div>
            </header>
            <div className="rounded shadow-md">
                <Card rounded background={false}>
                    {cardBody}
                </Card>
            </div>

            {renderNewDomain && <DomainModal domain={domain} {...newDomainModalProps} />}
        </section>
    );
};

export default DomainSetup;
