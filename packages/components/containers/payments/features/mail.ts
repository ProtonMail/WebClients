import { c, msgid } from 'ttag';

import { BRAND_NAME, MAIL_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Audience, PlansMap } from '@proton/shared/lib/interfaces';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getMailAppFeature = (): PlanCardFeatureDefinition => {
    return {
        text: MAIL_APP_NAME,
        included: true,
        icon: 'brand-proton-mail',
        tooltip: c('new_plans: tooltip').t`${MAIL_APP_NAME}: end-to-end encrypted email`,
    };
};

export const getNAddressesFeature = ({
    n,
    highlight,
    family,
}: {
    n: number;
    highlight?: boolean;
    family?: boolean;
}): PlanCardFeatureDefinition => {
    const domain = 'proton.me';

    let tooltip = '';
    if (n > 1) {
        tooltip = c('new_plans: tooltip')
            .t`Create multiple email addresses for your online identities, e.g., JohnShopper@${domain} for shopping accounts, JohnNews@${domain} for news subscription`;
    }

    if (family) {
        tooltip = c('new_plans: tooltip')
            .t`Create up to ${n} email addresses/aliases that you can assign to family members. Use them for online identities, e.g., JohnShopper@${domain} for shopping accounts.`;
    }

    return {
        text: c('new_plans: feature').ngettext(msgid`${n} email address`, `${n} email addresses/aliases`, n),
        tooltip,
        included: true,
        highlight,
        icon: 'envelope',
    };
};

export const getNAddressesFeatureB2B = ({
    n,
    highlight,
}: {
    n: number;
    highlight?: boolean;
}): PlanCardFeatureDefinition => {
    const tooltip = c('new_plans: tooltip')
        .t`Addresses have full sending and receiving capability. A user can have multiple addresses assigned to them; however, a single address cannot be assigned to multiple users.`;
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} email address per user`, `${n} email addresses per user`, n),
        tooltip,
        included: true,
        highlight,
        icon: 'envelope',
    };
};

export const getExtraPersonalizationFeature = (): PlanCardFeatureDefinition => ({
    icon: 'checkmark-circle',
    text: c('new_plans: Upsell attribute')
        .t`Add more personalization with 15 email addresses and support for 3 custom email domains`,
    included: true,
});

export const getNMessagesFeature = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    if (n === Number.POSITIVE_INFINITY || n === 'unlimited') {
        return {
            text: c('new_plans: feature').t`Unlimited messages per day`,
            tooltip: c('new_plans: tooltip')
                .t`Bulk promotional or programmatic email sending is currently not supported. We recommend using a dedicated email service provider for this use case.`,
            included: true,
            icon: 'speech-bubble',
        };
    }
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} message per day`, `${n} messages per day`, n),
        included: true,
        icon: 'speech-bubble',
    };
};

export const getB2BNDomainsFeature = (): PlanCardFeatureDefinition => ({
    icon: 'globe',
    text: c('new_plans: Upsell attribute').t`Cover more ground with support for 10 custom email domains`,
    included: true,
});

export const getNDomainsFeature = ({ n, highlight }: { n: number; highlight?: boolean }): PlanCardFeatureDefinition => {
    if (n === 0) {
        return {
            text: c('new_plans: feature').t`Custom email domains`,
            included: false,
            highlight,
            icon: 'globe',
        };
    }
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} custom email domain`, `${n} custom email domains`, n),
        tooltip: c('new_plans: tooltip').t`Use your own custom email domain addresses, e.g., you@yourname.com`,
        included: true,
        highlight,
        icon: 'globe',
    };
};

export const getFoldersAndLabelsFeature = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    if (n === Number.POSITIVE_INFINITY || n === 'unlimited') {
        return {
            text: c('new_plans: feature').t`Unlimited folders, labels, and filters`,
            included: true,
            icon: 'tag',
        };
    }
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} folder and label`, `${n} folders and labels`, n),
        included: true,
        icon: 'tag',
    };
};

const getFolders = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    const tooltip = c('new_plans').t`Keep your inbox organized with folders`;
    if (n === Number.POSITIVE_INFINITY || n === 'unlimited') {
        return {
            text: c('new_plans: feature').t`Unlimited folders`,
            tooltip,
            included: true,
        };
    }
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} folder`, `${n} folders`, n),
        tooltip,
        included: true,
    };
};

const getLabels = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    const tooltip = c('new_plans: tooltip')
        .t`Labels are simple tags you can add to messages to make them easier to find or to apply filters to`;
    if (n === Number.POSITIVE_INFINITY || n === 'unlimited') {
        return {
            text: c('new_plans: feature').t`Unlimited labels`,
            tooltip,
            included: true,
        };
    }
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} label`, `${n} labels`, n),
        tooltip,
        included: true,
    };
};

const getFilters = (n: number | 'unlimited'): PlanCardFeatureDefinition => {
    const tooltip = c('new_plans: tooltip').t`Set up filters to automatically reply to, sort, and/or label your emails`;
    if (n === Number.POSITIVE_INFINITY || n === 'unlimited') {
        return {
            text: c('new_plans: feature').t`Unlimited filters`,
            tooltip,
            included: true,
        };
    }
    return {
        text: c('new_plans: feature').ngettext(msgid`${n} filter`, `${n} filters`, n),
        tooltip,
        included: true,
    };
};

const getAttachments = (): PlanCardFeatureDefinition => {
    const size = humanSize(26214400, undefined, undefined, 0);
    return {
        text: c('new_plans: feature').t`${size} attachment size`,
        included: true,
    };
};

const getSignature = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`HTML signatures`,
        tooltip: c('new_plans: tooltip')
            .t`Personalize your email signature with logos, images, social media icons, links to your contact details, and more`,
        included: true,
    };
};

export const getEndToEndEncryption = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`End-to-end encryption`,
        tooltip: c('new_plans: tooltip')
            .t`Prevents messages from being accessed by ${BRAND_NAME} or third parties. The only people who can read the messages are the sender and the intended recipient.`,
        included: true,
    };
};

export const getEncryptionOutside = (): PlanCardFeatureDefinition => {
    /**
     * Workaround for bug where ttag cannot handle strings where the same variable appears twice
     * https://confluence.protontech.ch/pages/viewpage.action?pageId=64690626#LocalisationonFrontendrulesandbestpractices-Twicesamevariables
     */
    const MAIL_APP_NAME_TWO = MAIL_APP_NAME;

    return {
        text: c('new_plans: feature').t`Password-protected Emails`,
        tooltip: c('new_plans: tooltip')
            .t`When sending to other ${MAIL_APP_NAME} users, encryption is automatic. Sending to non-${MAIL_APP_NAME_TWO} users requires setting a password prior to sending.`,
        included: true,
    };
};

const getEncryptedContacts = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Encrypted contact details`,
        tooltip: c('new_plans: tooltip')
            .t`Securely store your contacts’ details, such as phone number, address, birthday, and personal notes. Zero-access encryption ensures even ${BRAND_NAME} can't access them.`,
        included: true,
    };
};

const getContactGroups = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Contact groups`,
        tooltip: c('new_plans: tooltip')
            .t`Send emails to large groups quickly and easily by creating as many contact groups as you need (up to 100 contacts per group)`,
        included,
    };
};

export const getContactGroupsManagement = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Contact groups management`,
        included: true,
        icon: 'users',
    };
};

const getSMTP = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Email client support (via IMAP/SMTP)`,
        tooltip: c('new_plans: tooltip')
            .t`IMAP support is limited to the use of desktop apps (e.g., Outlook, Apple Mail, Thunderbird) via ${MAIL_APP_NAME} Bridge. Cloud-based IMAP integrations are currently not supported.`,
        included,
    };
};

const getAutoReply = (included: boolean, audience?: Audience): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Auto-reply`,
        tooltip:
            audience === Audience.B2B
                ? c('new_plans: tooltip').t`Quickly set up out-of-office messages`
                : c('new_plans: tooltip')
                      .t`Allows you to set up automatic responses (auto-reply) for your incoming messages`,
        included,
    };
};

const getCatchAll = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Catch-all`,
        tooltip: c('new_plans: tooltip')
            .t`Ensures you receive all emails sent to your domain, even if the email address doesn't exist, no longer exists, or has a typo`,
        included,
    };
};

export const getMailFeatures = (plansMap: PlansMap): PlanCardFeature[] => {
    return [
        {
            name: 'addresses',
            plans: {
                [PLANS.FREE]: getNAddressesFeature({ n: 1 }),
                [PLANS.BUNDLE]: getNAddressesFeature({ n: plansMap[PLANS.BUNDLE]?.MaxAddresses || 15 }),
                [PLANS.MAIL]: getNAddressesFeature({ n: plansMap[PLANS.MAIL]?.MaxAddresses || 10 }),
                [PLANS.VPN]: getNAddressesFeature({ n: plansMap[PLANS.VPN]?.MaxAddresses || 1 }),
                [PLANS.DRIVE]: getNAddressesFeature({ n: plansMap[PLANS.DRIVE]?.MaxAddresses || 1 }),
                [PLANS.PASS_PLUS]: getNAddressesFeature({ n: plansMap[PLANS.PASS_PLUS]?.MaxAddresses || 1 }),
                [PLANS.FAMILY]: getNAddressesFeature({
                    n: plansMap[PLANS.FAMILY]?.MaxAddresses || 75,
                    family: true,
                }),
                [PLANS.MAIL_PRO]: getNAddressesFeatureB2B({ n: plansMap[PLANS.MAIL_PRO]?.MaxAddresses || 10 }),
                [PLANS.BUNDLE_PRO]: getNAddressesFeatureB2B({
                    n: plansMap[PLANS.BUNDLE_PRO]?.MaxAddresses || 15,
                }),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'domains',
            plans: {
                [PLANS.FREE]: getNDomainsFeature({ n: 0 }),
                [PLANS.BUNDLE]: getNDomainsFeature({ n: plansMap[PLANS.BUNDLE]?.MaxDomains ?? 3 }),
                [PLANS.MAIL]: getNDomainsFeature({ n: plansMap[PLANS.MAIL]?.MaxDomains ?? 1 }),
                [PLANS.VPN]: getNDomainsFeature({ n: plansMap[PLANS.VPN]?.MaxDomains ?? 0 }),
                [PLANS.DRIVE]: getNDomainsFeature({ n: plansMap[PLANS.DRIVE]?.MaxDomains ?? 0 }),
                [PLANS.PASS_PLUS]: getNDomainsFeature({ n: plansMap[PLANS.PASS_PLUS]?.MaxDomains ?? 0 }),
                [PLANS.FAMILY]: getNDomainsFeature({ n: plansMap[PLANS.FAMILY]?.MaxDomains ?? 5 }),
                [PLANS.MAIL_PRO]: getNDomainsFeature({ n: plansMap[PLANS.MAIL_PRO]?.MaxDomains ?? 3 }),
                [PLANS.BUNDLE_PRO]: getNDomainsFeature({ n: plansMap[PLANS.BUNDLE_PRO]?.MaxDomains ?? 10 }),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'messages',
            plans: {
                [PLANS.FREE]: getNMessagesFeature(150),
                [PLANS.BUNDLE]: getNMessagesFeature('unlimited'),
                [PLANS.MAIL]: getNMessagesFeature('unlimited'),
                [PLANS.VPN]: getNMessagesFeature('unlimited'),
                [PLANS.DRIVE]: getNMessagesFeature(150),
                [PLANS.PASS_PLUS]: getNMessagesFeature(150),
                [PLANS.FAMILY]: getNMessagesFeature('unlimited'),
                [PLANS.MAIL_PRO]: getNMessagesFeature('unlimited'),
                [PLANS.BUNDLE_PRO]: getNMessagesFeature('unlimited'),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'folders',
            plans: {
                [PLANS.FREE]: getFolders(3),
                [PLANS.BUNDLE]: getFolders('unlimited'),
                [PLANS.MAIL]: getFolders('unlimited'),
                [PLANS.VPN]: getFolders(3),
                [PLANS.DRIVE]: getFolders(3),
                [PLANS.PASS_PLUS]: getFolders(3),
                [PLANS.FAMILY]: getFolders('unlimited'),
                [PLANS.MAIL_PRO]: getFolders('unlimited'),
                [PLANS.BUNDLE_PRO]: getFolders('unlimited'),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'labels',
            plans: {
                [PLANS.FREE]: getLabels(3),
                [PLANS.BUNDLE]: getLabels('unlimited'),
                [PLANS.MAIL]: getLabels('unlimited'),
                [PLANS.VPN]: getLabels(3),
                [PLANS.DRIVE]: getLabels(3),
                [PLANS.PASS_PLUS]: getLabels(3),
                [PLANS.FAMILY]: getLabels('unlimited'),
                [PLANS.MAIL_PRO]: getLabels('unlimited'),
                [PLANS.BUNDLE_PRO]: getLabels('unlimited'),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'filters',
            plans: {
                [PLANS.FREE]: getFilters(1),
                [PLANS.BUNDLE]: getFilters('unlimited'),
                [PLANS.MAIL]: getFilters('unlimited'),
                [PLANS.VPN]: getFilters(1),
                [PLANS.DRIVE]: getFilters(1),
                [PLANS.PASS_PLUS]: getFilters(1),
                [PLANS.FAMILY]: getFilters('unlimited'),
                [PLANS.MAIL_PRO]: getFilters('unlimited'),
                [PLANS.BUNDLE_PRO]: getFilters('unlimited'),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'attachments',
            plans: {
                [PLANS.FREE]: getAttachments(),
                [PLANS.BUNDLE]: getAttachments(),
                [PLANS.MAIL]: getAttachments(),
                [PLANS.VPN]: getAttachments(),
                [PLANS.DRIVE]: getAttachments(),
                [PLANS.PASS_PLUS]: getAttachments(),
                [PLANS.FAMILY]: getAttachments(),
                [PLANS.MAIL_PRO]: getAttachments(),
                [PLANS.BUNDLE_PRO]: getAttachments(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'signature',
            plans: {
                [PLANS.FREE]: getSignature(),
                [PLANS.BUNDLE]: getSignature(),
                [PLANS.MAIL]: getSignature(),
                [PLANS.VPN]: getSignature(),
                [PLANS.DRIVE]: getSignature(),
                [PLANS.PASS_PLUS]: getSignature(),
                [PLANS.FAMILY]: getSignature(),
                [PLANS.MAIL_PRO]: getSignature(),
                [PLANS.BUNDLE_PRO]: getSignature(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'encryption',
            plans: {
                [PLANS.FREE]: getEndToEndEncryption(),
                [PLANS.BUNDLE]: getEndToEndEncryption(),
                [PLANS.MAIL]: getEndToEndEncryption(),
                [PLANS.VPN]: getEndToEndEncryption(),
                [PLANS.DRIVE]: getEndToEndEncryption(),
                [PLANS.PASS_PLUS]: getEndToEndEncryption(),
                [PLANS.FAMILY]: getEndToEndEncryption(),
                [PLANS.MAIL_PRO]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO]: getEndToEndEncryption(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'eo',
            plans: {
                [PLANS.FREE]: getEncryptionOutside(),
                [PLANS.BUNDLE]: getEncryptionOutside(),
                [PLANS.MAIL]: getEncryptionOutside(),
                [PLANS.VPN]: getEncryptionOutside(),
                [PLANS.DRIVE]: getEncryptionOutside(),
                [PLANS.PASS_PLUS]: getEncryptionOutside(),
                [PLANS.FAMILY]: getEncryptionOutside(),
                [PLANS.MAIL_PRO]: getEncryptionOutside(),
                [PLANS.BUNDLE_PRO]: getEncryptionOutside(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'contacts',
            plans: {
                [PLANS.FREE]: getEncryptedContacts(),
                [PLANS.BUNDLE]: getEncryptedContacts(),
                [PLANS.MAIL]: getEncryptedContacts(),
                [PLANS.VPN]: getEncryptedContacts(),
                [PLANS.DRIVE]: getEncryptedContacts(),
                [PLANS.PASS_PLUS]: getEncryptedContacts(),
                [PLANS.FAMILY]: getEncryptedContacts(),
                [PLANS.MAIL_PRO]: getEncryptedContacts(),
                [PLANS.BUNDLE_PRO]: getEncryptedContacts(),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'contact-groups',
            plans: {
                [PLANS.FREE]: getContactGroups(false),
                [PLANS.BUNDLE]: getContactGroups(true),
                [PLANS.MAIL]: getContactGroups(true),
                [PLANS.VPN]: getContactGroups(false),
                [PLANS.DRIVE]: getContactGroups(false),
                [PLANS.PASS_PLUS]: getContactGroups(false),
                [PLANS.FAMILY]: getContactGroups(true),
                [PLANS.MAIL_PRO]: getContactGroups(true),
                [PLANS.BUNDLE_PRO]: getContactGroups(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'smtp',
            plans: {
                [PLANS.FREE]: getSMTP(false),
                [PLANS.BUNDLE]: getSMTP(true),
                [PLANS.MAIL]: getSMTP(true),
                [PLANS.VPN]: getSMTP(false),
                [PLANS.DRIVE]: getSMTP(false),
                [PLANS.PASS_PLUS]: getSMTP(false),
                [PLANS.FAMILY]: getSMTP(true),
                [PLANS.MAIL_PRO]: getSMTP(true),
                [PLANS.BUNDLE_PRO]: getSMTP(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'auto-reply',
            plans: {
                [PLANS.FREE]: getAutoReply(false),
                [PLANS.BUNDLE]: getAutoReply(true),
                [PLANS.MAIL]: getAutoReply(true),
                [PLANS.VPN]: getAutoReply(false),
                [PLANS.DRIVE]: getAutoReply(false),
                [PLANS.PASS_PLUS]: getAutoReply(false),
                [PLANS.FAMILY]: getAutoReply(true),
                [PLANS.MAIL_PRO]: getAutoReply(true, Audience.B2B),
                [PLANS.BUNDLE_PRO]: getAutoReply(true, Audience.B2B),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'catch-all',
            plans: {
                [PLANS.FREE]: getCatchAll(false),
                [PLANS.BUNDLE]: getCatchAll(true),
                [PLANS.MAIL]: getCatchAll(true),
                [PLANS.VPN]: getCatchAll(false),
                [PLANS.DRIVE]: getCatchAll(false),
                [PLANS.PASS_PLUS]: getCatchAll(false),
                [PLANS.FAMILY]: getCatchAll(true),
                [PLANS.MAIL_PRO]: getCatchAll(true),
                [PLANS.BUNDLE_PRO]: getCatchAll(true),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
    ];
};
