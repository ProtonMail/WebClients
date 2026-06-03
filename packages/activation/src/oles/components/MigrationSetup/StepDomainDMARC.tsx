import type { FC } from 'react';

import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { DMARC_STATE } from '@proton/shared/lib/interfaces';

import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';
import DomainHelp from './DomainHelp';
import type { StepComponentProps } from './MigrationSetup';

const StepDomainDMARC: FC<StepComponentProps> = ({ model: { domain, domainRegistrarId }, onNext }) => {
    const dispatch = useDispatch();
    const handleCheck = async () => {
        await dispatch(syncDomain(domain!));
    };

    const group: DNSGroup = {
        name: 'DMARC',
        records: [
            {
                dnsType: 'TXT',
                value: 'v=DMARC1; p=quarantine',
                host: '_dmarc',
                state: (() => {
                    if (domain?.DmarcState === DMARC_STATE.DMARC_STATE_DEFAULT) {
                        return 'not-found';
                    }
                    if (
                        domain?.DmarcState === DMARC_STATE.DMARC_STATE_GOOD ||
                        domain?.DmarcState === DMARC_STATE.DMARC_STATE_RELAXED
                    ) {
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
                    <h3 className="text-4xl text-bold">{c('BOSS').t`Set up secure sending (DMARC)`}</h3>
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
                        .t`DMARC builds on SPF and DKIM by telling receiving servers how to handle messages that fail these checks. It helps protect your domain from impersonation and improves overall delivery reliability.`}
                </p>

                <p className="color-weak mt-0">{c('BOSS')
                    .t`Copy the below code and paste it in the DNS section of your domain host.`}</p>

                <DNSGroupRecords group={group} onRefresh={handleCheck} />
            </div>

            <DomainHelp registrarId={domainRegistrarId} />
        </div>
    );
};

export default StepDomainDMARC;
