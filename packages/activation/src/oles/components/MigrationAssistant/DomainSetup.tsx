import type { FC } from 'react';

import { c } from 'ttag';

import { createDomain } from '@proton/account/domains/actions';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Card } from '@proton/atoms/Card/Card';
import { Badge, DomainModal } from '@proton/components';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { useDispatch } from '@proton/redux-shared-store';
import type { Domain } from '@proton/shared/lib/interfaces';
import { getIsDomainActive } from '@proton/shared/lib/organization/helper';
import noop from '@proton/utils/noop';

import type { MigrationSetupModel } from '../../types';

const DomainSetup: FC<{ model: MigrationSetupModel; domain?: Domain }> = ({ model, domain }) => {
    const dispatch = useDispatch();
    const [newDomainModalProps, setNewDomainModalOpen, renderNewDomain] = useModalState();
    const hasVerifiedDomain = domain && getIsDomainActive(domain);

    const onSetupClick = async () => {
        if (!domain) {
            await dispatch(createDomain({ name: model.domainName! })).catch(noop);
        }

        setNewDomainModalOpen(true);
    };

    // Domain
    const cardBody = !hasVerifiedDomain ? (
        <div className="flex flex-nowrap items-center py-6">
            <div className="flex-1">
                <p className="m-0">{c('BOSS').t`Verify your domain`}</p>
                <span className="color-weak text-sm">{c('BOSS').t`Required to create user accounts`}</span>
            </div>
            <ButtonLike onClick={onSetupClick} className="shrink-0 button-outline-weak-text-norm">{c('BOSS')
                .t`Set up`}</ButtonLike>
        </div>
    ) : (
        <div className="flex flex-nowrap items-center py-6">
            <IcCheckmarkCircleFilled className="color-primary mr-2" /> {c('BOSS').t`Domain ownership verified`}
        </div>
    );

    return (
        <section className="mb-12" aria-labelledby="domain-setup">
            <div className="mb-4 flex items-center gap-2">
                <h3 className="mr-2 text-xl text-semibold" id="domain-setup">
                    {model.domainName}
                </h3>
                <Badge type={hasVerifiedDomain ? 'success' : 'warning'}>
                    {hasVerifiedDomain ? c('BOSS').t`Domain connected` : c('BOSS').t`Required`}
                </Badge>
            </div>
            <Card
                padded={false}
                rounded
                background={false}
                className="shadow-norm flex bg-elevated border-weak rounded-xl"
            >
                <div className="px-6 divide-y divide-weak w-full">{cardBody}</div>
            </Card>

            {renderNewDomain && <DomainModal domain={domain} {...newDomainModalProps} />}
        </section>
    );
};

export default DomainSetup;
