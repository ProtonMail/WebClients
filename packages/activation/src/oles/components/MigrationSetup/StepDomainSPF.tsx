import type { FC } from 'react';

import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { SPF_STATE } from '@proton/shared/lib/interfaces';

import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';
import DomainHelp from './DomainHelp';
import type { StepComponentProps } from './MigrationSetup';

const PROTON_AND_GOOGLE_SPF_POLICY = 'v=spf1 include:_spf.protonmail.ch include:_spf.google.com ~all';

const StepDomainSPF: FC<StepComponentProps> = ({ model: { domain, domainRegistrarId }, onNext }) => {
    const dispatch = useDispatch();
    const handleCheck = async () => {
        await dispatch(syncDomain(domain!));
    };

    const group: DNSGroup = {
        name: 'SPF',
        records: [
            {
                dnsType: 'TXT',
                value: PROTON_AND_GOOGLE_SPF_POLICY,
                state: (() => {
                    if (domain?.SpfState === SPF_STATE.SPF_STATE_DEFAULT) {
                        return 'not-found';
                    }
                    if (domain?.SpfState === SPF_STATE.SPF_STATE_GOOD) {
                        return 'valid';
                    }
                    return 'invalid';
                })(),
            },
        ],
    };

    return (
        <div className="flex flex-nowrap gap-16 items-start">
            <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
                <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                    <h3 className="text-4xl text-bold">{c('BOSS').t`Set up secure sending (SPF)`}</h3>
                    <div className="flex gap-2 shrink-0 text-semibold">
                        <Button
                            onClick={() => onNext?.()}
                            color="weak"
                            size="medium"
                            className="color-primary hover:color-primary rounded-lg"
                        >
                            {c('BOSS').t`Skip`}
                        </Button>
                        <Button
                            disabled={!onNext}
                            onClick={() => onNext?.()}
                            color="norm"
                            size="medium"
                            className="rounded-lg"
                        >
                            {c('Action').t`Next`}
                        </Button>
                    </div>
                </div>
                <p className="color-weak mt-0">
                    {c('BOSS')
                        .t`Ensure that your emails reach the inbox, not the spam folder. Updating SPF will allow users to send from ${BRAND_NAME} and Google simultaneously for the duration of the migration.`}
                </p>

                <p className="color-weak mt-0">{c('BOSS')
                    .t`Copy the below code and paste it in the DNS section of your domain host.`}</p>

                <DNSGroupRecords group={group} onRefresh={handleCheck} />
            </div>

            <DomainHelp registrarId={domainRegistrarId} />
        </div>
    );
};

export default StepDomainSPF;
