import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useSettingsLink } from '@proton/components/components';
import useSubscription from '@proton/components/hooks/useSubscription';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { hasFamily } from '@proton/shared/lib/helpers/subscription';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';
import onboardingOrganization from '@proton/styles/assets/img/onboarding/organization.svg';
import clsx from '@proton/utils/clsx';

import OnboardingContent, { Props as OnboardingContentProps } from './OnboardingContent';

interface Props extends Omit<OnboardingContentProps, 'decription' | 'img'> {
    handleNext: () => void;
}

const OnboardingSetupOrganization = (props: Props) => {
    const [subscription] = useSubscription();
    const hasFamilyPlan = hasFamily(subscription);
    const goToSettings = useSettingsLink();

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
        <OnboardingContent title={title} description={description} {...props}>
            <div className={clsx('text-center', isMobile() ? 'pt-4' : 'pt-12')}>
                <img
                    src={img}
                    alt={imgAlt}
                    className="w-full mb-2 max-w-custon"
                    style={{
                        '--max-w-custon': isMobile() ? '15em' : '20em',
                    }}
                />
                <Button
                    size="large"
                    color="norm"
                    onClick={() => {
                        goToSettings('/multi-user-support', undefined, true);
                        props.handleNext();
                    }}
                >
                    {c('Action').t`Start setup`}
                </Button>
            </div>
        </OnboardingContent>
    );
};

export default OnboardingSetupOrganization;
