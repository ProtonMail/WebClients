import { c } from 'ttag';

import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_APP_NAME,
    LUMO_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
    WALLET_APP_NAME,
} from '@proton/shared/lib/constants';
import {
    NEWSLETTER_SUBSCRIPTIONS_BITS,
    type NewsletterSubscriptionUpdateData,
} from '@proton/shared/lib/helpers/newsletter';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { UserModel, UserSettings } from '@proton/shared/lib/interfaces';

export interface EmailSubscription {
    id: string;
    title: string;
    flag: NEWSLETTER_SUBSCRIPTIONS_BITS;
    frequency?: string;
    tooltip?: string;
}

interface EmailSubscriptionData {
    title: string;
    toggles: EmailSubscription[];
}

const getProductUpdatesString = (app: string, additionalApp?: string) => {
    if (additionalApp) {
        // translator: Reads "Proton Mail and Calendar product updates"
        return c('news').t`${app} and ${additionalApp} product updates`;
    }

    return c('news').t`${app} product updates`;
};

export const getEmailSubscriptions = (
    filter: (data: EmailSubscription) => boolean
): {
    general: EmailSubscriptionData;
    product: EmailSubscriptionData;
    notifications: EmailSubscriptionData;
} => {
    const general = [
        {
            id: 'announcements',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.ANNOUNCEMENTS,
            title: c('news').t`${BRAND_NAME} important announcements`,
            frequency: c('news').t`2-4 emails per year`,
        },
        {
            id: 'business',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.BUSINESS,
            title: c('news').t`${BRAND_NAME} for Business newsletter`,
            frequency: c('news').t`1 email per month`,
        },
        {
            id: 'features',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES,
            title: c('news').t`${BRAND_NAME} product announcements`,
            frequency: c('news').t`1-2 emails per month`,
        },
        {
            id: 'newsletter',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.NEWSLETTER,
            title: c('news').t`${BRAND_NAME} newsletter`,
            frequency: c('news')
                .t`1 email per month. Get the latest privacy news and what is going on in the ${BRAND_NAME} universe.`,
        },
        {
            id: 'offers',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.OFFERS,
            title: c('news').t`${BRAND_NAME} offers and promotions`,
            frequency: c('news').t`1 email per quarter`,
        },
        {
            id: 'daily-emails',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.NEW_EMAIL_NOTIF,
            title: c('news').t`Daily email notifications`,
        },
        {
            id: 'onboarding',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.ONBOARDING,
            title: c('news').t`${BRAND_NAME} welcome emails`,
            frequency: c('news').t`During your first month of using a ${BRAND_NAME} product`,
        },
        {
            id: 'user_survey',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.USER_SURVEY,
            title: c('news').t`${BRAND_NAME} user survey`,
            frequency: c('news').t`Participate in surveys to improve ${BRAND_NAME} services`,
        },
    ].filter(filter);

    const product = [
        {
            id: 'news_product_inbox',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS,
            title: getProductUpdatesString(MAIL_APP_NAME, CALENDAR_SHORT_APP_NAME),
            frequency: c('news').t`1 email per month`,
        },
        {
            id: 'news_product_drive',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.DRIVE_NEWS,
            title: getProductUpdatesString(DRIVE_APP_NAME),
            frequency: c('news').t`4-6 emails per year`,
        },
        {
            id: 'news_product_pass',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.PASS_NEWS,
            title: getProductUpdatesString(PASS_APP_NAME),
            frequency: c('news').t`4-6 emails per year`,
        },
        {
            id: 'news_product_wallet',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.WALLET_NEWS,
            title: getProductUpdatesString(WALLET_APP_NAME),
            frequency: c('news').t`4-6 emails per year`,
        },
        {
            id: 'news_product_vpn',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.VPN_NEWS,
            title: getProductUpdatesString(VPN_APP_NAME),
            frequency: c('news').t`4-6 emails per year`,
        },
        {
            id: 'news_product_lumo',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.LUMO_NEWS,
            title: getProductUpdatesString(LUMO_APP_NAME),
            frequency: c('news').t`4-6 emails per year`,
        },
    ].filter(filter);

    const notifications = [
        {
            id: 'in_app_notifications',
            flag: NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS,
            title: c('news').t`In-app notifications`,
            frequency: c('news')
                .t`Disabling this will remove the ability to receive notifications in ${BRAND_NAME} applications`,
            tooltip: c('news').t`Critical account notifications will still be delivered`,
        },
    ].filter(filter);

    return {
        general: { title: c('news').t`Email subscriptions`, toggles: general },
        product: { title: c('news').t`Product updates`, toggles: product },
        notifications: { title: c('news').t`Application notifications`, toggles: notifications },
    };
};

export const getEmailSubscriptionsMap = () => {
    const result = getEmailSubscriptions(() => true);
    return toMap([...result.general.toggles, ...result.product.toggles, ...result.notifications.toggles], 'flag');
};

export const filterNews = ({
    emailSubscription,
    userSettings,
}: {
    emailSubscription: EmailSubscription;
    user: UserModel | undefined;
    userSettings: UserSettings | undefined;
}) => {
    switch (emailSubscription.flag) {
        case NEWSLETTER_SUBSCRIPTIONS_BITS.NEW_EMAIL_NOTIF:
            // Daily email notifications are currently in a separate setting. Should they be migrated?
            return false;
        case NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES:
            // We don't want to display toggle for FEATURES news subscription as manual switch has been deprecated for this option.
            // INBOX_NEWS, DRIVE_NEWS & VPN_NEWS should be used instead
            return false;
        case NEWSLETTER_SUBSCRIPTIONS_BITS.BETA:
            return Boolean(userSettings?.EarlyAccess);
        default:
            return true;
    }
};

export const getUpdateNotification = (data: NewsletterSubscriptionUpdateData) => {
    if (data.InAppNotifications !== undefined) {
        return c('Info').t`Preference saved`;
    }
    return c('Info').t`Emailing preference saved`;
};
