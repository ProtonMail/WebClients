import { c } from 'ttag';

import { BRAND_NAME, PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getTwoFA = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Two-factor authentication`,
        tooltip: c('new_plans: tooltip')
            .t`Requires a code sent to a mobile phone to sign in. This ensures even if a password is compromised, the account stays secure.`,
        included: true,
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getTwoFA(),
                [PLANS.BUNDLE_PRO]: getTwoFA(),
                [PLANS.VPN_PRO]: getTwoFA(),
                [PLANS.VPN_BUSINESS]: getTwoFA(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getConsole(),
                [PLANS.BUNDLE_PRO]: getConsole(),
                [PLANS.VPN_PRO]: getConsole(),
                [PLANS.VPN_BUSINESS]: getConsole(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getBilling(),
                [PLANS.BUNDLE_PRO]: getBilling(),
                [PLANS.VPN_PRO]: getBilling(),
                [PLANS.VPN_BUSINESS]: getBilling(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getAdmins(),
                [PLANS.BUNDLE_PRO]: getAdmins(),
                [PLANS.VPN_PRO]: getAdmins(),
                [PLANS.VPN_BUSINESS]: getAdmins(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getSignIn(),
                [PLANS.BUNDLE_PRO]: getSignIn(),
                [PLANS.VPN_PRO]: getSignIn(),
                [PLANS.VPN_BUSINESS]: getSignIn(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getCredentials(),
                [PLANS.BUNDLE_PRO]: getCredentials(),
                [PLANS.VPN_PRO]: getCredentials(),
                [PLANS.VPN_BUSINESS]: getCredentials(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getSessions(),
                [PLANS.BUNDLE_PRO]: getSessions(),
                [PLANS.VPN_PRO]: getSessions(),
                [PLANS.VPN_BUSINESS]: getSessions(),
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
        text: c('new_plans: feature').t`Phone support (6+ users)`,
        tooltip: c('new_plans: tooltip')
            .t`Phone support is available from the ${BRAND_NAME} Customer Success team during European business hours, for customers with 6 or more users`,
        included: true,
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getGDPR(),
                [PLANS.BUNDLE_PRO]: getGDPR(),
                [PLANS.VPN_PRO]: getGDPR(),
                [PLANS.VPN_BUSINESS]: getGDPR(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getHIPAA(),
                [PLANS.BUNDLE_PRO]: getHIPAA(),
                [PLANS.VPN_PRO]: getHIPAA(),
                [PLANS.VPN_BUSINESS]: getHIPAA(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getSupport(),
                [PLANS.BUNDLE_PRO]: getSupport(),
                [PLANS.VPN_PRO]: getSupport(),
                [PLANS.VPN_BUSINESS]: getSupport(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getPhoneSupport(),
                [PLANS.BUNDLE_PRO]: getPhoneSupport(),
                [PLANS.VPN_PRO]: getPhoneSupport(),
                [PLANS.VPN_BUSINESS]: getPhoneSupport(),
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
                [PLANS.PASS_PLUS]: null,
                [PLANS.FAMILY]: null,
                [PLANS.MAIL_PRO]: getSLA(),
                [PLANS.BUNDLE_PRO]: getSLA(),
                [PLANS.VPN_PRO]: getSLA(),
                [PLANS.VPN_BUSINESS]: getSLA(),
            },
        },
    ];
};
