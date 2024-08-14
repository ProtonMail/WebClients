import { c } from 'ttag';

import { BRAND_NAME, PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getTwoFA = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Two-factor authentication`,
        tooltip: c('new_plans: tooltip')
            .t`Requires a code sent to a mobile phone to sign in. This ensures even if a password is compromised, the account stays secure.`,
        included: true,
    };
};

export const getRequire2FA = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Require 2FA for organization`,
        included,
    };
};

export const getSSOIntegration = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`SSO integration (coming soon)`,
        included,
        status: 'coming-soon',
    };
};

export const getConsole = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Admin console`,
        tooltip: c('new_plans: tooltip')
            .t`Organization management tool that lets admins add and remove users, allocate storage, configure domains, and perform other tasks`,
        included: true,
    };
};

export const getBilling = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Centralized billing`,
        tooltip: c('new_plans: tooltip')
            .t`Manage your subscription, including customization of your plan. Payment methods accepted are credit card, PayPal, cryptocurrency, and wire transfer.`,
        included: true,
    };
};

export const getAdmins = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Multiple admin roles`,
        tooltip: c('new_plans: tooltip')
            .t`You can have more than one admin. All admins can add and manage users but only the primary admin has control over billing.`,
        included: true,
    };
};

export const getSignIn = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Sign in as user`,
        tooltip: c('new_plans: tooltip')
            .t`Option to view non-private user inboxes as the user would, including full message and contact details`,
        included: true,
    };
};
export const getCredentials = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`User credential management`,
        tooltip: c('new_plans: tooltip').t`Reset user passwords and reset two-factor authentication on users`,
        included: true,
    };
};

export const getSessions = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`User session management`,
        tooltip: c('new_plans: tooltip')
            .t`Force sign-out of user sessions when user credentials are believed to be compromised`,
        included: true,
    };
};

export const getUserStorageManagement = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`User storage management`,
        tooltip: c('new_plans: tooltip').t`Increase or reallocate storage for a user`,
        included: true,
    };
};

export const getTeamManagementFeatures = (): PlanCardFeature[] => {
    return [
        {
            name: 'two-fa',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getTwoFA(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getTwoFA(),
                [PLANS.MAIL_BUSINESS]: getTwoFA(),
                [PLANS.BUNDLE_PRO]: getTwoFA(),
                [PLANS.BUNDLE_PRO_2024]: getTwoFA(),
                [PLANS.PASS_PRO]: getTwoFA(),
                [PLANS.PASS_BUSINESS]: getTwoFA(),
                [PLANS.VPN_PRO]: getTwoFA(),
                [PLANS.VPN_BUSINESS]: getTwoFA(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'require-two-fa',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: getRequire2FA(),
                [PLANS.PASS_BUSINESS]: getRequire2FA(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'console',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getConsole(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getConsole(),
                [PLANS.MAIL_BUSINESS]: getConsole(),
                [PLANS.BUNDLE_PRO]: getConsole(),
                [PLANS.BUNDLE_PRO_2024]: getConsole(),
                [PLANS.PASS_PRO]: getConsole(),
                [PLANS.PASS_BUSINESS]: getConsole(),
                [PLANS.VPN_PRO]: getConsole(),
                [PLANS.VPN_BUSINESS]: getConsole(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'billing',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getBilling(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getBilling(),
                [PLANS.MAIL_BUSINESS]: getBilling(),
                [PLANS.BUNDLE_PRO]: getBilling(),
                [PLANS.BUNDLE_PRO_2024]: getBilling(),
                [PLANS.PASS_PRO]: getBilling(),
                [PLANS.PASS_BUSINESS]: getBilling(),
                [PLANS.VPN_PRO]: getBilling(),
                [PLANS.VPN_BUSINESS]: getBilling(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'admins',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getAdmins(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getAdmins(),
                [PLANS.MAIL_BUSINESS]: getAdmins(),
                [PLANS.BUNDLE_PRO]: getAdmins(),
                [PLANS.BUNDLE_PRO_2024]: getAdmins(),
                [PLANS.PASS_PRO]: getAdmins(),
                [PLANS.PASS_BUSINESS]: getAdmins(),
                [PLANS.VPN_PRO]: getAdmins(),
                [PLANS.VPN_BUSINESS]: getAdmins(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'sso',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: getSSOIntegration(),
                [PLANS.PASS_BUSINESS]: getSSOIntegration(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'sign-in',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getSignIn(),
                [PLANS.MAIL_BUSINESS]: getSignIn(),
                [PLANS.BUNDLE_PRO]: getSignIn(),
                [PLANS.BUNDLE_PRO_2024]: getSignIn(),
                [PLANS.PASS_PRO]: getSignIn(),
                [PLANS.PASS_BUSINESS]: getSignIn(),
                [PLANS.VPN_PRO]: getSignIn(),
                [PLANS.VPN_BUSINESS]: getSignIn(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'storage',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getUserStorageManagement(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getUserStorageManagement(),
                [PLANS.MAIL_BUSINESS]: getUserStorageManagement(),
                [PLANS.BUNDLE_PRO]: getUserStorageManagement(),
                [PLANS.BUNDLE_PRO_2024]: getUserStorageManagement(),
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'credentials',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getCredentials(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getCredentials(),
                [PLANS.MAIL_BUSINESS]: getCredentials(),
                [PLANS.BUNDLE_PRO]: getCredentials(),
                [PLANS.BUNDLE_PRO_2024]: getCredentials(),
                [PLANS.PASS_PRO]: getCredentials(),
                [PLANS.PASS_BUSINESS]: getCredentials(),
                [PLANS.VPN_PRO]: getCredentials(),
                [PLANS.VPN_BUSINESS]: getCredentials(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'sessions',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getSessions(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getSessions(),
                [PLANS.MAIL_BUSINESS]: getSessions(),
                [PLANS.BUNDLE_PRO]: getSessions(),
                [PLANS.BUNDLE_PRO_2024]: getSessions(),
                [PLANS.PASS_PRO]: getSessions(),
                [PLANS.PASS_BUSINESS]: getSessions(),
                [PLANS.VPN_PRO]: getSessions(),
                [PLANS.VPN_BUSINESS]: getSessions(),
                [PLANS.WALLET]: null,
            },
        },
    ];
};
export const getGDPR = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`GDPR data processing agreement`,
        included: true,
    };
};
export const getHIPAA = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Enables HIPAA compliance`,
        tooltip: c('new_plans: tooltip')
            .t`We’re committed to helping customers subject to HIPAA/HITECH regulations safeguard protected health information (PHI). Signed BAAs are available for all ${BRAND_NAME} for Business customers.`,
        included: true,
    };
};
export const getSupport = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Priority email support`,
        tooltip: c('new_plans: tooltip')
            .t`On business days, receive support from the ${BRAND_NAME} Customer Support team within 24 hours of requests`,
        included: true,
    };
};
export const getPhoneSupport = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Phone support (20+ users)`,
        tooltip: c('new_plans: tooltip')
            .t`Phone support is available from the ${BRAND_NAME} Customer Support team during European business hours, for customers with 20 or more users`,
        included: true,
        icon: 'phone',
    };
};
export const getSLA = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`99.95% SLA`,
        tooltip: c('new_plans: tooltip')
            .t`Our robust infrastructure ensures you will be able to access your account when you need it`,
        included: true,
    };
};

export const getSupportFeatures = (): PlanCardFeature[] => {
    return [
        {
            name: 'gdpr',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getGDPR(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getGDPR(),
                [PLANS.MAIL_BUSINESS]: getGDPR(),
                [PLANS.BUNDLE_PRO]: getGDPR(),
                [PLANS.BUNDLE_PRO_2024]: getGDPR(),
                [PLANS.PASS_PRO]: getGDPR(),
                [PLANS.PASS_BUSINESS]: getGDPR(),
                [PLANS.VPN_PRO]: getGDPR(),
                [PLANS.VPN_BUSINESS]: getGDPR(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'hipaa',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getHIPAA(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getHIPAA(),
                [PLANS.MAIL_BUSINESS]: getHIPAA(),
                [PLANS.BUNDLE_PRO]: getHIPAA(),
                [PLANS.BUNDLE_PRO_2024]: getHIPAA(),
                [PLANS.PASS_PRO]: getHIPAA(),
                [PLANS.PASS_BUSINESS]: getHIPAA(),
                [PLANS.VPN_PRO]: getHIPAA(),
                [PLANS.VPN_BUSINESS]: getHIPAA(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'b2b-support',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getSupport(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getSupport(),
                [PLANS.MAIL_BUSINESS]: getSupport(),
                [PLANS.BUNDLE_PRO]: getSupport(),
                [PLANS.BUNDLE_PRO_2024]: getSupport(),
                [PLANS.PASS_PRO]: getSupport(),
                [PLANS.PASS_BUSINESS]: getSupport(),
                [PLANS.VPN_PRO]: getSupport(),
                [PLANS.VPN_BUSINESS]: getSupport(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'phone-support',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getPhoneSupport(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getPhoneSupport(),
                [PLANS.MAIL_BUSINESS]: getPhoneSupport(),
                [PLANS.BUNDLE_PRO]: getPhoneSupport(),
                [PLANS.BUNDLE_PRO_2024]: getPhoneSupport(),
                [PLANS.PASS_PRO]: getPhoneSupport(),
                [PLANS.PASS_BUSINESS]: getPhoneSupport(),
                [PLANS.VPN_PRO]: getPhoneSupport(),
                [PLANS.VPN_BUSINESS]: getPhoneSupport(),
                [PLANS.WALLET]: null,
            },
        },
        {
            name: 'sla',
            target: Audience.B2B,
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: getSLA(),
                [PLANS.PASS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: getSLA(),
                [PLANS.MAIL_BUSINESS]: getSLA(),
                [PLANS.BUNDLE_PRO]: getSLA(),
                [PLANS.BUNDLE_PRO_2024]: getSLA(),
                [PLANS.PASS_PRO]: getSLA(),
                [PLANS.PASS_BUSINESS]: getSLA(),
                [PLANS.VPN_PRO]: getSLA(),
                [PLANS.VPN_BUSINESS]: getSLA(),
                [PLANS.WALLET]: null,
            },
        },
    ];
};
