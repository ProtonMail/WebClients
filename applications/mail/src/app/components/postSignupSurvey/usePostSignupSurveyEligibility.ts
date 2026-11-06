import { useOrganization } from '@proton/account/organization/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/payments/plan/helpers';
import { useFlag } from '@proton/unleash/useFlag';

/**
 * Whether the onboarding ends with the post signup survey instead of closing.
 * Every condition to be part of the rollout lives here, so the onboarding only asks this one question.
 */
export const usePostSignupSurveyEligibility = () => {
    const { welcomeFlags } = useWelcomeFlags();
    const [organization, loadingOrganization] = useOrganization();
    const isEnabled = useFlag('PostSignupSurvey');

    // Replays of the onboarding never show it, only first-time users do
    if (!isEnabled || welcomeFlags.isReplay) {
        return false;
    }

    // The audience is unknown until the organization is loaded, so the survey is not shown yet
    if (loadingOrganization) {
        return false;
    }

    // B2C only: admins and members of a B2B organization never see it
    const isB2B = getIsB2BAudienceFromPlan(organization?.PlanName);
    return !isB2B;
};
