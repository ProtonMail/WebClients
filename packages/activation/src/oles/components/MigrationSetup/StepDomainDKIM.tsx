import type { FC } from 'react';

import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { DKIM_STATE } from '@proton/shared/lib/interfaces';

import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';
import DomainHelp from './DomainHelp';
import type { StepComponentProps } from './MigrationSetup';

const StepDomainDKIM: FC<StepComponentProps> = ({ model: { domain, domainRegistrarId }, onNext }) => {
    const dispatch = useDispatch();
    const handleCheck = async () => {
        await dispatch(syncDomain(domain!));
    };

    const group: DNSGroup = {
        name: 'DKIM',
        records:
            domain?.DKIM.Config.map((dkimConfig) => ({
                host: dkimConfig.Hostname,
                dnsType: 'CNAME',
                group: 'DKIM',
                value: dkimConfig.CNAME,
                state: (() => {
                    if (domain?.DKIM?.State === DKIM_STATE.DKIM_STATE_GOOD) {
                        return 'valid';
                    }

                    if (domain?.DKIM.State === DKIM_STATE.DKIM_STATE_DEFAULT) {
                        return 'not-found';
                    }

                    return 'invalid';
                })(),
            })) ?? [],
    };

    return (
        <div className="flex flex-nowrap gap-16 items-start steps-domain-wrapper">
            <div className="max-w-custom" style={{ '--max-w-custom': 'min(42rem, 100%)' }}>
                <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                    <h3 className="text-4xl text-bold">{c('BOSS').t`Set up secure sending (DKIM)`}</h3>
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
                        .t`DKIM adds a digital signature to each email so recipients can verify that the message really came from your domain and was not altered in transit. Without it, messages may be treated as less trustworthy.`}
                </p>

                <p className="color-weak mt-0">{c('BOSS')
                    .t`Copy the below code and paste it in the DNS section of your domain host.`}</p>

                <DNSGroupRecords group={group} onRefresh={handleCheck} />
            </div>

            <DomainHelp registrarId={domainRegistrarId} />
        </div>
    );
};

export default StepDomainDKIM;
