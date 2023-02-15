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
    | 'email-aliases';

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
        getText: () => c('new_plans: feature').t`Up to 500 GB of storage`,
        getTooltip: () =>
            c('new_plans: feature info')
                .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME} and ${DRIVE_APP_NAME}`,
    },
    'more-email-addresses': {
        icon: 'envelopes',
        getText: () => c('new_plans: feature').t`Up to 15 email addresses`,
    },
    'custom-email-domains': {
        icon: 'globe',
        getText: () => c('new_plans: feature').t`Custom email domains`,
    },
    'email-aliases': {
        icon: 'eye-slash',
        getText: () => c('new_plans: feature').t`Hide My Email aliases`,
        getTooltip: () => c('new_plans: feature info').t`Get unlimited aliases with SimpleLogin by ${BRAND_NAME}`,
    },
};
