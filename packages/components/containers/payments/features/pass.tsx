import { c, msgid } from 'ttag';

import {
    BRAND_NAME,
    DARK_WEB_MONITORING_NAME,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    PLANS,
} from '@proton/shared/lib/constants';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getPassAppFeature = (): PlanCardFeatureDefinition => {
    return {
        text: PASS_APP_NAME,
        included: true,
        icon: 'brand-proton-pass',
        tooltip: c('tooltip')
            .t`${PASS_APP_NAME}: Secure logins on all your devices. Includes unlimited aliases, sharing, integrated 2FA, and more.`,
    };
};

export const getCustomDomains = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Custom domains for email aliases`,
        included: true,
    };
};

export const getProtonPassFeature = (n: 'unlimited' | number = 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text:
            n === 'unlimited'
                ? c('new_plans: feature').t`${PASS_APP_NAME} with unlimited hide-my-email aliases`
                : c('new_plans: feature').ngettext(
                      msgid`${PASS_APP_NAME} with ${n} hide-my-email alias`,
                      `${PASS_APP_NAME} with ${n} hide-my-email aliases`,
                      n
                  ),
        icon: 'brand-proton-pass',
        included: true,
        hideInDowngrade: true,
    };
};

export const getLoginsAndNotesText = (type: 'free' | 'paid') => {
    if (type === 'free') {
        return c('new_plans: feature').t`Unlimited logins and notes`;
    }
    return c('new_plans: feature').t`Unlimited logins, notes and credit cards`;
};

export const getGroupManagement = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Group management (coming soon)`,
        included,
        status: 'coming-soon',
    };
};

export const getLoginsAndNotes = (type: Parameters<typeof getLoginsAndNotesText>[0]): PlanCardFeatureDefinition => {
    return {
        text: getLoginsAndNotesText(type),
        icon: 'note',
        included: true,
        hideInDowngrade: true,
    };
};

export const getItems = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Organize items with multiple vaults`,
        included: true,
    };
};

export const getCreditCards = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Autofill credit cards (coming soon)`,
        included: true,
        status: 'coming-soon',
    };
};

export const getDevicesText = () => {
    return c('new_plans: feature').t`Unlimited devices`;
};

export const getDevicesAndAliasesText = () => {
    return c('new_plans: feature').t`Unlimited devices and aliases`;
};

export const getDevices = (): PlanCardFeatureDefinition => {
    return {
        text: getDevicesText(),
        icon: 'mobile',
        included: true,
        hideInDowngrade: true,
    };
};

export const getDevicesAndAliases = (): PlanCardFeatureDefinition => {
    return {
        text: getDevicesAndAliasesText(),
        icon: 'mobile',
        included: true,
        hideInDowngrade: true,
    };
};

export const getNHideMyEmailAliasesText = (n: number) => {
    return c('new_plans: feature').ngettext(msgid`${n} hide-my-email alias`, `${n} hide-my-email aliases`, n);
};

export const getUnlimitedHideMyEmailAliasesText = () => {
    return c('new_plans: feature').t`Unlimited hide-my-email aliases`;
};

export const getHideMyEmailAliases = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text: n === 'unlimited' ? getUnlimitedHideMyEmailAliasesText() : getNHideMyEmailAliasesText(n),
        tooltip: c('new_plans: tooltip')
            .t`Protect your real email address from being disclosed or leaked with aliases (a randomly-generated email address that forwards emails to your main inbox).`,
        included: true,
        icon: 'eye-slash',
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
        tooltip: c('new_plans: tooltip').t`Like a folder, a vault is a convenient way to organize your items`,
        included: true,
        icon: 'vault',
    };
};

export const getCustomFields = (included: boolean = false): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Custom fields`,
        included,
        icon: 'pen-square',
    };
};

export const getDarkWebMonitoring = (): PlanCardFeatureDefinition => {
    return {
        text: DARK_WEB_MONITORING_NAME,
        tooltip: c('new_plans: feature')
            .t`We scan the dark web to check if your ${BRAND_NAME} addresses or aliases have been leaked and alert you immediately if we find anything.`,
        included: true,
        icon: 'pen-square',
    };
};

export const getPasswordHealth = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Password health`,
        tooltip: c('new_plans: feature')
            .t`Regular checkups of your account security. We alert you if you have weak or reused passwords that need to be updated.`,
        included: true,
        icon: 'pen-square',
    };
};

export const getUnlimitedVaultSharingText = () => {
    return c('new_plans: feature').t`Unlimited shared vaults with access permissions`;
};

export const getVaultSharingText = (n: number | 'unlimited') => {
    return n === 'unlimited'
        ? c('new_plans: feature').t`Unlimited vault sharing`
        : c('new_plans: feature').ngettext(
              msgid`Vault sharing (up to ${n} person)`,
              `Vault sharing (up to ${n} people)`,
              n
          );
};

export const getVaultSharing = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text: getVaultSharingText(n),
        icon: 'arrow-up-from-square',
        included: true,
        hideInDowngrade: true,
    };
};

export const getVaultSharingB2BText = (n: number | 'unlimited') => {
    return n === 'unlimited'
        ? c('new_plans: feature').t`Unlimited shared ${PASS_SHORT_APP_NAME} vaults per user`
        : c('new_plans: feature').ngettext(
              msgid`${n} shared ${PASS_SHORT_APP_NAME} vault per user`,
              `${n} shared ${PASS_SHORT_APP_NAME} vaults per user`,
              n
          );
};

export const getVaultSharingB2B = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    return {
        text: getVaultSharingB2BText(n),
        icon: 'vault',
        included: true,
        hideInDowngrade: true,
    };
};

export const getSecureSharingTextEmpty = (link?: boolean) => {
    if (link) {
        return c('pass_signup_2023: Info').t`Secure vault and link sharing`;
    }
    return c('pass_signup_2023: Info').t`Secure vault sharing`;
};

export const getSecureSharingText = (n: number, link?: boolean) => {
    if (link) {
        return c('pass_signup_2023: Info').ngettext(
            msgid`Secure vault sharing (${n} vault) and link sharing`,
            `Secure vault sharing (${n} vaults) and link sharing`,
            n
        );
    }
    return c('pass_signup_2023: Info').ngettext(
        msgid`Secure vault sharing (${n} vault)`,
        `Secure vault sharing (${n} vaults)`,
        n
    );
};

export const getSecureVaultSharing = (...args: Parameters<typeof getSecureSharingText>): PlanCardFeatureDefinition => {
    return {
        text: getSecureSharingText(...args),
        icon: 'arrow-up-from-square',
        included: true,
        hideInDowngrade: true,
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

export const getPasswordManager = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Password manager`,
        included: true,
        icon: 'brand-proton-pass',
    };
};

export const FREE_PASS_ALIASES = 10;
export const FREE_VAULTS = 2;
export const PAID_VAULTS = 10;
export const FREE_VAULT_SHARING = 3;

export const PASS_PLUS_VAULTS = 50;
export const PASS_PLUS_VAULT_SHARING = 10;

export const PASS_PRO_VAULTS = 'unlimited';
export const PASS_PRO_VAULT_SHARING = 'unlimited';

export const PASS_BIZ_VAULTS = 'unlimited';
export const PASS_BIZ_VAULT_SHARING = 'unlimited';

export const getPassFeatures = (): PlanCardFeature[] => {
    return [
        {
            name: 'passwords-and-notes',
            plans: {
                [PLANS.FREE]: getLoginsAndNotes('free'),
                [PLANS.BUNDLE]: getLoginsAndNotes('paid'),
                [PLANS.MAIL]: getLoginsAndNotes('free'),
                [PLANS.VPN]: getLoginsAndNotes('free'),
                [PLANS.DRIVE]: getLoginsAndNotes('free'),
                [PLANS.DRIVE_BUSINESS]: getLoginsAndNotes('free'),
                [PLANS.PASS]: getLoginsAndNotes('paid'),
                [PLANS.WALLET]: getLoginsAndNotes('free'),
                [PLANS.FAMILY]: getLoginsAndNotes('paid'),
                [PLANS.DUO]: getLoginsAndNotes('paid'),
                [PLANS.MAIL_PRO]: getLoginsAndNotes('free'),
                [PLANS.MAIL_BUSINESS]: getLoginsAndNotes('free'),
                [PLANS.BUNDLE_PRO]: getLoginsAndNotes('paid'),
                [PLANS.BUNDLE_PRO_2024]: getLoginsAndNotes('paid'),
                [PLANS.PASS_PRO]: getLoginsAndNotes('paid'),
                [PLANS.PASS_BUSINESS]: getLoginsAndNotes('paid'),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
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
                [PLANS.DRIVE_BUSINESS]: getDevices(),
                [PLANS.PASS]: getDevices(),
                [PLANS.WALLET]: getDevices(),
                [PLANS.FAMILY]: getDevices(),
                [PLANS.DUO]: getDevices(),
                [PLANS.MAIL_PRO]: getDevices(),
                [PLANS.MAIL_BUSINESS]: getDevices(),
                [PLANS.BUNDLE_PRO]: getDevices(),
                [PLANS.BUNDLE_PRO_2024]: getDevices(),
                [PLANS.PASS_PRO]: getDevices(),
                [PLANS.PASS_BUSINESS]: getDevices(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'vaults',
            plans: {
                [PLANS.FREE]: getVaults(FREE_VAULTS),
                [PLANS.BUNDLE]: getVaults(PASS_PLUS_VAULTS),
                [PLANS.MAIL]: getVaults(FREE_VAULTS),
                [PLANS.VPN]: getVaults(FREE_VAULTS),
                [PLANS.DRIVE]: getVaults(FREE_VAULTS),
                [PLANS.DRIVE_BUSINESS]: getVaults(FREE_VAULTS),
                [PLANS.PASS]: getVaults(PASS_PLUS_VAULTS),
                [PLANS.WALLET]: getVaults(FREE_VAULTS),
                [PLANS.FAMILY]: getVaults(PASS_PLUS_VAULTS),
                [PLANS.DUO]: getVaults(PASS_PLUS_VAULTS),
                [PLANS.MAIL_PRO]: getVaults(FREE_VAULTS),
                [PLANS.MAIL_BUSINESS]: getVaults(FREE_VAULTS),
                [PLANS.BUNDLE_PRO]: getVaults(PASS_BIZ_VAULTS),
                [PLANS.BUNDLE_PRO_2024]: getVaults(PASS_BIZ_VAULTS),
                [PLANS.PASS_PRO]: getVaults(PASS_PRO_VAULTS),
                [PLANS.PASS_BUSINESS]: getVaults(PASS_BIZ_VAULTS),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
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
                [PLANS.DRIVE_BUSINESS]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.PASS]: getHideMyEmailAliases('unlimited'),
                [PLANS.WALLET]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.FAMILY]: getHideMyEmailAliases('unlimited'),
                [PLANS.DUO]: getHideMyEmailAliases('unlimited'),
                [PLANS.MAIL_PRO]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.MAIL_BUSINESS]: getHideMyEmailAliases(FREE_PASS_ALIASES),
                [PLANS.BUNDLE_PRO]: getHideMyEmailAliases('unlimited'),
                [PLANS.BUNDLE_PRO_2024]: getHideMyEmailAliases('unlimited'),
                [PLANS.PASS_PRO]: getHideMyEmailAliases('unlimited'),
                [PLANS.PASS_BUSINESS]: getHideMyEmailAliases('unlimited'),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'vault-and-item-sharing',
            plans: {
                [PLANS.FREE]: getVaultSharing(FREE_VAULT_SHARING),
                [PLANS.BUNDLE]: getVaultSharing(PASS_PLUS_VAULT_SHARING),
                [PLANS.MAIL]: getVaultSharing(FREE_VAULT_SHARING),
                [PLANS.VPN]: getVaultSharing(FREE_VAULT_SHARING),
                [PLANS.DRIVE]: getVaultSharing(FREE_VAULT_SHARING),
                [PLANS.DRIVE_BUSINESS]: getVaultSharing(FREE_VAULT_SHARING),
                [PLANS.PASS]: getVaultSharing(PASS_PLUS_VAULT_SHARING),
                [PLANS.WALLET]: getVaultSharing(FREE_VAULT_SHARING),
                [PLANS.FAMILY]: getVaultSharing(PASS_PLUS_VAULT_SHARING),
                [PLANS.DUO]: getVaultSharing(PASS_PLUS_VAULT_SHARING),
                [PLANS.MAIL_PRO]: getVaultSharing(FREE_VAULT_SHARING),
                [PLANS.MAIL_BUSINESS]: getVaultSharing(FREE_VAULT_SHARING),
                [PLANS.BUNDLE_PRO]: getVaultSharing(PASS_PLUS_VAULT_SHARING),
                [PLANS.BUNDLE_PRO_2024]: getVaultSharing(PASS_PLUS_VAULT_SHARING),
                [PLANS.PASS_PRO]: getVaultSharing(PASS_PRO_VAULT_SHARING),
                [PLANS.PASS_BUSINESS]: getVaultSharing(PASS_BIZ_VAULT_SHARING),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
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
                [PLANS.DRIVE_BUSINESS]: get2FAAuthenticator(),
                [PLANS.PASS]: get2FAAuthenticator(true),
                [PLANS.WALLET]: get2FAAuthenticator(),
                [PLANS.FAMILY]: get2FAAuthenticator(true),
                [PLANS.DUO]: get2FAAuthenticator(true),
                [PLANS.MAIL_PRO]: get2FAAuthenticator(),
                [PLANS.MAIL_BUSINESS]: get2FAAuthenticator(),
                [PLANS.BUNDLE_PRO]: get2FAAuthenticator(true),
                [PLANS.BUNDLE_PRO_2024]: get2FAAuthenticator(true),
                [PLANS.PASS_PRO]: get2FAAuthenticator(true),
                [PLANS.PASS_BUSINESS]: get2FAAuthenticator(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'forwarding-mailboxes',
            plans: {
                [PLANS.FREE]: getCustomFields(),
                [PLANS.BUNDLE]: getCustomFields(true),
                [PLANS.MAIL]: getCustomFields(),
                [PLANS.VPN]: getCustomFields(),
                [PLANS.DRIVE]: getCustomFields(),
                [PLANS.DRIVE_BUSINESS]: getCustomFields(),
                [PLANS.PASS]: getCustomFields(true),
                [PLANS.WALLET]: getCustomFields(),
                [PLANS.FAMILY]: getCustomFields(true),
                [PLANS.DUO]: getCustomFields(true),
                [PLANS.MAIL_PRO]: getCustomFields(),
                [PLANS.MAIL_BUSINESS]: getCustomFields(),
                [PLANS.BUNDLE_PRO]: getCustomFields(true),
                [PLANS.BUNDLE_PRO_2024]: getCustomFields(true),
                [PLANS.PASS_PRO]: getCustomFields(true),
                [PLANS.PASS_BUSINESS]: getCustomFields(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'group-management',
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
                [PLANS.WALLET]: null,
                [PLANS.FAMILY]: null,
                [PLANS.DUO]: null,
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: getGroupManagement(),
                [PLANS.PASS_BUSINESS]: getGroupManagement(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
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
                [PLANS.DRIVE_BUSINESS]: getDataBreachMonitoring(),
                [PLANS.PASS]: getDataBreachMonitoring(true),
                [PLANS.WALLET]: getDataBreachMonitoring(),
                [PLANS.FAMILY]: getDataBreachMonitoring(true),
                [PLANS.DUO]: getDataBreachMonitoring(true),
                [PLANS.MAIL_PRO]: getDataBreachMonitoring(),
                [PLANS.MAIL_BUSINESS]: getDataBreachMonitoring(),
                [PLANS.BUNDLE_PRO]: getDataBreachMonitoring(true),
                [PLANS.BUNDLE_PRO_2024]: getDataBreachMonitoring(true),
                [PLANS.PASS_PRO]: getDataBreachMonitoring(true),
                [PLANS.PASS_BUSINESS]: getDataBreachMonitoring(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
    ];
};

export const getPassIdentityFeature = (): PlanCardFeatureDefinition => {
    return {
        text: PASS_APP_NAME,
        tooltip: c('new_plans: tooltip').t`Password management and identity protection`,
        included: true,
        icon: 'brand-proton-pass',
    };
};
