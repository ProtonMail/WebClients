import { isBefore, sub } from 'date-fns';
import { c } from 'ttag';

import { getEmailSubscriptions } from '@proton/components/containers/account/constants/email-subscriptions';
import { useLoading } from '@proton/hooks';
import { patchNews } from '@proton/shared/lib/api/settings';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/constants';

import { useApi, useEventManager, useNotifications, useUser, useUserSettings } from '../../hooks';
import type { NewsletterSubscriptionUpdateData } from './EmailSubscriptionToggles';
import EmailSubscriptionToggles from './EmailSubscriptionToggles';

const EditEmailSubscription = () => {
    const [user] = useUser();
    const [{ News, EarlyAccess } = { News: 0, EarlyAccess: 0 }] = useUserSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const [loading, withLoading] = useLoading();

    const handleChange = (data: NewsletterSubscriptionUpdateData) =>
        withLoading(async () => {
            await api(patchNews(data));
            await call();
            createNotification({ text: c('Info').t`Emailing preference saved` });
        });

    const filteredEmailSubscription = getEmailSubscriptions().filter(({ flag }) => {
        switch (flag) {
            case NEWSLETTER_SUBSCRIPTIONS_BITS.NEW_EMAIL_NOTIF:
                // Daily email notifications are currently in a separate setting. Should they be migrated?
                return false;
            case NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES:
                // We don't want to display toggle for FEATURES news subscription as manual switch has been deprecated for this option.
                // INBOX_NEWS, DRIVE_NEWS & VPN_NEWS should be used instead
                return false;
            case NEWSLETTER_SUBSCRIPTIONS_BITS.ONBOARDING:
                // check if the user account was created more than 1 month ago
                return isBefore(sub(new Date(), { months: 1 }), user.CreateTime * 1000);
            case NEWSLETTER_SUBSCRIPTIONS_BITS.BETA:
                return Boolean(EarlyAccess);
            default:
                return true;
        }
    });

    return (
        <EmailSubscriptionToggles
            News={News}
            onChange={handleChange}
            disabled={loading}
            subscriptions={filteredEmailSubscription}
        />
    );
};

export default EditEmailSubscription;
