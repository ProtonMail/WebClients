import React, { useState } from 'react';
import { c } from 'ttag';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import TopBanner from './TopBanner';
import { Href } from '../../components';
import { useFeature } from '../../hooks';
import { FeatureCode } from '../features';

interface Props {
    onClose?: () => void;
}

const WelcomeV5TopBanner = ({ onClose }: Props) => {
    return (
        <TopBanner className="bg-primary" onClose={onClose}>
            {c('Text').t`Introducing the updated Proton.`} {c('Text').t`More services, one privacy mission.`}{' '}
            <Href key="learn-more-link" className="color-inherit" url={getStaticURL('/news/updated-proton')}>
                {c('Link').t`Learn more`}
            </Href>
        </TopBanner>
    );
};

export const PrivateWelcomeV5TopBanner = () => {
    const { feature, update } = useFeature(FeatureCode.WelcomeV5TopBanner);
    const [dismissed, setDismissed] = useState(false);

    if (!feature?.Value || dismissed) {
        return null;
    }

    return (
        <WelcomeV5TopBanner
            onClose={() => {
                setDismissed(true);
                void update(false);
            }}
        />
    );
};

export default WelcomeV5TopBanner;
