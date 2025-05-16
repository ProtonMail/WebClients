import { useUser } from '@proton/account/user/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { useSpotlightOnFeature, useSpotlightShow } from '@proton/components';
import { FeatureCode } from '@proton/features/interface';
import { SECOND } from '@proton/shared/lib/constants';
import { isUserAccountOlderThanOrEqualToDays } from '@proton/shared/lib/user/helpers';

import { useNewsletterSubscriptions } from 'proton-mail/store/newsletterSubscriptions/hook';

const REQUIRED_MAIL_SUBSCRIPTIONS = 10;

export const useNewsletterSubscriptionSpotlight = () => {
    const [user] = useUser();
    const { welcomeFlags } = useWelcomeFlags();

    const [newsletterSub] = useNewsletterSubscriptions();

    const {
        show: showSpotlight,
        onDisplayed,
        onClose,
    } = useSpotlightOnFeature(
        FeatureCode.NewsletterSubscriptionSpotlight,
        // Accounts that are more than two days old
        isUserAccountOlderThanOrEqualToDays(user, 2) &&
            welcomeFlags.isDone &&
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
