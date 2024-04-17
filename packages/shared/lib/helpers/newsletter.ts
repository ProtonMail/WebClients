import isNumber from 'lodash/isNumber';

import {
    NEWSLETTER_SUBSCRIPTIONS,
    NEWSLETTER_SUBSCRIPTIONS_BITS,
    NEWSLETTER_SUBSCRIPTIONS_BY_BITS,
} from '../constants';
import { hasBit } from './bitset';

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
