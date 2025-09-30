import { fromUnixTime, isBefore } from 'date-fns';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import { AudienceType, FeatureValueDefault, type OnboardingInfo } from './onboardingInterface';

export const useCategoriesOnboarding = (): OnboardingInfo => {
    const [user, loadingUser] = useUser();
    const [organization, loadingOrganization] = useOrganization();

    const mailChecklist = useGetStartedChecklist();
    const welcomeFlags = useWelcomeFlags();

    const b2cOnboardingFlag = useFeature(FeatureCode.CategoryViewB2COnboardingViewFlags);
    const b2cAccountDateThreshold = useFeature(FeatureCode.CategoryViewB2CAccountDateThreshold);

    const loading = loadingOrganization || loadingUser || b2cOnboardingFlag.loading || b2cAccountDateThreshold.loading;

    if (loading) {
        return {
            isUserEligible: false,
            audienceType: undefined,
            flagValue: FeatureValueDefault,
        };
    }

    const isUserB2B = getIsB2BAudienceFromPlan(organization?.PlanName);

    // B2B related
    if (isUserB2B) {
        return {
            isUserEligible: false,
            audienceType: AudienceType.B2B,
            flagValue: FeatureValueDefault,
        };
    }

    // B2C logic
    if (!b2cAccountDateThreshold.feature?.Value) {
        return {
            isUserEligible: false,
            audienceType: AudienceType.B2C,
            flagValue: FeatureValueDefault,
        };
    }

    // Existing users, created before the release of the category view see the onboarding
    const isExistingUser = isBefore(fromUnixTime(user.CreateTime), new Date(b2cAccountDateThreshold.feature.Value));
    // We don't want to show the category view onboarding if the checklist is full
    const isChecklistFull = mailChecklist.displayState === CHECKLIST_DISPLAY_TYPE.FULL;
    // Or if the user hasn't completed the welcome flow
    const isUserInWelcomeFlow = welcomeFlags.welcomeFlags.isWelcomeFlow;

    return {
        isUserEligible: isExistingUser && !isChecklistFull && !isUserInWelcomeFlow,
        audienceType: AudienceType.B2C,
        flagValue: b2cOnboardingFlag.feature?.Value ?? 0,
    };
};
