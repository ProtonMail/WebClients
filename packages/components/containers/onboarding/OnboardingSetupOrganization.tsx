import React from 'react';
import { c } from 'ttag';
import onboardingOrganization from '@proton/styles/assets/img/onboarding/organization.svg';

import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

const OnboardingSetupOrganization = (props: Omit<OnboardingContentProps, 'decription' | 'img'>) => {
    return (
        <OnboardingContent
            title={c('Onboarding Proton').t`Set up your organization`}
            description={c('Onboarding Proton')
                .t`Configure your organization, link your domain name, and create accounts to ensure all members of your organization are protected.`}
            img={<img src={onboardingOrganization} alt={c('Onboarding Proton').t`Set up your organization`} />}
            {...props}
        />
    );
};

export default OnboardingSetupOrganization;
