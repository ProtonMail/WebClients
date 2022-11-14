import { c, msgid } from 'ttag';

import { BRAND_NAME, MAIL_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Audience, PlansMap } from '@proton/shared/lib/interfaces';

import { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getNAddressesFeature = ({ n, fire }: { n: number; fire?: boolean }): PlanCardFeatureDefinition => {
    let tooltip = '';
    if (n > 1) {
        tooltip = c('new_plans: tooltip')
            .t`Create multiple email addresses for your online identities, e.g., JohnShopper@proton.me for shopping accounts, JohnNews@proton.me for news subscription`;
    }
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} email address`, `${n} email addresses/aliases`, n),
        tooltip,
        included: true,
        fire,
        icon: 'envelope',
    };
};

export const getNAddressesFeatureB2B = ({ n, fire }: { n: number; fire?: boolean }): PlanCardFeatureDefinition => {
    const tooltip = c('new_plans: tooltip')
        .t`Addresses have full sending and receiving capability. A user can have multiple addresses assigned to them; however, a single address cannot be assigned to multiple users.`;
    return {
        featureName: c('new_plans: feature').ngettext(
            msgid`${n} email address per user`,
            `${n} email addresses per user`,
            n
        ),
        tooltip,
        included: true,
        fire,
        icon: 'envelope',
    };
};

export const getNMessagesFeature = (n: number): PlanCardFeatureDefinition => {
    if (n === Number.POSITIVE_INFINITY) {
        return {
            featureName: c('new_plans: feature').t`Unlimited messages per day`,
            tooltip: c('new_plans: tooltip')
                .t`Bulk promotional or programmatic email sending is currently not supported. We recommend using a dedicated email service provider for this use case.`,
            included: true,
            icon: 'speech-bubble',
        };
    }
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} message per day`, `${n} messages per day`, n),
        tooltip: '',
        included: true,
        icon: 'speech-bubble',
    };
};

export const getNDomainsFeature = ({ n, fire }: { n: number; fire?: boolean }): PlanCardFeatureDefinition => {
    if (n === 0) {
        return {
            featureName: c('new_plans: feature').t`Custom email domains`,
            tooltip: '',
            included: false,
            fire,
            icon: 'globe',
        };
    }
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} custom email domain`, `${n} custom email domains`, n),
        tooltip: c('new_plans: tooltip').t`Use your own custom email domain addresses, e.g., you@yourname.com`,
        included: true,
        fire,
        icon: 'globe',
    };
};

export const getFoldersAndLabelsFeature = (n: number): PlanCardFeatureDefinition => {
    if (n === Number.POSITIVE_INFINITY) {
        return {
            featureName: c('new_plans: feature').t`Unlimited folders, labels and filters`,
            tooltip: '',
            included: true,
            icon: 'tag',
        };
    }
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} folder and label`, `${n} folders and labels`, n),
        tooltip: '',
        included: true,
        icon: 'tag',
    };
};

const getFolders = (n: number): PlanCardFeatureDefinition => {
    const tooltip = c('new_plans').t`Keep your inbox organized with folders`;
    if (n === Number.POSITIVE_INFINITY) {
        return {
            featureName: c('new_plans: feature').t`Unlimited folders`,
            tooltip,
            included: true,
        };
    }
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} folder`, `${n} folders`, n),
        tooltip,
        included: true,
    };
};

const getLabels = (n: number): PlanCardFeatureDefinition => {
    const tooltip = c('new_plans: tooltip')
        .t`Labels are simple tags you can add to messages to make them easier to find or to apply filters to`;
    if (n === Number.POSITIVE_INFINITY) {
        return {
            featureName: c('new_plans: feature').t`Unlimited labels`,
            tooltip,
            included: true,
        };
    }
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} label`, `${n} labels`, n),
        tooltip,
        included: true,
    };
};

const getFilters = (n: number): PlanCardFeatureDefinition => {
    const tooltip = c('new_plans: tooltip').t`Set up filters to automatically reply to, sort, and/or label your emails`;
    if (n === Number.POSITIVE_INFINITY) {
        return {
            featureName: c('new_plans: feature').t`Unlimited filters`,
            tooltip,
            included: true,
        };
    }
    return {
        featureName: c('new_plans: feature').ngettext(msgid`${n} filter`, `${n} filters`, n),
        tooltip,
        included: true,
    };
};

const getAttachments = (): PlanCardFeatureDefinition => {
    const size = humanSize(26214400, undefined, undefined, 0);
    return {
        featureName: c('new_plans: feature').t`${size} attachment size`,
        tooltip: '',
        included: true,
    };
};

const getSignature = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`HTML signatures`,
        tooltip: c('new_plans: tooltip')
            .t`Personalize your email signature with logos, images, social media icons, links to your contact details, and more`,
        included: true,
    };
};

export const getEndToEndEncryption = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`End-to-end encryption`,
        tooltip: c('new_plans: tooltip')
            .t`Prevents messages from being accessed by ${BRAND_NAME} or third parties. The only people who can read the messages are the sender and the intended recipient.`,
        included: true,
    };
};

export const getEncryptionOutside = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Password-protected Emails`,
        tooltip: c('new_plans: tooltip')
            .t`When sending to other ${MAIL_APP_NAME} users, encryption is automatic. Sending to non-${MAIL_APP_NAME} users requires setting a password prior to sending.`,
        included: true,
    };
};

const getEncryptedContacts = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Encrypted contact details`,
        tooltip: c('new_plans: tooltip')
            .t`Securely store your contacts’ details, such as phone number, address, birthday, and personal notes. Zero-access encryption ensures even ${BRAND_NAME} can't access them.`,
        included: true,
    };
};

const getContactGroups = (included: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Contact groups`,
        tooltip: c('new_plans: tooltip')
            .t`Send emails to large groups quickly and easily by creating as many contact groups as you need (up to 100 contacts per group)`,
        included,
    };
};

export const getContactGroupsManagement = (): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Contact groups management`,
        tooltip: '',
        included: true,
        icon: 'users',
    };
};

const getSMTP = (included: boolean): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Email client support (via IMAP/SMTP)`,
        tooltip: c('new_plans: tooltip')
            .t`IMAP support is limited to the use of desktop apps (e.g., Outlook, Apple Mail, Thunderbird) via ${MAIL_APP_NAME} Bridge. Cloud-based IMAP integrations are currently not supported.`,
        included,
    };
};

const getAutoReply = (included: boolean, audience?: Audience): PlanCardFeatureDefinition => {
    return {
        featureName: c('new_plans: feature').t`Auto-reply`,
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
        featureName: c('new_plans: feature').t`Catch-all`,
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
                [PLANS.BUNDLE]: getNAddressesFeature({ n: plansMap[PLANS.BUNDLE]?.MaxAddresses || 15, fire: true }),
                [PLANS.MAIL]: getNAddressesFeature({ n: plansMap[PLANS.MAIL]?.MaxAddresses || 10 }),
                [PLANS.VPN]: getNAddressesFeature({ n: plansMap[PLANS.VPN]?.MaxAddresses || 1 }),
                [PLANS.DRIVE]: getNAddressesFeature({ n: plansMap[PLANS.DRIVE]?.MaxAddresses || 1 }),
                [PLANS.FAMILY]: getNAddressesFeature({ n: plansMap[PLANS.FAMILY]?.MaxAddresses || 75 }),
                [PLANS.MAIL_PRO]: getNAddressesFeatureB2B({ n: plansMap[PLANS.MAIL_PRO]?.MaxAddresses || 10 }),
                [PLANS.BUNDLE_PRO]: getNAddressesFeatureB2B({
                    n: plansMap[PLANS.BUNDLE_PRO]?.MaxAddresses || 15,
                    fire: true,
                }),
            },
        },
        {
            name: 'domains',
            plans: {
                [PLANS.FREE]: getNDomainsFeature({ n: 0 }),
                [PLANS.BUNDLE]: getNDomainsFeature({ n: plansMap[PLANS.BUNDLE]?.MaxDomains ?? 3, fire: true }),
                [PLANS.MAIL]: getNDomainsFeature({ n: plansMap[PLANS.MAIL]?.MaxDomains ?? 1 }),
                [PLANS.VPN]: getNDomainsFeature({ n: plansMap[PLANS.VPN]?.MaxDomains ?? 0 }),
                [PLANS.DRIVE]: getNDomainsFeature({ n: plansMap[PLANS.DRIVE]?.MaxDomains ?? 0 }),
                [PLANS.FAMILY]: getNDomainsFeature({ n: plansMap[PLANS.FAMILY]?.MaxDomains ?? 5 }),
                [PLANS.MAIL_PRO]: getNDomainsFeature({ n: plansMap[PLANS.MAIL_PRO]?.MaxDomains ?? 3 }),
                [PLANS.BUNDLE_PRO]: getNDomainsFeature({ n: plansMap[PLANS.BUNDLE_PRO]?.MaxDomains ?? 10, fire: true }),
            },
        },
        {
            name: 'messages',
            plans: {
                [PLANS.FREE]: getNMessagesFeature(150),
                [PLANS.BUNDLE]: getNMessagesFeature(Number.POSITIVE_INFINITY),
                [PLANS.MAIL]: getNMessagesFeature(Number.POSITIVE_INFINITY),
                [PLANS.VPN]: getNMessagesFeature(Number.POSITIVE_INFINITY),
                [PLANS.DRIVE]: getNMessagesFeature(150),
                [PLANS.FAMILY]: getNMessagesFeature(Number.POSITIVE_INFINITY),
                [PLANS.MAIL_PRO]: getNMessagesFeature(Number.POSITIVE_INFINITY),
                [PLANS.BUNDLE_PRO]: getNMessagesFeature(Number.POSITIVE_INFINITY),
            },
        },
        {
            name: 'folders',
            plans: {
                [PLANS.FREE]: getFolders(3),
                [PLANS.BUNDLE]: getFolders(Number.POSITIVE_INFINITY),
                [PLANS.MAIL]: getFolders(Number.POSITIVE_INFINITY),
                [PLANS.VPN]: getFolders(3),
                [PLANS.DRIVE]: getFolders(3),
                [PLANS.FAMILY]: getFolders(Number.POSITIVE_INFINITY),
                [PLANS.MAIL_PRO]: getFolders(Number.POSITIVE_INFINITY),
                [PLANS.BUNDLE_PRO]: getFolders(Number.POSITIVE_INFINITY),
            },
        },
        {
            name: 'labels',
            plans: {
                [PLANS.FREE]: getLabels(3),
                [PLANS.BUNDLE]: getLabels(Number.POSITIVE_INFINITY),
                [PLANS.MAIL]: getLabels(Number.POSITIVE_INFINITY),
                [PLANS.VPN]: getLabels(3),
                [PLANS.DRIVE]: getLabels(3),
                [PLANS.FAMILY]: getLabels(Number.POSITIVE_INFINITY),
                [PLANS.MAIL_PRO]: getLabels(Number.POSITIVE_INFINITY),
                [PLANS.BUNDLE_PRO]: getLabels(Number.POSITIVE_INFINITY),
            },
        },
        {
            name: 'filters',
            plans: {
                [PLANS.FREE]: getFilters(1),
                [PLANS.BUNDLE]: getFilters(Number.POSITIVE_INFINITY),
                [PLANS.MAIL]: getFilters(Number.POSITIVE_INFINITY),
                [PLANS.VPN]: getFilters(1),
                [PLANS.DRIVE]: getFilters(1),
                [PLANS.FAMILY]: getFilters(Number.POSITIVE_INFINITY),
                [PLANS.MAIL_PRO]: getFilters(Number.POSITIVE_INFINITY),
                [PLANS.BUNDLE_PRO]: getFilters(Number.POSITIVE_INFINITY),
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
                [PLANS.FAMILY]: getAttachments(),
                [PLANS.MAIL_PRO]: getAttachments(),
                [PLANS.BUNDLE_PRO]: getAttachments(),
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
                [PLANS.FAMILY]: getSignature(),
                [PLANS.MAIL_PRO]: getSignature(),
                [PLANS.BUNDLE_PRO]: getSignature(),
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
                [PLANS.FAMILY]: getEndToEndEncryption(),
                [PLANS.MAIL_PRO]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO]: getEndToEndEncryption(),
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
                [PLANS.FAMILY]: getEncryptionOutside(),
                [PLANS.MAIL_PRO]: getEncryptionOutside(),
                [PLANS.BUNDLE_PRO]: getEncryptionOutside(),
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
                [PLANS.FAMILY]: getEncryptedContacts(),
                [PLANS.MAIL_PRO]: getEncryptedContacts(),
                [PLANS.BUNDLE_PRO]: getEncryptedContacts(),
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
                [PLANS.FAMILY]: getContactGroups(true),
                [PLANS.MAIL_PRO]: getContactGroups(true),
                [PLANS.BUNDLE_PRO]: getContactGroups(true),
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
                [PLANS.FAMILY]: getSMTP(true),
                [PLANS.MAIL_PRO]: getSMTP(true),
                [PLANS.BUNDLE_PRO]: getSMTP(true),
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
                [PLANS.FAMILY]: getAutoReply(true),
                [PLANS.MAIL_PRO]: getAutoReply(true, Audience.B2B),
                [PLANS.BUNDLE_PRO]: getAutoReply(true, Audience.B2B),
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
                [PLANS.FAMILY]: getCatchAll(true),
                [PLANS.MAIL_PRO]: getCatchAll(true),
                [PLANS.BUNDLE_PRO]: getCatchAll(true),
            },
        },
    ];
};
