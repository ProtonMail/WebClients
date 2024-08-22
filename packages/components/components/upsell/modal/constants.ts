import { c } from 'ttag';

import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { getNCalendarsText } from '../../../containers/payments/features/calendar';
import type { UpsellFeature } from './interface';

export type UpsellFeatureName =
    | 'auto-delete-trash-and-spam'
    | 'schedule-messages'
    | 'unlimited-folders-and-labels'
    | 'search-message-content'
    | 'more-storage'
    | 'more-email-addresses'
    | 'custom-email-domains'
    | 'snooze-messages'
    | 'more-calendars'
    | 'calendar-sharing'
    | 'generate-emails-with-prompt'
    | 'proofread-an-refine'
    | 'save-time-emailing';

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
        icon: 'paper-plane-clock',
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
        getText: () => c('new_plans: feature').t`15 GB storage`,
        getTooltip: () =>
            c('new_plans: feature info')
                .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME} and ${DRIVE_APP_NAME}`,
    },
    'more-email-addresses': {
        icon: 'envelopes',
        getText: () => c('new_plans: feature').t`10 email addresses/aliases`,
        getTooltip: () =>
            c('new_plans: feature info')
                .t`Create multiple email addresses for your online identities e.g. JohnShopper@${domain} for shopping accounts, JohnNews@${domain2} for news subscription`,
    },
    'custom-email-domains': {
        icon: 'globe',
        getText: () => c('new_plans: feature').t`Custom email domains`,
        getTooltip: () => c('new_plans: feature info').t`1 custom email domain`,
    },
    'snooze-messages': {
        icon: 'clock',
        getText: () => c('new_plans: feature').t`Custom snooze time`,
        getTooltip: () => c('new_plans: feature info').t`Snooze messages and get reminded when you want`,
    },
    'more-calendars': {
        icon: 'calendar-grid',
        getText: () => {
            return getNCalendarsText(MAX_CALENDARS_PAID);
        },
    },
    'calendar-sharing': {
        icon: 'users',
        getText: () => c('new_plans: feature').t`Calendar sharing`,
    },
    'generate-emails-with-prompt': {
        icon: 'checkmark',
        getText: () => c('new_plans: feature').t`Generate emails with only a prompt`,
    },
    'proofread-an-refine': {
        icon: 'checkmark',
        getText: () => c('new_plans: feature').t`Proofread and refine your texts`,
    },
    'save-time-emailing': {
        icon: 'checkmark',
        getText: () => c('new_plans: feature').t`Save time emailing`,
    },
};
