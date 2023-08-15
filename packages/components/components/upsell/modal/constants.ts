import { c } from 'ttag';

import { BRAND_NAME, CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { UpsellFeature } from './interface';

export type UpsellFeatureName =
    | 'auto-delete-trash-and-spam'
    | 'schedule-messages'
    | 'unlimited-folders-and-labels'
    | 'search-message-content'
    | 'more-storage'
    | 'more-email-addresses'
    | 'custom-email-domains'
    | 'email-aliases'
    | 'snooze-messages';

const domain = 'proton.me';
// Dirty fix because we cannot add twice the same variable in a string with ttag
const domain2 = 'proton.me';

/**
 * Default upsell features
 */
export const upsellFeatures: Record<UpsellFeatureName, UpsellFeature> = {
    'auto-delete-trash-and-spam': {
        icon: 'trash-clock',
        getText: () => c('new_plans: feature').t`Auto-delete spam and trashed messages`,
    },
    'schedule-messages': {
        icon: 'clock-paper-plane',
        getText: () => c('new_plans: feature').t`Schedule messages at any time`,
    },
    'unlimited-folders-and-labels': {
        icon: 'folders',
        getText: () => c('new_plans: feature').t`Unlimited folders, labels, and filters`,
    },
    'search-message-content': {
        icon: 'magnifier',
        getText: () => c('new_plans: feature').t`Search message content`,
    },
    'more-storage': {
        icon: 'storage',
        getText: () => c('new_plans: feature').t`Up to 3 TB of storage`,
        getTooltip: () =>
            c('new_plans: feature info')
                .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME} and ${DRIVE_APP_NAME}`,
    },
    'more-email-addresses': {
        icon: 'envelopes',
        getText: () => c('new_plans: feature').t`Up to 15 email addresses`,
        getTooltip: () =>
            c('new_plans: feature info')
                .t`Create multiple email addresses for your online identities e.g. JohnShopper@${domain} for shopping accounts, JohnNews@${domain2} for news subscription`,
    },
    'custom-email-domains': {
        icon: 'globe',
        getText: () => c('new_plans: feature').t`Custom email domains`,
        getTooltip: () =>
            c('new_plans: feature info').t`Use your own custom email domain address, e.g., you@yourname.com`,
    },
    'email-aliases': {
        icon: 'eye-slash',
        getText: () => c('new_plans: feature').t`Hide-my-email aliases`,
        getTooltip: () => c('new_plans: feature info').t`Get unlimited aliases with SimpleLogin by ${BRAND_NAME}`,
    },
    'snooze-messages': {
        icon: 'clock',
        getText: () => c('new_plans: feature').t`Custom snooze time`,
        getTooltip: () => c('new_plans: feature info').t`Snooze messages and get reminded when you want`,
    },
};
