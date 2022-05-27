import React from 'react';
import { c } from 'ttag';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import TopBanner from './TopBanner';
import { Href } from '../../components';

const WelcomeV5TopBanner = () => {
    return (
        <TopBanner className="bg-primary">
            {c('Text').t`Introducing the updated Proton.`} {c('Text').t`More services, one privacy mission.`}{' '}
            <Href key="learn-more-link" className="color-inherit" url={getStaticURL('/news/updated-proton')}>
                {c('Link').t`Learn more`}
            </Href>
        </TopBanner>
    );
};

export default WelcomeV5TopBanner;
