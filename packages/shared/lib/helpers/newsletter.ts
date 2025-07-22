import isNumber from 'lodash/isNumber';

import { clearBit, hasBit, setBit } from './bitset';

export enum NEWSLETTER_SUBSCRIPTIONS {
    ANNOUNCEMENTS = 'Announcements',
    /** not displayed anymore, turning on one product news should turn it on as well */
    FEATURES = 'Features',
    NEWSLETTER = 'Newsletter',
    BETA = 'Beta',
    BUSINESS = 'Business',
    OFFERS = 'Offers',
    /** used in `Messages & Composing` */
    NEW_EMAIL_NOTIF = 'NewEmailNotif',
    ONBOARDING = 'Onboarding',
    USER_SURVEY = 'UserSurveys',
    INBOX_NEWS = 'InboxNews',
    VPN_NEWS = 'VpnNews',
    DRIVE_NEWS = 'DriveNews',
    PASS_NEWS = 'PassNews',
    WALLET_NEWS = 'WalletNews',
    LUMO_NEWS = 'LumoNews',
    IN_APP_NOTIFICATIONS = 'InAppNotifications',
}

// Synced with UserNews enum in slim api
export enum NEWSLETTER_SUBSCRIPTIONS_BITS {
    ANNOUNCEMENTS = 1 << 0,
    FEATURES = 1 << 1,
    NEWSLETTER = 1 << 2,
    BETA = 1 << 3,
    BUSINESS = 1 << 4,
    OFFERS = 1 << 5,
    /** used in `Messages & Composing` */
    NEW_EMAIL_NOTIF = 1 << 6,
    ONBOARDING = 1 << 7,
    USER_SURVEY = 1 << 8,
    INBOX_NEWS = 1 << 9,
    VPN_NEWS = 1 << 10,
    DRIVE_NEWS = 1 << 11,
    PASS_NEWS = 1 << 12,
    WALLET_NEWS = 1 << 13,
    IN_APP_NOTIFICATIONS = 1 << 14,
    LUMO_NEWS = 1 << 15,
}

export const NEWSLETTER_SUBSCRIPTIONS_BY_BITS: Record<NEWSLETTER_SUBSCRIPTIONS_BITS, NEWSLETTER_SUBSCRIPTIONS> = {
    [NEWSLETTER_SUBSCRIPTIONS_BITS.ANNOUNCEMENTS]: NEWSLETTER_SUBSCRIPTIONS.ANNOUNCEMENTS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES]: NEWSLETTER_SUBSCRIPTIONS.FEATURES,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.NEWSLETTER]: NEWSLETTER_SUBSCRIPTIONS.NEWSLETTER,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.BETA]: NEWSLETTER_SUBSCRIPTIONS.BETA,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.BUSINESS]: NEWSLETTER_SUBSCRIPTIONS.BUSINESS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.OFFERS]: NEWSLETTER_SUBSCRIPTIONS.OFFERS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.NEW_EMAIL_NOTIF]: NEWSLETTER_SUBSCRIPTIONS.NEW_EMAIL_NOTIF,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.ONBOARDING]: NEWSLETTER_SUBSCRIPTIONS.ONBOARDING,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.USER_SURVEY]: NEWSLETTER_SUBSCRIPTIONS.USER_SURVEY,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS]: NEWSLETTER_SUBSCRIPTIONS.INBOX_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.VPN_NEWS]: NEWSLETTER_SUBSCRIPTIONS.VPN_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.DRIVE_NEWS]: NEWSLETTER_SUBSCRIPTIONS.DRIVE_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.PASS_NEWS]: NEWSLETTER_SUBSCRIPTIONS.PASS_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.WALLET_NEWS]: NEWSLETTER_SUBSCRIPTIONS.WALLET_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.LUMO_NEWS]: NEWSLETTER_SUBSCRIPTIONS.LUMO_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS]: NEWSLETTER_SUBSCRIPTIONS.IN_APP_NOTIFICATIONS,
};

export const NEWSLETTER_SUBSCRIPTIONS_BY_KEY: Record<NEWSLETTER_SUBSCRIPTIONS, NEWSLETTER_SUBSCRIPTIONS_BITS> = {
    [NEWSLETTER_SUBSCRIPTIONS.ANNOUNCEMENTS]: NEWSLETTER_SUBSCRIPTIONS_BITS.ANNOUNCEMENTS,
    [NEWSLETTER_SUBSCRIPTIONS.FEATURES]: NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES,
    [NEWSLETTER_SUBSCRIPTIONS.NEWSLETTER]: NEWSLETTER_SUBSCRIPTIONS_BITS.NEWSLETTER,
    [NEWSLETTER_SUBSCRIPTIONS.BETA]: NEWSLETTER_SUBSCRIPTIONS_BITS.BETA,
    [NEWSLETTER_SUBSCRIPTIONS.BUSINESS]: NEWSLETTER_SUBSCRIPTIONS_BITS.BUSINESS,
    [NEWSLETTER_SUBSCRIPTIONS.OFFERS]: NEWSLETTER_SUBSCRIPTIONS_BITS.OFFERS,
    [NEWSLETTER_SUBSCRIPTIONS.NEW_EMAIL_NOTIF]: NEWSLETTER_SUBSCRIPTIONS_BITS.NEW_EMAIL_NOTIF,
    [NEWSLETTER_SUBSCRIPTIONS.ONBOARDING]: NEWSLETTER_SUBSCRIPTIONS_BITS.ONBOARDING,
    [NEWSLETTER_SUBSCRIPTIONS.USER_SURVEY]: NEWSLETTER_SUBSCRIPTIONS_BITS.USER_SURVEY,
    [NEWSLETTER_SUBSCRIPTIONS.INBOX_NEWS]: NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS.VPN_NEWS]: NEWSLETTER_SUBSCRIPTIONS_BITS.VPN_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS.DRIVE_NEWS]: NEWSLETTER_SUBSCRIPTIONS_BITS.DRIVE_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS.PASS_NEWS]: NEWSLETTER_SUBSCRIPTIONS_BITS.PASS_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS.WALLET_NEWS]: NEWSLETTER_SUBSCRIPTIONS_BITS.WALLET_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS.LUMO_NEWS]: NEWSLETTER_SUBSCRIPTIONS_BITS.LUMO_NEWS,
    [NEWSLETTER_SUBSCRIPTIONS.IN_APP_NOTIFICATIONS]: NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS,
};

export type NewsletterSubscriptionUpdateData = Partial<Record<NEWSLETTER_SUBSCRIPTIONS, boolean>>;

/**
 * if we have new value, we return it, else we return old value, if it is undefined we return null
 */
const isProductNewsEnabled = (
    flag: NEWSLETTER_SUBSCRIPTIONS_BITS,
    currentNews: NewsletterSubscriptionUpdateData | number,
    updatedNews?: NewsletterSubscriptionUpdateData | number
) => {
    const strFlag = NEWSLETTER_SUBSCRIPTIONS_BY_BITS[flag];
    const currentValue = isNumber(currentNews) ? hasBit(currentNews, flag) : currentNews[strFlag];
    const updatedValue = isNumber(updatedNews) ? hasBit(updatedNews, flag) : updatedNews?.[strFlag];
    return updatedValue ?? currentValue ?? null;
};

/**
 * If one of the product newsletter (Inbox/Drive/Pass/VPN) is enabled, then returns true
 */
export const isGlobalFeatureNewsEnabled = (
    currentNews: NewsletterSubscriptionUpdateData | number,
    updatedNews?: NewsletterSubscriptionUpdateData | number
) => {
    return Boolean(
        isProductNewsEnabled(NEWSLETTER_SUBSCRIPTIONS_BITS.INBOX_NEWS, currentNews, updatedNews) ||
            isProductNewsEnabled(NEWSLETTER_SUBSCRIPTIONS_BITS.DRIVE_NEWS, currentNews, updatedNews) ||
            isProductNewsEnabled(NEWSLETTER_SUBSCRIPTIONS_BITS.PASS_NEWS, currentNews, updatedNews) ||
            isProductNewsEnabled(NEWSLETTER_SUBSCRIPTIONS_BITS.VPN_NEWS, currentNews, updatedNews)
    );
};

export const getUpdatedNewsBitmap = (news: number, data: NewsletterSubscriptionUpdateData) => {
    return Object.entries(data).reduce((acc, [key, value]) => {
        const flag = NEWSLETTER_SUBSCRIPTIONS_BY_KEY[key as NEWSLETTER_SUBSCRIPTIONS];
        if (value) {
            return setBit(acc, flag);
        } else {
            return clearBit(acc, flag);
        }
    }, news ?? 0);
};

export const getSubscriptionPatchUpdate = ({
    currentNews,
    diff,
}: {
    currentNews: number;
    diff: NewsletterSubscriptionUpdateData;
}) => {
    const update = {
        ...diff,
    };

    // Until clients support sending the new flags, we propagate the unsubscription from the old one to the specific
    // flags of the currently used products
    // TODO: Should this be removed?
    const newFeaturesValue = isGlobalFeatureNewsEnabled(currentNews, update);
    if (newFeaturesValue !== hasBit(currentNews, NEWSLETTER_SUBSCRIPTIONS_BITS.FEATURES)) {
        update[NEWSLETTER_SUBSCRIPTIONS.FEATURES] = newFeaturesValue;
    }

    return update;
};
