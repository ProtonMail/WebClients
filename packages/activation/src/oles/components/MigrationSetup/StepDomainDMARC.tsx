import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { DMARC_STATE, type Domain } from '@proton/shared/lib/interfaces';

import DNSGroupRecords, { type DNSGroup } from './DNSGroupRecords';
import type { StepComponentProps } from './MigrationSetup';

interface Props extends StepComponentProps {
    domain?: Domain;
    registrar?: { name: string; url: string };
}

const StepDomainDMARC = ({ domain, registrar, submitButton }: Props) => {
    const dispatch = useDispatch();
    const [loading, withLoading] = useLoading();
    const handleCheck = () => dispatch(syncDomain(domain!));

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
        <div className="max-w-custom" style={{ '--max-w-custom': '42rem' }}>
            <h3 className="text-4xl text-bold mb-2">{c('BOSS').t`DMARC records`}</h3>

            <p className="color-weak mt-0">
                {c('BOSS')
                    .t`DMARC builds on SPF and DKIM by telling receiving servers how to handle messages that fail these checks. It helps protect your domain from impersonation and improves overall delivery reliability.`}{' '}
                <Href href={getKnowledgeBaseUrl('/custom-domain')} className="ml-0.5 inline-block">{c('Link')
                    .t`Learn more`}</Href>
            </p>

            {domain?.DmarcState === DMARC_STATE.DMARC_STATE_MULT && (
                <Banner variant={BannerVariants.DANGER_OUTLINE}>
                    {c('Description for domain modal')
                        .t`Duplicate DMARC record found, go to the DNS console of your domain provider to fix it.`}
                </Banner>
            )}

            <p className="color-weak mt-0">{c('BOSS')
                .t`Please add the following records in your DNS console of your domain provider:`}</p>

            <DNSGroupRecords group={group} />

            <p className="mt-0 color-weak">{c('BOSS')
                .t`The “p=” value specifies the action to take for emails that fail DMARC. Here are the available actions:`}</p>

            <ul className="color-weak mt-0">
                <li>
                    {getBoldFormattedText(
                        c('BOSS')
                            .t`**p=quarantine**: asking the recipient platforms to mark the unauthorized emails as spam or quarantine them.`
                    )}
                </li>
                <li>
                    {getBoldFormattedText(
                        c('BOSS').t`**p=reject**: asking the recipient platforms to reject the unauthorized emails.`
                    )}
                </li>
                <li>
                    {getBoldFormattedText(
                        c('BOSS')
                            .t`**p=none**: do not quarantine or reject unauthorized emails. Usually, people only use this policy to troubleshoot or test.`
                    )}
                </li>
            </ul>

            <p className="mt-0 color-weak">{c('BOSS')
                .t`The default setting is none. However, to improve your security we recommend setting this value to p=quarantine.`}</p>

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

export default StepDomainDMARC;
