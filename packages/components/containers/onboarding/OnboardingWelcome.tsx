import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import welcomeImage from '@proton/styles/assets/img/onboarding/proton-welcome.svg';

import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

const OnboardingWelcome = (props: Omit<OnboardingContentProps, 'decription' | 'img'>) => {
    return (
        <OnboardingContent
            title={c('Onboarding Proton').t`Welcome to ${BRAND_NAME}`}
            description={c('Onboarding Proton')
                .t`Our mission is to build an internet where you are in control of your data and your privacy. We have recently updated ${BRAND_NAME} - welcome to the secure internet.`}
            img={<img src={welcomeImage} alt={c('Onboarding Proton').t`Welcome to ${BRAND_NAME}`} />}
            {...props}
        />
    );
};

export default OnboardingWelcome;
