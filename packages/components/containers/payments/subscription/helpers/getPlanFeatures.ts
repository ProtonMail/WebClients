import { c, msgid } from 'ttag';

import type { IconName } from '@proton/components/components/icon/Icon';
import { PLANS, type Plan } from '@proton/payments';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DARK_WEB_MONITORING_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

export type Feature = {
    icon: IconName;
    text: string;
};

// I have not been able to type the union of Plan and FreePlanDefault propertly without TS complaining,
// so I have typed this as Plan plus the optional MaxBaseSpace.
type PlanPlusBaseSpace = Plan & { MaxBaseSpace?: number };

export const getPlanFeatures = (plan: PlanPlusBaseSpace) => {
    const maxBytes = plan.Name === PLANS.FREE ? plan.MaxBaseSpace : plan.MaxSpace;
    const getMaxSpace = (unit: 'GB' | 'TB') => humanSize({ bytes: maxBytes, unit, fraction: 0 });
    // Variable must be planMaxSpace instead of maxSpaceGB in order to avoid quality:i118 error for variables in a context.
    const planMaxSpace = getMaxSpace('GB');
    const maxSpaceTB = getMaxSpace('TB');
    const planNumberOfDomains = plan.MaxDomains;
    const planNumberOfEmails = plan.MaxAddresses;
    const numberOfUsers = plan.MaxMembers;

    const advancedAccountProtection: Feature = {
        icon: 'grid-2',
        text: c('Cancellation upsell').t`Advanced account protection`,
    };

    const appsAndFeatures: Feature = {
        icon: 'grid-2',
        text: c('Cancellation upsell')
            .t`All premium features from ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
    };

    const cloudStorage: Feature = {
        icon: 'brand-proton-drive',
        text: c('Cancellation upsell').t`Cloud storage and sharing for large files`,
    };

    const customDomains: Feature = {
        icon: 'globe',
        text: c('Subscription reminder').ngettext(
            msgid`${planNumberOfDomains} custom email domain`,
            `${planNumberOfDomains} custom email domains`,
            planNumberOfDomains
        ),
    };

    const darkWebMonitoring: Feature = {
        icon: 'shield-2-bolt',
        text: DARK_WEB_MONITORING_NAME,
    };

    const emailAddress: Feature = {
        icon: 'envelope',
        text: c('Subscription reminder').ngettext(
            msgid`${planNumberOfEmails} email address`,
            `${planNumberOfEmails} email addresses`,
            planNumberOfEmails
        ),
    };

    const emailStorage: Feature = {
        icon: 'storage',
        // translator: full sentence is: <10GB> email storage
        text: c('Cancellation upsell').t`${planMaxSpace} email storage`,
    };

    const encryptedCloudStorage: Feature = {
        icon: 'brand-proton-drive',
        text: c('Cancellation upsell').t`Encrypted cloud storage for photos and documents`,
    };

    const foldersLabelsFilters: Feature = {
        icon: 'folders',
        text: c('Subscription reminder').t`Folders, labels, and custom filters`,
    };

    const passwordManager: Feature = {
        icon: 'brand-proton-pass',
        text: c('Cancellation upsell').t`Encrypted password manager`,
    };

    const protonScribe: Feature = {
        icon: 'pen-sparks',
        text: c('Info').t`${BRAND_NAME} Scribe writing assistant`,
    };

    const sharedCalendar: Feature = {
        icon: 'calendar-grid',
        text: c('Cancellation upsell').t`Secure personal and shared calendar`,
    };

    const storage: Feature = {
        icon: 'storage',
        // translator: full sentence is: <10TB> storage
        text: c('Cancellation upsell').t`${maxSpaceTB} storage`,
    };

    const storagePerUser: Feature = {
        icon: 'storage',
        // translator: full sentence is: <10GB> storage per user
        text: c('Subscription reminder').t`${planMaxSpace} storage per user`,
    };

    const users: Feature = {
        icon: 'users',
        text: c('new_plans: feature').ngettext(
            msgid`${numberOfUsers} user`,
            `Up to ${numberOfUsers} users`,
            numberOfUsers
        ),
    };

    const vpn: Feature = {
        icon: 'brand-proton-vpn',
        text: c('Cancellation upsell').t`Ultra fast and private VPN`,
    };

    const features = {
        [PLANS.BUNDLE]: [emailStorage, emailAddress, customDomains, passwordManager, vpn, encryptedCloudStorage],
        [PLANS.FAMILY]: [storage, users, appsAndFeatures, protonScribe],
        [PLANS.FREE]: [emailStorage, emailAddress],
        [PLANS.MAIL]: [emailStorage, emailAddress, customDomains, foldersLabelsFilters, darkWebMonitoring],
        [PLANS.MAIL_BUSINESS]: [storagePerUser, customDomains, sharedCalendar, cloudStorage, advancedAccountProtection],
        [PLANS.MAIL_PRO]: [storagePerUser, customDomains, sharedCalendar, cloudStorage],
    };

    return features[plan.Name as keyof typeof features];
};
