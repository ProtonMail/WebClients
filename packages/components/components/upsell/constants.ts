import { isArray } from 'card-validator/dist/lib/is-array';
import { c } from 'ttag';

import { getStorageFeature } from '@proton/components/containers/payments/features/drive';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { getNAddressesFeature } from '@proton/components/containers/payments/features/mail';
import { FREE_PLAN, PLANS, type Plan } from '@proton/payments';
import { BRAND_NAME, CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import type { UpsellFeature, UpsellFeatureGetter } from './interface';

export type UpsellFeatureName =
    | 'unlimited-folders-and-labels'
    | 'more-storage'
    | 'more-email-addresses'
    | 'custom-email-domains'
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
    | 'password-health'
    | 'account-protection'
    | 'more-premium-features'
    | 'drive-plus-storage'
    | 'file-sharing'
    | 'docs-editor'
    | 'photos-backup';

const domain = 'proton.me';
// Dirty fix because we cannot add twice the same variable in a string with ttag
const domain2 = 'proton.me';

const getTextFromFeature = (feature: PlanCardFeatureDefinition) => {
    if (isArray(feature.text)) {
        return feature.text.join(' ');
    }
    if (typeof feature.text === 'string') {
        return feature.text;
    }
    return '';
};

/**
 * Default upsell features
 */
export const upsellFeatures: Record<UpsellFeatureName, UpsellFeature | UpsellFeatureGetter> = {
    'unlimited-folders-and-labels': {
        icon: 'folders',
        getText: () => c('new_plans: feature').t`Unlimited folders, labels, and filters`,
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
            getText: () => getTextFromFeature(feature),
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
            getText: () => getTextFromFeature(feature),
            getTooltip: () => feature.tooltip ?? '',
        };
    },
    'password-health': {
        icon: 'lock',
        getText: () => c('new_plans: feature').t`Password health`,
    },
    'account-protection': {
        icon: 'user',
        getText: () => c('new_plans: feature').t`Advanced account protection`,
    },
    'more-premium-features': {
        icon: 'checkmark',
        getText: () => c('new_plans: feature').t`10 more premium features`,
    },
    'drive-plus-storage': {
        icon: 'storage',
        getText: () => c('new_plans: feature').t`200 GB of storage`,
        getTooltip: () =>
            c('new_plans: feature info')
                .t`Storage space is shared across ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME} and ${DRIVE_APP_NAME}`,
    },
    'file-sharing': {
        icon: 'users',
        getText: () => c('new_plans: feature').t`Secure file storage and sharing`,
    },
    'docs-editor': {
        icon: 'brand-proton-docs',
        getText: () => c('new_plans: feature').t`Online document editor`,
    },
    'photos-backup': {
        icon: 'image',
        getText: () => c('new_plans: feature').t`Private photo backup`,
    },
};
