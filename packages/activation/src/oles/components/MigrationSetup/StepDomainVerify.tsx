import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { type Domain, VERIFY_STATE } from '@proton/shared/lib/interfaces';

import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';
import type { StepComponentProps } from './MigrationSetup';

interface Props extends StepComponentProps {
    domain?: Domain;
    registrar?: { name: string; url: string };
}

const StepDomainVerify = ({ domain, registrar, submitButton }: Props) => {
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const handleCheck = () => dispatch(syncDomain(domain!));

    const hereHref = <Href href={getKnowledgeBaseUrl('/custom-domain')} key="linkInfo">{c('Link').t`here`}</Href>;

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
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <h3 className="text-4xl text-bold mb-2">{c('BOSS').t`Verify your domain`}</h3>

            <p className="color-weak my-4">{c('BOSS')
                .jt`Copy the below code and paste it in the DNS section of your domain host. You can find an example and some helpful tips ${hereHref}.`}</p>

            <DNSGroupRecords group={group} />

            <div className="flex items-center justify-space-between">
                {registrar?.url && (
                    <Href href={registrar.url} className="ml-0.5 inline-flex text-no-decoration items-center gap-1">
                        {c('Action').t`Go to domain provider`}
                        <IcArrowOutSquare className="ml-1 shrink-0" />
                    </Href>
                )}
                <div className="ml-auto flex flex-row items-center gap-2">
                    <Button
                        className="shrink-0"
                        color="weak"
                        loading={loading}
                        onClick={() => withLoading(handleCheck())}
                    >
                        {c('BOSS').t`Refresh`}
                    </Button>
                    {submitButton}
                </div>
            </div>
        </div>
    );
};

export default StepDomainVerify;
