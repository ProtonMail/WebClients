import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { DKIM_STATE, type Domain } from '@proton/shared/lib/interfaces';

import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';
import type { StepComponentProps } from './MigrationSetup';

interface Props extends StepComponentProps {
    domain?: Domain;
    registrar?: { name: string; url: string };
}

const StepDomainDKIM = ({ domain, registrar, submitButton }: Props) => {
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const handleCheck = () => dispatch(syncDomain(domain!));

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
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <h3 className="text-4xl text-bold mb-2">{c('BOSS').t`DKIM records`}</h3>

            <p className="color-weak mt-0">
                {c('BOSS')
                    .t`DKIM adds a digital signature to each email so recipients can verify that the message really came from your domain and was not altered in transit. Without it, messages may be treated as less trustworthy.`}{' '}
                <Href href={getKnowledgeBaseUrl('/custom-domain')} className="ml-0.5 inline-block">{c('Link')
                    .t`Learn more`}</Href>
            </p>

            <p className="color-weak mt-0">{c('BOSS')
                .t`Please add the following records in your DNS console of your domain provider:`}</p>

            <DNSGroupRecords group={group} />

            <p>
                <Href
                    href={getKnowledgeBaseUrl('/custom-domain')}
                    className="ml-0.5 inline-flex text-no-decoration items-center gap-1"
                >
                    {c('Link').t`Detailed instructions`} <IcChevronRight />
                </Href>
            </p>

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

export default StepDomainDKIM;
