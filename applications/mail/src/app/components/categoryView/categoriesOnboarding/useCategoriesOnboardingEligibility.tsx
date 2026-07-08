import { fromUnixTime, isBefore } from 'date-fns';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { getIsB2BAudienceFromPlan } from '@proton/payments/core/plan/helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { useMailboxCounter } from 'proton-mail/hooks/mailboxCounter/useMailboxCounter';

import { useCategoriesView } from '../useCategoriesView';
import { hasSeenAllOnboarding } from './categoriesOnboarding.helpers';
import { FeatureValueDefault, OnboardingFlow, type OnboardingInfo } from './onboardingInterface';

const B2B_REQUIRED_NUMBER_OF_MAILS = 20;
const B2C_REQUIRED_NUMBER_OF_MAILS = 5;

export const useCategoriesOnboardingEligibility = (): OnboardingInfo => {
    const [user, loadingUser] = useUser();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [organization, loadingOrganization] = useOrganization();

    const mailChecklist = useGetStartedChecklist();
    const welcomeFlags = useWelcomeFlags();

    const b2cOnboardingViewFlag = useFeature<number>(FeatureCode.CategoryViewB2COnboardingViewFlags);
    const b2bOnboardingViewFlag = useFeature<number>(FeatureCode.CategoryViewB2BOnboardingViewFlags);
    const accountDateThreshold = useFeature<number>(FeatureCode.CategoryViewOnboardingAccountDateThreshold);

    const { getLocationCount, loading: loadingMailboxCount } = useMailboxCounter();
    const { isCategoryViewEnabled, canUseCategoryView } = useCategoriesView();

    const loading =
        loadingOrganization ||
        loadingUser ||
        loadingMailboxCount ||
        loadingMailSettings ||
        b2cOnboardingViewFlag.loading ||
        b2bOnboardingViewFlag.loading ||
        accountDateThreshold.loading;

    if (loading || !accountDateThreshold.feature?.Value) {
        return {
            isUserEligible: false,
            flagValue: FeatureValueDefault,
            onboardingFlow: OnboardingFlow.NONE,
        };
    }

    const isUserB2B = getIsB2BAudienceFromPlan(organization?.PlanName);
    const isUserInWelcomeFlow = welcomeFlags.welcomeFlags.isWelcomeFlow;

    // Existing users, created before the release of the category view see the onboarding
    const isExistingUser = isBefore(fromUnixTime(user.CreateTime), fromUnixTime(accountDateThreshold.feature.Value));

    const allMailsElementsCount = getLocationCount(MAILBOX_LABEL_IDS.ALL_MAIL);

    // B2B users conditions
    if (isUserB2B) {
        const allOnboardingSeen = hasSeenAllOnboarding(OnboardingFlow.B2B, b2bOnboardingViewFlag.feature?.Value ?? 0);
        // B2B users must opt-in, we start the onboarding if the flag is ON and their organisation allows it
        const hasB2BCategoryAccess = canUseCategoryView && !!organization?.Settings.MailCategoryViewEnabled;

        // The onboarding is opt-in, we only show to users who don't already have it on
        const hasEnabledCategoryView = mailSettings.MailCategoryView;

        // The following condition apply for existing and new b2b users
        const basicEligibility =
            hasB2BCategoryAccess && !allOnboardingSeen && !isUserInWelcomeFlow && !hasEnabledCategoryView;

        if (isExistingUser) {
            // Existing users see the spotlight right away
            return {
                isUserEligible: basicEligibility,
                flagValue: b2bOnboardingViewFlag.feature?.Value ?? 0,
                onboardingFlow: OnboardingFlow.B2B,
            };
        } else {
            // New B2B users see the spotlight once they have a given amount of email
            return {
                isUserEligible: basicEligibility && allMailsElementsCount.Total >= B2B_REQUIRED_NUMBER_OF_MAILS,
                flagValue: b2bOnboardingViewFlag.feature?.Value ?? 0,
                onboardingFlow: OnboardingFlow.B2B,
            };
        }
    }

    // B2C users conditions
    const isChecklistFull = mailChecklist.displayState === CHECKLIST_DISPLAY_TYPE.FULL;
    const allOnboardingSeen = hasSeenAllOnboarding(OnboardingFlow.B2C, b2cOnboardingViewFlag.feature?.Value ?? 0);

    // Existing B2C users see the card if they have a given number of emails and the checklist is no longer present on the list of email
    return {
        isUserEligible:
            isCategoryViewEnabled &&
            isExistingUser &&
            !allOnboardingSeen &&
            allMailsElementsCount.Total > B2C_REQUIRED_NUMBER_OF_MAILS &&
            !isChecklistFull,
        flagValue: b2cOnboardingViewFlag.feature?.Value ?? 0,
        onboardingFlow: OnboardingFlow.B2C,
    };
};
