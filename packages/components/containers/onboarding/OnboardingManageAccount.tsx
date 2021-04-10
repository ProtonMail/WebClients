import React from 'react';
import { c } from 'ttag';
import onboardingAccessingApps from 'design-system/assets/img/onboarding/onboarding-managing-account.svg';

import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

const OnboardingManageAccount = (props: Omit<OnboardingContentProps, 'decription' | 'img'>) => {
    /* TODO: A11y alt text for image */

    return (
        <OnboardingContent
            description={c('Onboarding Proton')
                .t`Click the top right menu to manage your account, log out, switch between your Proton accounts, and toggle light and dark mode.`}
            img={<img src={onboardingAccessingApps} alt="Proton" />}
            {...props}
        />
    );
};

export default OnboardingManageAccount;
