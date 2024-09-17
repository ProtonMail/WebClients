import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { OnboardingStep, type OnboardingStepRenderCallback, useSettingsLink } from '@proton/components';
import { useOrganization } from '@proton/components/hooks/useOrganization';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import onboardingFamilyPlan from '@proton/styles/assets/img/onboarding/familyPlan.svg';

import NewOnboardingContent from '../layout/NewOnboardingContent';

const NewOnboardingOrganizationStep = (props: OnboardingStepRenderCallback) => {
    const [organization] = useOrganization();
    const hasFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';
    const goToSettings = useSettingsLink();

    const title = hasFamilyOrg
        ? c('familyOffer_2023:Onboarding Proton').t`Set up your family account`
        : c('Onboarding Proton').t`Set up your organization`;

    const description = hasFamilyOrg
        ? c('familyOffer_2023:Onboarding Proton').t`Invite members and get everything up and running.`
        : c('Onboarding Proton').t`Link your domain name and create accounts for all members of your organization.`;

    return (
        <OnboardingStep>
            <NewOnboardingContent title={title} description={description} className="mb-12 text-center">
                <div className="py-12">
                    <div>
                        <img
                            alt=""
                            className="w-full max-w-custom"
                            src={onboardingFamilyPlan}
                            style={{ '--max-w-custom': '15em' }}
                        />
                    </div>
                    <Button
                        color="norm"
                        onClick={() => {
                            goToSettings('/multi-user-support', undefined, true);
                            props.onNext();
                        }}
                    >
                        {c('Action').t`Start setup`}
                    </Button>
                </div>
            </NewOnboardingContent>
            <footer>
                <footer>
                    <Button size="large" fullWidth onClick={props.onNext}>
                        {c('Action').t`Skip`}
                    </Button>
                </footer>
            </footer>
        </OnboardingStep>
    );
};

export default NewOnboardingOrganizationStep;
