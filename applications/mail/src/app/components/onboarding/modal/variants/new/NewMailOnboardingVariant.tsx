import { OnboardingModal } from '@proton/components';
import { useOrganization, useSubscription, useUser } from '@proton/components/hooks';
import {
    getIsB2BAudienceFromPlan,
    getIsB2BAudienceFromSubscription,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';

import ActivatePremiumFeaturesStep from './steps/ActivatePremiumFeaturesStep';
import GetTheAppsStep from './steps/GetTheAppsStep';
import NewOnboardingOrganizationStep from './steps/NewOnboardingOrganizationStep';
import NewOnboardingThemes from './steps/NewOnboardingThemes';
import OnboardingWelcomeStep from './steps/OnboardingWelcomeStep';

interface Props {
    hideDiscoverApps?: boolean;
    showGenericSteps?: boolean;
    onDone?: () => void;
    onExit?: () => void;
    open?: boolean;
}

const useUserInfos = (): Record<'isB2B' | 'isLoading' | 'isMailPaidPlan', boolean> => {
    const [user, loadingUser] = useUser();
    const [subscription, loadingSub] = useSubscription();
    const [organization, loadingOrg] = useOrganization();

    let isB2B = false;
    const isLoading = loadingUser || loadingSub || loadingOrg;
    const isUserWithB2BPlan = !user.isSubUser && getIsB2BAudienceFromSubscription(subscription);
    const isSubUserWithB2BPlan = user.isSubUser && organization && getIsB2BAudienceFromPlan(organization.PlanName);

    if (isUserWithB2BPlan || isSubUserWithB2BPlan) {
        isB2B = true;
    }

    const isMailPaidPlan = user.isPaid && (isTrial(subscription) || user.hasPaidMail);

    return { isB2B, isLoading, isMailPaidPlan };
};

const NewMailOnboardingModalVariant = (props: Props) => {
    const { isLoading, isB2B, isMailPaidPlan } = useUserInfos();
    const displayPremiumFeaturesSteps = isMailPaidPlan && !isB2B;

    if (isLoading) {
        return null;
    }

    return (
        <OnboardingModal
            {...props}
            modalContentClassname="mx-12 mt-12 mb-6"
            modalClassname="onboarding-modal--larger onboarding-modal--new"
            showGenericSteps={false}
            extraProductStep={displayPremiumFeaturesSteps ? [ActivatePremiumFeaturesStep] : undefined}
            stepDotClassName="mt-4"
            genericSteps={{
                setupThemeStep: NewOnboardingThemes,
                organizationStep: NewOnboardingOrganizationStep,
            }}
        >
            {[OnboardingWelcomeStep, GetTheAppsStep]}
        </OnboardingModal>
    );
};

export default NewMailOnboardingModalVariant;
