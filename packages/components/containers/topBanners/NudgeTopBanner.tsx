import { useState } from 'react';

import { c } from 'ttag';

import getIsProtonMailDomain from '@proton/shared/lib/browser/getIsProtonMailDomain';

import { Href } from '../../components';
import { useFeature } from '../../hooks';
import { FeatureCode } from '../features';
import TopBanner from './TopBanner';

const NudgeTopBanner = () => {
    const [show] = useState(getIsProtonMailDomain);
    const { feature } = useFeature(FeatureCode.NudgeProton);

    if (!feature?.Value || !show) {
        return null;
    }

    const link = (
        <Href key="link" className="color-inherit" href="https://account.proton.me">
            account.proton.me
        </Href>
    );
    return (
        <TopBanner className="bg-primary">
            {
                // translator: followed by a link "account.proton.me"
                c('Info').jt`We've moved! Please sign in at our new domain: ${link}.`
            }
        </TopBanner>
    );
};

export default NudgeTopBanner;
