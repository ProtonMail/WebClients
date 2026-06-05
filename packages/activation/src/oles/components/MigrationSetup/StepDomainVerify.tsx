import type { FC } from 'react';

import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { VERIFY_STATE } from '@proton/shared/lib/interfaces';

import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';
import DomainHelp from './DomainHelp';
import type { StepComponentProps } from './MigrationSetup';

const StepDomainVerify: FC<StepComponentProps> = ({ model: { domain, domainRegistrarId }, onNext }) => {
    const dispatch = useDispatch();

    const handleCheck = async () => {
        await dispatch(syncDomain(domain!));
    };

    const group: DNSGroup = {
        name: 'verification',
        records: [
            {
                dnsType: 'TXT',
                value: domain?.VerifyCode ?? '',
                state: (() => {
                    if (domain?.VerifyState === VERIFY_STATE.VERIFY_STATE_DEFAULT) {
                        return 'not-found';
                    }
                    if (domain?.VerifyState === VERIFY_STATE.VERIFY_STATE_GOOD) {
                        return 'valid';
                    }
                    return 'invalid';
                })(),
            },
        ],
    };

    return (
        <div className="flex flex-nowrap gap-16 items-start steps-domain-wrapper">
            <div className="max-w-custom" style={{ '--max-w-custom': 'min(42rem, 100%)' }}>
                <div className="flex justify-space-between flex-nowrap items-center gap-4 mb-4">
                    <h3 className="text-4xl text-bold">{c('BOSS').t`Verify your domain`}</h3>
                    <div className="flex gap-2 shrink-0 text-semibold">
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
                <p className="color-weak mt-0">{c('BOSS')
                    .t`Copy the below code and paste it in the DNS section of your domain host.`}</p>

                <DNSGroupRecords group={group} onRefresh={handleCheck} />
            </div>

            <DomainHelp registrarId={domainRegistrarId} />
        </div>
    );
};

export default StepDomainVerify;
