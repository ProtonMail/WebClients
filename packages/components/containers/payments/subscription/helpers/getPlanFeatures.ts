import { c, msgid } from 'ttag';

import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcBrandProtonPass } from '@proton/icons/icons/IcBrandProtonPass';
import { IcBrandProtonVpn } from '@proton/icons/icons/IcBrandProtonVpn';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcGrid2 } from '@proton/icons/icons/IcGrid2';
import { IcPenSparks } from '@proton/icons/icons/IcPenSparks';
import { IcShield2Bolt } from '@proton/icons/icons/IcShield2Bolt';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { PLANS } from '@proton/payments/core/constants';
import type { Plan } from '@proton/payments/core/plan/interface';
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

import type { PlanCardFeatureIcon } from '../../features/interface';
import { getScribeWritingAssistantText } from '../assistant/helpers';

export type Feature = {
    icon: PlanCardFeatureIcon;
    text: string;
};

// I have not been able to type the union of Plan and FreePlanDefault propertly without TS complaining,
// so I have typed this as Plan plus the optional MaxBaseSpace.
type PlanPlusBaseSpace = Plan & { MaxBaseSpace?: number };

export const getPlanFeatures = (plan: PlanPlusBaseSpace, scribeToLumo: boolean) => {
    const maxBytes = plan.Name === PLANS.FREE ? plan.MaxBaseSpace : plan.MaxSpace;
    const getMaxSpace = (unit: 'GB' | 'TB') => humanSize({ bytes: maxBytes, unit, fraction: 0 });
    // Variable must be planMaxSpace instead of maxSpaceGB in order to avoid quality:i118 error for variables in a context.
    const planMaxSpace = getMaxSpace('GB');
    const maxSpaceTB = getMaxSpace('TB');
    const planNumberOfDomains = plan.MaxDomains;
    const planNumberOfEmails = plan.MaxAddresses;
    const numberOfUsers = plan.MaxMembers;

    const advancedAccountProtection: Feature = {
        icon: IcGrid2,
        text: c('Cancellation upsell').t`Advanced account protection`,
    };

    const appsAndFeatures: Feature = {
        icon: IcGrid2,
        text: c('Cancellation upsell')
            .t`All premium features from ${BRAND_NAME} ${MAIL_SHORT_APP_NAME}, ${PASS_SHORT_APP_NAME}, ${VPN_SHORT_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and ${CALENDAR_SHORT_APP_NAME}`,
    };

    const cloudStorage: Feature = {
        icon: IcBrandProtonDrive,
        text: c('Cancellation upsell').t`Cloud storage and sharing for large files`,
    };

    const customDomains: Feature = {
        icon: IcGlobe,
        text: c('Subscription reminder').ngettext(
            msgid`${planNumberOfDomains} custom email domain`,
            `${planNumberOfDomains} custom email domains`,
            planNumberOfDomains
        ),
    };

    const darkWebMonitoring: Feature = {
        icon: IcShield2Bolt,
        text: DARK_WEB_MONITORING_NAME,
    };

    const emailAddress: Feature = {
        icon: IcEnvelope,
        text: c('Subscription reminder').ngettext(
            msgid`${planNumberOfEmails} email address`,
            `${planNumberOfEmails} email addresses`,
            planNumberOfEmails
        ),
    };

    const emailStorage: Feature = {
        icon: IcStorage,
        // translator: full sentence is: <10GB> email storage
        text: c('Cancellation upsell').t`${planMaxSpace} email storage`,
    };

    const encryptedCloudStorage: Feature = {
        icon: IcBrandProtonDrive,
        text: c('Cancellation upsell').t`Encrypted cloud storage for photos and documents`,
    };

    const foldersLabelsFilters: Feature = {
        icon: IcFolders,
        text: c('Subscription reminder').t`Folders, labels, and custom filters`,
    };

    const passwordManager: Feature = {
        icon: IcBrandProtonPass,
        text: c('Cancellation upsell').t`Encrypted password manager`,
    };

    const protonScribe: Feature = {
        icon: IcPenSparks,
        text: getScribeWritingAssistantText(scribeToLumo),
    };

    const sharedCalendar: Feature = {
        icon: IcCalendarGrid,
        text: c('Cancellation upsell').t`Secure personal and shared calendar`,
    };

    const storage: Feature = {
        icon: IcStorage,
        // translator: full sentence is: <10TB> storage
        text: c('Cancellation upsell').t`${maxSpaceTB} storage`,
    };

    const storagePerUser: Feature = {
        icon: IcStorage,
        // translator: full sentence is: <10GB> storage per user
        text: c('Subscription reminder').t`${planMaxSpace} storage per user`,
    };

    const users: Feature = {
        icon: IcUsers,
        text: c('Cancellation upsell').ngettext(
            msgid`${numberOfUsers} user`,
            `Up to ${numberOfUsers} users`,
            numberOfUsers
        ),
    };

    const vpn: Feature = {
        icon: IcBrandProtonVpn,
        text: c('Cancellation upsell').t`Ultra fast and private VPN`,
    };

    const features = {
        [PLANS.BUNDLE]: [emailStorage, emailAddress, customDomains, passwordManager, vpn, encryptedCloudStorage],
        [PLANS.BUNDLE_PRO_2024]: [
            storagePerUser,
            customDomains,
            appsAndFeatures,
            sharedCalendar,
            advancedAccountProtection,
        ],
        [PLANS.FAMILY]: [storage, users, appsAndFeatures, protonScribe],
        [PLANS.FREE]: [emailStorage, emailAddress],
        [PLANS.MAIL]: [emailStorage, emailAddress, customDomains, foldersLabelsFilters, darkWebMonitoring],
        [PLANS.MAIL_BUSINESS]: [storagePerUser, customDomains, sharedCalendar, cloudStorage, advancedAccountProtection],
        [PLANS.MAIL_PRO]: [storagePerUser, customDomains, sharedCalendar, cloudStorage],
    };

    return features[plan.Name as keyof typeof features];
};
