import React from 'react';
import { c } from 'ttag';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

import TopBanner from './TopBanner';
import { Href } from '../../components';

const WelcomeV5TopBanner = () => {
    const learnMoreLink = (
        <Href key="learn-more-link" url={getStaticURL('/news/updated-proton')}>{c('Link').t`learn more`}</Href>
    );

    return (
        <TopBanner className="bg-primary">
            {c('new_plans: message displayed when user visit v5 login')
                .jt`Introducing Proton's refreshed look. Many services, one mission. Sign in to continue or ${learnMoreLink}.`}
        </TopBanner>
    );
};

export default WelcomeV5TopBanner;
