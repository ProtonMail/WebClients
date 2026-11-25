import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { SECOND } from '@proton/shared/lib/constants';
import { isUserAccountOlderThanOrEqualToDays } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash/useFlag';

import { useNewsletterSubscriptions } from '../../../../store/newsletterSubscriptions/hook';

const REQUIRED_MAIL_SUBSCRIPTIONS = 10;

export const useNewsletterSubscriptionSpotlight = () => {
    const [user] = useUser();
    const { welcomeFlags } = useWelcomeFlags();
    const isInboxCleanupEnabled = useFlag('InboxBringYourOwnEmailCleanup');
    const { feature: byoeSpotlightFeature, loading: isBYOESpotlightLoading } = useFeature<boolean>(
        FeatureCode.BYOEInboxCleanupSpotlight,
        isInboxCleanupEnabled
    );

    const [newsletterSub] = useNewsletterSubscriptions();

    // With the BYOE inbox cleanup on, accounts whose BYOE Mailing lists spotlight is due get that one instead.
    // Held back while the code loads, so the two never race on the same load.
    const isBYOESpotlightDue =
        isInboxCleanupEnabled && (isBYOESpotlightLoading || byoeSpotlightFeature?.Value === true);

    const {
        show: showSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(
        FeatureCode.NewsletterSubscriptionSpotlight,
        // Accounts that are more than two days old
        isUserAccountOlderThanOrEqualToDays(user, 2) &&
            welcomeFlags.isDone &&
            !isBYOESpotlightDue &&
            // With more than 10 mail subscriptions
            newsletterSub.tabs.active.totalCount + newsletterSub.tabs.unsubscribe.totalCount >=
                REQUIRED_MAIL_SUBSCRIPTIONS
    );

    const shouldShowSpotlight = useSpotlightShow(showSpotlight, 3 * SECOND);

    return {
        shouldShowSpotlight,
        onDisplayed,
        onClose,
    };
};
