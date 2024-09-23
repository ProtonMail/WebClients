import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { useOrganization } from '@proton/components/hooks/useOrganization';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';
import onboardingOrganization from '@proton/styles/assets/img/onboarding/organization.svg';
import clsx from '@proton/utils/clsx';

import OnboardingContent from './OnboardingContent';
import OnboardingStep from './OnboardingStep';
import type { OnboardingStepRenderCallback } from './interface';

interface Props extends OnboardingStepRenderCallback {}

const OnboardingSetupOrganization = (props: Props) => {
    const [organization] = useOrganization();
    const hasFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';
    const goToSettings = useSettingsLink();

    const title = hasFamilyOrg
        ? c('familyOffer_2023:Onboarding Proton').t`Set up your family account`
        : c('Onboarding Proton').t`Set up your organization`;

    const description = hasFamilyOrg
        ? c('familyOffer_2023:Onboarding Proton').t`Configure your family account and invite users `
        : c('Onboarding Proton')
              .t`Configure your organization, link your domain name, and create accounts to ensure all members of your organization are protected.`;

    const imgAlt = hasFamilyOrg
        ? c('familyOffer_2023:Onboarding Proton').t`Set up your family`
        : c('Onboarding Proton').t`Set up your organization`;

    const img = hasFamilyOrg ? onboardingFamilyPlan : onboardingOrganization;

    return (
        <OnboardingStep>
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
                        fullWidth
                        onClick={() => {
                            goToSettings('/multi-user-support', undefined, true);
                            props.onNext();
                        }}
                    >
                        {c('Action').t`Start setup`}
                    </Button>
                </div>
            </OnboardingContent>
            <footer>
                <footer className="flex flex-nowrap">
                    <Button size="large" fullWidth onClick={props.onNext}>
                        {c('Action').t`Skip`}
                    </Button>
                </footer>
            </footer>
        </OnboardingStep>
    );
};

export default OnboardingSetupOrganization;
