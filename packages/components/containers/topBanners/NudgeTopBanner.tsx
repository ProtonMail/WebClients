import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '../../components';
import { useFeature } from '../../hooks';
import { FeatureCode } from '../features';
import TopBanner from './TopBanner';

export const getIsProtonMailDomain = () => {
    return window.location.host.endsWith('.protonmail.com');
};

const NudgeTopBanner = () => {
    const [show] = useState(getIsProtonMailDomain);
    const { feature } = useFeature(FeatureCode.NudgeProton);

    if (!feature?.Value || !show) {
        return null;
    }

    const link = (
        <Href key="link" className="color-inherit" href="https://proton.me">
            proton.me
        </Href>
    );
    return (
        <TopBanner className="bg-primary">
            {
                // translator: followed by a link "proton.me"
                c('Info').jt`We're moving! Join us at our new site: ${link}.`
            }
        </TopBanner>
    );
};

export default NudgeTopBanner;
