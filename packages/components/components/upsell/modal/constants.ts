import { isArray } from 'card-validator/dist/lib/is-array';
import { c } from 'ttag';

import { getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getNAddressesFeature } from '@proton/components/containers/payments/features/mail';
import { PLANS } from '@proton/payments';
import { MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { BRAND_NAME, CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import { getNCalendarsText } from '../../../containers/payments/features/calendar';
import type { UpsellFeature, UpsellFeatureGetter } from './interface';

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
    | 'quickly-craft-replies'
    | 'proofread-an-refine'
    | 'save-time-emailing'
    | 'proton-scribe'
    | '2-users-support' // proton duo specific
    | '1-tb-secure-storage' // proton duo specific
    | 'all-proton-products'
    | 'address-by-plan'
    | 'storage-by-plan'
    | 'breach-alerts'
    | 'password-health'
    | 'account-protection';

const domain = 'proton.me';
// Dirty fix because we cannot add twice the same variable in a string with ttag
const domain2 = 'proton.me';

/**
 * Default upsell features
 */
export const upsellFeatures: Record<UpsellFeatureName, UpsellFeature | UpsellFeatureGetter> = {
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
        icon: 'magic-wand',
        getText: () => c('new_plans: feature').t`Generate emails with a prompt`,
    },
    'quickly-craft-replies': {
        icon: 'arrow-up-and-left-big',
        getText: () => c('new_plans: feature').t`Quickly craft replies`,
    },
    'proofread-an-refine': {
        icon: 'magnifier-check',
        getText: () => c('new_plans: feature').t`Proofread and refine your emails`,
    },
    'save-time-emailing': {
        icon: 'clock',
        getText: () => c('new_plans: feature').t`Save time emailing`,
    },
    'proton-scribe': {
        icon: 'pen-sparks',
        getText: () => c('new_plans: feature').t`${BRAND_NAME} Scribe writing assistant`,
    },
    '2-users-support': {
        icon: 'users',
        getText: () => c('new_plans: feature').t`Support for up to 2 users`,
    },
    '1-tb-secure-storage': {
        icon: 'storage',
        getText: () => c('new_plans: feature').t`1 TB secure storage`,
    },
    'all-proton-products': {
        icon: 'brand-proton',
        getText: () => c('new_plans: feature').t`All ${BRAND_NAME} products and features`,
    },
    'address-by-plan': (plan?: Plan) => {
        if (!plan) {
            return null;
        }
        const feature = getNAddressesFeature({
            n: plan.MaxAddresses,
            duo: plan.Name === PLANS.DUO,
            family: plan.Name === PLANS.FAMILY,
        });
        return {
            icon: 'envelopes',
            getText: () => (isArray(feature.text) ? feature.text.join(' ') : feature.text),
            getTooltip: () => feature.tooltip ?? '',
        };
    },
    'storage-by-plan': (plan?: Plan) => {
        if (!plan) {
            return null;
        }
        const feature = getStorageFeature(plan.MaxSpace, {
            freePlan: FREE_PLAN,
            duo: plan.Name === PLANS.DUO,
            family: plan.Name === PLANS.FAMILY,
        });
        return {
            icon: 'storage',
            getText: () => (isArray(feature.text) ? feature.text.join(' ') : feature.text),
            getTooltip: () => feature.tooltip ?? '',
        };
    },
    'breach-alerts': {
        icon: 'shield-2-bolt',
        getText: () => c('new_plans: feature').t`Breach alerts`,
    },
    'password-health': {
        icon: 'lock',
        getText: () => c('new_plans: feature').t`Password health`,
    },
    'account-protection': {
        icon: 'user',
        getText: () => c('new_plans: feature').t`Advanced account protection`,
    },
};
