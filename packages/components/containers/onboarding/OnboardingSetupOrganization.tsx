import { c } from 'ttag';

import useSubscription from '@proton/components/hooks/useSubscription';
import { hasFamily } from '@proton/shared/lib/helpers/subscription';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';
import onboardingOrganization from '@proton/styles/assets/img/onboarding/organization.svg';

import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

const OnboardingSetupOrganization = (props: Omit<OnboardingContentProps, 'description' | 'img'>) => {
    const [subscription] = useSubscription();
    const hasFamilyPlan = hasFamily(subscription);

    const title = hasFamilyPlan
        ? c('familyOffer_2023:Onboarding Proton').t`Set up your family account`
        : c('Onboarding Proton').t`Set up your organization`;

    const description = hasFamilyPlan
        ? c('familyOffer_2023:Onboarding Proton').t`Configure your family account and invite users `
        : c('Onboarding Proton')
              .t`Configure your organization, link your domain name, and create accounts to ensure all members of your organization are protected.`;

    const imgAlt = hasFamilyPlan
        ? c('familyOffer_2023:Onboarding Proton').t`Set up your family`
        : c('Onboarding Proton').t`Set up your organization`;

    const img = hasFamilyPlan ? onboardingFamilyPlan : onboardingOrganization;

    return (
        <OnboardingContent title={title} description={description} img={<img src={img} alt={imgAlt} />} {...props} />
    );
};

export default OnboardingSetupOrganization;
