import { c } from 'ttag';

import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    NEWSLETTER_SUBSCRIPTIONS_BITS,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';

export interface EmailSubscription {
    id: string;
    title: string;
    flag: NEWSLETTER_SUBSCRIPTIONS_BITS;
    frequency?: string;
    tooltip?: string;
}

export const getEmailSubscriptions: () => EmailSubscription[] = () => [
    {
        id: 'announcements',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.ANNOUNCEMENTS,
        title: c('Label for news').t`${BRAND_NAME} important announcements`,
        frequency: c('Frequency of news').t`(2-4 emails per year)`,
    },
    {
        id: 'features',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES,
        title: c('Label for news').t`${BRAND_NAME} product announcements`,
        frequency: c('Frequency of news').t`(1-2 emails per month)`,
    },
    {
        id: 'business',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.BUSINESS,
        title: c('Label for news').t`${BRAND_NAME} for Business newsletter`,
        frequency: c('Frequency of news').t`(1 email per month)`,
    },
    {
        id: 'newsletter',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.NEWSLETTER,
        title: c('Label for news').t`${BRAND_NAME} newsletter`,
        frequency: c('Frequency of news').t`(1 email per month)`,
        tooltip: c(`Tooltip for news`)
            .t`Get the latest privacy news and what is going on in the ${BRAND_NAME} universe`,
    },
    {
        id: 'beta',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.BETA,
        title: c('Label for news').t`${BRAND_NAME} beta announcements`,
        frequency: c('Frequency of news').t`(1-2 emails per month)`,
    },
    {
        id: 'offers',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.OFFERS,
        title: c('Label for news').t`${BRAND_NAME} offers and promotions`,
        frequency: c('Frequency of news').t`(1 email per quarter)`,
    },
    {
        id: 'onboarding',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.ONBOARDING,
        title: c('Label for news').t`${BRAND_NAME} welcome emails`,
        frequency: c('Frequency of news').t`(during your first month)`,
    },
    {
        id: 'user_survey',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.USER_SURVEY,
        title: c(`Label for news`).t`${BRAND_NAME} user survey`,
        tooltip: c(`Tooltip for news`).t`Participate in surveys to improve ${BRAND_NAME} services`,
    },
    {
        id: 'news_product_inbox',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS,
        title: c(`Label for news`).t`${MAIL_APP_NAME} and ${CALENDAR_SHORT_APP_NAME} new features`,
        frequency: c('Frequency of news').t`(1 email per month)`,
    },
    {
        id: 'news_product_drive',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.DRIVE_NEWS,
        title: c(`Label for news`).t`${DRIVE_APP_NAME} product updates`,
        frequency: c('Frequency of news').t`(4-6 emails per year)`,
    },
    {
        id: 'news_product_vpn',
        flag: NEWSLETTER_SUBSCRIPTIONS_BITS.VPN_NEWS,
        title: c(`Label for news`).t`${VPN_APP_NAME} product updates`,
        frequency: c('Frequency of news').t`(4-6 emails per year)`,
    },
];

export const getEmailSubscriptionsMap = () => toMap(getEmailSubscriptions(), 'flag');
