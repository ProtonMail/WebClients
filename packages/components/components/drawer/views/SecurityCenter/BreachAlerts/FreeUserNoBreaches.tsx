import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Toggle } from '@proton/components/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import ProtonSentinelPlusLogo from '@proton/styles/assets/img/illustrations/sentinel-shield-bolt-breach-alert.svg';

import { DrawerAppSection } from '../../shared';

interface Props {
    onToggleBreaches: () => void;
}

// translator: full sentence is: Get notified if your password or other data was leaked from a third-party service. <Learn more>
const learnMoreLink = (
    <Href href={getKnowledgeBaseUrl('/TO-ADD')} className="inline-block">{c('Link').t`Learn more`}</Href>
);

const FreeUserNoBreaches = ({ onToggleBreaches }: Props) => {
    return (
        <DrawerAppSection>
            <div className="flex flex-nowrap items-center gap-2 mt-2">
                <div className="shrink-0 flex">
                    <img src={ProtonSentinelPlusLogo} alt="" width={22} />
                </div>
                <h3 className="flex-1 text-rg">
                    <label htmlFor="breaches-toggle">{c('Info').t`Breach Alert`}</label>
                    <span className="ml-2 text-uppercase text-semibold text-sm py-1 px-2 rounded bg-success">New</span>
                </h3>
                <Toggle id="breaches-toggle" onChange={onToggleBreaches} className="shrink-0" />
            </div>
            <p className="mt-1 mb-2 text-sm color-weak">
                {
                    // translator: full sentence is: Get notified if your password or other data was leaked from a third-party service. <Learn more>
                    c('Security Center - Info')
                        .jt`Get notified if your password or other data was leaked from a third-party service. ${learnMoreLink}`
                }
            </p>
        </DrawerAppSection>
    );
};

export default FreeUserNoBreaches;
