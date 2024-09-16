import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Toggle } from '@proton/components/components';
import type { SampleBreach } from '@proton/components/containers';
import { getUpsellText } from '@proton/components/containers/credentialLeak/helpers';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import ProtonSentinelPlusLogo from '@proton/styles/assets/img/illustrations/sentinel-shield-bolt-breach-alert.svg';

import { DrawerAppSection } from '../../shared';

interface Props {
    onToggleBreaches: () => void;
    hasBreach: boolean;
    sample: SampleBreach | null;
    count: number | null;
}

// translator: full sentence is: Get notified if your password or other data was leaked from a third-party service. <Learn more>
const learnMoreLink = (
    <Href href={getKnowledgeBaseUrl('/dark-web-monitoring')} className="inline-block">{c('Link').t`Learn more`}</Href>
);

const learnMoreLinkBreach = (
    <Href href={getKnowledgeBaseUrl('/dark-web-monitoring')} className="inline-block color-danger">{c('Link')
        .t`Learn more`}</Href>
);

const FreeUserBreachToggle = ({ onToggleBreaches, hasBreach, sample, count }: Props) => {
    return (
        <DrawerAppSection>
            <div className="flex flex-nowrap items-center gap-2 mt-2">
                <div className="shrink-0 flex">
                    <img src={ProtonSentinelPlusLogo} alt="" width={22} />
                </div>
                <h3 className="flex-1 text-rg">
                    <label htmlFor="breaches-toggle">{DARK_WEB_MONITORING_NAME}</label>
                </h3>
                <Toggle id="breaches-toggle" onChange={onToggleBreaches} className="shrink-0" />
            </div>
            {hasBreach ? (
                <p className="mt-1 mb-2 text-sm color-danger">{getUpsellText(sample, count, learnMoreLinkBreach)}</p>
            ) : (
                <p className="mt-1 mb-2 text-sm color-weak">
                    {
                        // translator: full sentence is: Get notified if your password or other data was leaked from a third-party service. <Learn more>
                        c('Security Center - Info')
                            .jt`Get notified if your password or other data was leaked from a third-party service. ${learnMoreLink}`
                    }
                </p>
            )}
        </DrawerAppSection>
    );
};

export default FreeUserBreachToggle;
