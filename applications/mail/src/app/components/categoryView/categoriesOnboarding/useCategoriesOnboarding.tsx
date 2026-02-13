import { fromUnixTime, isBefore } from 'date-fns';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { getLocationElementsCount } from 'proton-mail/helpers/elements';
import { isConversationMode } from 'proton-mail/helpers/mailSettings';

import { hasSeenAllOnboarding } from './categoriesOnboarding.helpers';
import { AudienceType, FeatureValueDefault, type OnboardingInfo } from './onboardingInterface';

const B2B_REQUIRED_NUMBER_OF_MAILS = 20;
const B2C_REQUIRED_NUMBER_OF_MAILS = 5;

export const useCategoriesOnboarding = (): OnboardingInfo => {
    const [user, loadingUser] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [messageCounts = [], messageCountsLoading] = useMessageCounts();
    const [conversationCounts = [], conversationCountsLoading] = useConversationCounts();

    const mailChecklist = useGetStartedChecklist();
    const welcomeFlags = useWelcomeFlags();

    const b2cOnboardingViewFlag = useFeature<number>(FeatureCode.CategoryViewB2COnboardingViewFlags);
    const b2bOnboardingViewFlag = useFeature<number>(FeatureCode.CategoryViewB2BOnboardingViewFlags);
    const accountDateThreshold = useFeature<number>(FeatureCode.CategoryViewOnboardingAccountDateThreshold);

    const loading =
        loadingOrganization ||
        loadingUser ||
        loadingMailSettings ||
        messageCountsLoading ||
        conversationCountsLoading ||
        b2cOnboardingViewFlag.loading ||
        b2bOnboardingViewFlag.loading ||
        accountDateThreshold.loading;

    if (loading || !accountDateThreshold.feature?.Value) {
        return {
            isUserEligible: false,
            audienceType: undefined,
            flagValue: FeatureValueDefault,
        };
    }

    const isUserB2B = getIsB2BAudienceFromPlan(organization?.PlanName);
    const isUserInWelcomeFlow = welcomeFlags.welcomeFlags.isWelcomeFlow;

    // Existing users, created before the release of the category view see the onboarding
    const isExistingUser = isBefore(fromUnixTime(user.CreateTime), new Date(accountDateThreshold.feature.Value));

    // B2B users conditions
    if (isUserB2B) {
        const allOnboardingSeen = hasSeenAllOnboarding(AudienceType.B2B, b2bOnboardingViewFlag.feature?.Value ?? 0);

        // The following condition apply for existing and new b2b users
        const basicEligibility = !allOnboardingSeen && !isUserInWelcomeFlow;

        if (isExistingUser) {
            // Existing users see the spotlight right away
            return {
                isUserEligible: basicEligibility,
                audienceType: AudienceType.B2B,
                flagValue: b2bOnboardingViewFlag.feature?.Value ?? 0,
            };
        } else {
            // New B2B users see the spotlight once they have a given amount of email
            const allMailsElementsCount = getLocationElementsCount(
                MAILBOX_LABEL_IDS.ALL_MAIL,
                conversationCounts,
                messageCounts,
                isConversationMode(MAILBOX_LABEL_IDS.ALL_MAIL, mailSettings)
            );

            return {
                isUserEligible: basicEligibility && allMailsElementsCount >= B2B_REQUIRED_NUMBER_OF_MAILS,
                audienceType: AudienceType.B2B,
                flagValue: b2bOnboardingViewFlag.feature?.Value ?? 0,
            };
        }
    }

    // B2C users conditions
    const isChecklistFull = mailChecklist.displayState === CHECKLIST_DISPLAY_TYPE.FULL;
    const allOnboardingSeen = hasSeenAllOnboarding(AudienceType.B2C, b2cOnboardingViewFlag.feature?.Value ?? 0);
    const allMailsElementsCount = getLocationElementsCount(
        MAILBOX_LABEL_IDS.ALL_MAIL,
        conversationCounts,
        messageCounts,
        isConversationMode(MAILBOX_LABEL_IDS.ALL_MAIL, mailSettings)
    );

    // Existing B2C users see the card if they have a given number of emails and the checklist is no longer present on the list of email
    return {
        isUserEligible:
            isExistingUser &&
            !allOnboardingSeen &&
            allMailsElementsCount > B2C_REQUIRED_NUMBER_OF_MAILS &&
            !isChecklistFull,
        audienceType: AudienceType.B2C,
        flagValue: b2cOnboardingViewFlag.feature?.Value ?? 0,
    };
};
