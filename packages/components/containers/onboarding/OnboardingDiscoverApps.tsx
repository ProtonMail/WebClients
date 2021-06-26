import React from 'react';
import { c } from 'ttag';
import onboardingDiscover from '@proton/styles/assets/img/onboarding/discover.svg';

import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

const OnboardingDiscoverApps = (props: Omit<OnboardingContentProps, 'decription' | 'img'>) => {
    return (
        <OnboardingContent
            title={c('Onboarding Proton').t`Discover all Proton services`}
            description={c('Onboarding Proton')
                .t`Use the app selector in the top left to access other Proton services, including VPN, Calendar and Drive.`}
            img={<img src={onboardingDiscover} alt={c('Onboarding Proton').t`Discover all Proton services`} />}
            {...props}
        />
    );
};

export default OnboardingDiscoverApps;
