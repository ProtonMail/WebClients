import { c, msgid } from 'ttag';

import { BRAND_NAME, PLANS } from '@proton/shared/lib/constants';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getPasswordsAndNotesText = () => {
    return c('new_plans: feature').t`Unlimited passwords and notes`;
};

export const getPasswordsAndNotes = (): PlanCardFeatureDefinition => {
    return {
        text: getPasswordsAndNotesText(),
        included: true,
        icon: 'note',
    };
};

export const getDevicesText = () => {
    return c('new_plans: feature').t`Unlimited devices`;
};

export const getDevices = (): PlanCardFeatureDefinition => {
    return {
        text: getDevicesText(),
        included: true,
        icon: 'mobile',
    };
};

export const getUnlimitedHideMyEmailAliasesText = () => {
    return c('new_plans: feature').t`Unlimited Hide My Email aliases`;
};

export const getHideMyEmailAliases = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text:
            n === 'unlimited'
                ? getUnlimitedHideMyEmailAliasesText()
                : c('new_plans: feature').ngettext(msgid`${n} Hide My Email alias`, `${n} Hide My Email aliases`, n),
        tooltip: c('new_plans: tooltip')
            .t`Unique, on-the-fly email addresses that protect your online identity and let you control what lands in your inbox. From SimpleLogin by ${BRAND_NAME}.`,
        included: true,
        icon: 'eye-slash',
    };
};

export const getE2Encryption = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Strong E2E encryption`,
        included: true,
    };
};

export const get2FAAuthenticatorText = () => {
    return c('new_plans: feature').t`Integrated 2FA authenticator`;
};

export const get2FAAuthenticator = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: get2FAAuthenticatorText(),
        included,
        icon: 'key',
    };
};

export const getVaults = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text:
            n === 'unlimited'
                ? c('new_plans: feature').t`Unlimited vaults`
                : c('new_plans: feature').ngettext(msgid`${n} vault`, `${n} vaults`, n),
        tooltip: c('new_plans: tooltip')
            .t`Like a folder, a vault is a convenient way to organize your items. Sharing vaults with friends and family is in the works.`,
        included: true,
        icon: 'vault',
    };
};

export const getCustomDomainForEmailAliases = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Custom domain for email aliases`,
        included,
        icon: 'earth',
    };
};

export const getForwardingMailboxes = (n: number | 'multiple'): PlanCardFeatureDefinition => {
    return {
        text:
            n === 'multiple'
                ? c('new_plans: feature').t`Multiple forwarding mailboxes`
                : c('new_plans: feature').ngettext(msgid`${n} forwarding mailbox`, `${n} forwarding mailboxes`, n),
        included: true,
        icon: 'envelope-arrow-up-and-right',
    };
};

export const getSharing = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: included
            ? c('new_plans: feature').t`Vault and Item sharing (coming soon)`
            : c('new_plans: feature').t`Vault and Item sharing`,
        included,
        icon: 'arrow-up-from-square',
        status: 'coming-soon',
    };
};

export const getDataBreachMonitoring = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: included
            ? c('new_plans: feature').t`Data breach monitoring (coming soon)`
            : c('new_plans: feature').t`Data breach monitoring`,
        included,
        icon: 'shield',
        status: 'coming-soon',
    };
};

export const FREE_PASS_ALIASES = 10;
export const FREE_VAULTS = 1;
export const FREE_FORWARDING_MAILBOXES = 1;

export const getPassFeatures = (): PlanCardFeature[] => {
    return [
        {
            name: 'passwords-and-notes',
            plans: {
                [PLANS.FREE]: getPasswordsAndNotes(),
                [PLANS.BUNDLE]: getPasswordsAndNotes(),
                [PLANS.MAIL]: getPasswordsAndNotes(),
                [PLANS.VPN]: getPasswordsAndNotes(),
                [PLANS.DRIVE]: getPasswordsAndNotes(),
                [PLANS.PASS_PLUS]: getPasswordsAndNotes(),
                [PLANS.FAMILY]: getPasswordsAndNotes(),
                [PLANS.MAIL_PRO]: getPasswordsAndNotes(),
                [PLANS.BUNDLE_PRO]: getPasswordsAndNotes(),
            },
        },
        {
            name: 'devices',
            plans: {
                [PLANS.FREE]: getDevices(),
                [PLANS.BUNDLE]: getDevices(),
                [PLANS.MAIL]: getDevices(),
                [PLANS.VPN]: getDevices(),
                [PLANS.DRIVE]: getDevices(),
                [PLANS.PASS_PLUS]: getDevices(),
                [PLANS.FAMILY]: getDevices(),
                [PLANS.MAIL_PRO]: getDevices(),
                [PLANS.BUNDLE_PRO]: getDevices(),
            },
        },
        {
            name: 'hide-my-email-aliases',
            plans: {
                [PLANS.FREE]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.BUNDLE]: getHideMyEmailAliases('unlimited'),
                [PLANS.MAIL]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.VPN]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.DRIVE]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.PASS_PLUS]: getHideMyEmailAliases('unlimited'),
                [PLANS.FAMILY]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.MAIL_PRO]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.BUNDLE_PRO]: getHideMyEmailAliases('unlimited'),
            },
        },
        {
            name: '2fa-authenticator',
            plans: {
                [PLANS.FREE]: get2FAAuthenticator(),
                [PLANS.BUNDLE]: get2FAAuthenticator(true),
                [PLANS.MAIL]: get2FAAuthenticator(),
                [PLANS.VPN]: get2FAAuthenticator(),
                [PLANS.DRIVE]: get2FAAuthenticator(),
                [PLANS.PASS_PLUS]: get2FAAuthenticator(true),
                [PLANS.FAMILY]: get2FAAuthenticator(),
                [PLANS.MAIL_PRO]: get2FAAuthenticator(),
                [PLANS.BUNDLE_PRO]: get2FAAuthenticator(true),
            },
        },
        {
            name: 'vaults',
            plans: {
                [PLANS.FREE]: getVaults(FREE_VAULTS),
                [PLANS.BUNDLE]: getVaults('unlimited'),
                [PLANS.MAIL]: getVaults(FREE_VAULTS),
                [PLANS.VPN]: getVaults(FREE_VAULTS),
                [PLANS.DRIVE]: getVaults(FREE_VAULTS),
                [PLANS.PASS_PLUS]: getVaults('unlimited'),
                [PLANS.FAMILY]: getVaults(FREE_VAULTS),
                [PLANS.MAIL_PRO]: getVaults(FREE_VAULTS),
                [PLANS.BUNDLE_PRO]: getVaults('unlimited'),
            },
        },
        {
            name: 'custom-domain-email-aliases',
            plans: {
                [PLANS.FREE]: getCustomDomainForEmailAliases(),
                [PLANS.BUNDLE]: getCustomDomainForEmailAliases(true),
                [PLANS.MAIL]: getCustomDomainForEmailAliases(),
                [PLANS.VPN]: getCustomDomainForEmailAliases(),
                [PLANS.DRIVE]: getCustomDomainForEmailAliases(),
                [PLANS.PASS_PLUS]: getCustomDomainForEmailAliases(true),
                [PLANS.FAMILY]: getCustomDomainForEmailAliases(),
                [PLANS.MAIL_PRO]: getCustomDomainForEmailAliases(),
                [PLANS.BUNDLE_PRO]: getCustomDomainForEmailAliases(true),
            },
        },
        {
            name: 'forwarding-mailboxes',
            plans: {
                [PLANS.FREE]: getForwardingMailboxes(FREE_FORWARDING_MAILBOXES),
                [PLANS.BUNDLE]: getForwardingMailboxes('multiple'),
                [PLANS.MAIL]: getForwardingMailboxes(FREE_FORWARDING_MAILBOXES),
                [PLANS.VPN]: getForwardingMailboxes(FREE_FORWARDING_MAILBOXES),
                [PLANS.DRIVE]: getForwardingMailboxes(FREE_FORWARDING_MAILBOXES),
                [PLANS.PASS_PLUS]: getForwardingMailboxes('multiple'),
                [PLANS.FAMILY]: getForwardingMailboxes(FREE_FORWARDING_MAILBOXES),
                [PLANS.MAIL_PRO]: getForwardingMailboxes(FREE_FORWARDING_MAILBOXES),
                [PLANS.BUNDLE_PRO]: getForwardingMailboxes('multiple'),
            },
        },
        {
            name: 'vault-and-item-sharing',
            plans: {
                [PLANS.FREE]: getSharing(),
                [PLANS.BUNDLE]: getSharing(true),
                [PLANS.MAIL]: getSharing(),
                [PLANS.VPN]: getSharing(),
                [PLANS.DRIVE]: getSharing(),
                [PLANS.PASS_PLUS]: getSharing(true),
                [PLANS.FAMILY]: getSharing(),
                [PLANS.MAIL_PRO]: getSharing(),
                [PLANS.BUNDLE_PRO]: getSharing(true),
            },
        },
        {
            name: 'data-breach-monitoring',
            plans: {
                [PLANS.FREE]: getDataBreachMonitoring(),
                [PLANS.BUNDLE]: getDataBreachMonitoring(true),
                [PLANS.MAIL]: getDataBreachMonitoring(),
                [PLANS.VPN]: getDataBreachMonitoring(),
                [PLANS.DRIVE]: getDataBreachMonitoring(),
                [PLANS.PASS_PLUS]: getDataBreachMonitoring(true),
                [PLANS.FAMILY]: getDataBreachMonitoring(),
                [PLANS.MAIL_PRO]: getDataBreachMonitoring(),
                [PLANS.BUNDLE_PRO]: getDataBreachMonitoring(true),
            },
        },
    ];
};
