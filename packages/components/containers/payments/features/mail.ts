import { c, msgid } from 'ttag';

import { BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { PlansMap } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';

import type { PlanCardFeature, PlanCardFeatureDefinition } from './interface';

export const getMailAppFeature = (): PlanCardFeatureDefinition => {
    return {
        text: MAIL_APP_NAME,
        included: true,
        icon: 'brand-proton-mail',
        tooltip: c('new_plans: tooltip')
            .t`${MAIL_APP_NAME}: Secure your emails with end-to-end encryption. Includes support for custom email domains, 15 email addresses, unlimited hide-my-email aliases, and more.`,
    };
};

export const getNAddressesFeature = ({
    n,
    highlight,
    family,
    duo,
}: {
    n: number;
    highlight?: boolean;
    family?: boolean;
    duo?: boolean;
}): PlanCardFeatureDefinition => {
    const domain = 'proton.me';

    let tooltip = '';
    if (n > 1) {
        tooltip = c('new_plans: tooltip')
            .t`Create multiple email addresses for your online identities, e.g., JohnShopper@${domain} for shopping accounts, JohnNews@${domain} for news subscription`;
    }

    if (family || duo) {
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

export const getCustomSecureMailB2B = (): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Custom and secure business email`,
        included: true,
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

export const getB2BNDomainsFeature = (n: number): PlanCardFeatureDefinition => ({
    icon: 'globe',
    text: c('new_plans: Upsell attribute').t`Support for ${n} custom email domains`,
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
    const size = humanSize({ bytes: 26214400, fraction: 0 });
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

export const getSMTPToken = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: included
            ? c('new_plans: feature').t`SMTP submission for select organizations`
            : c('new_plans: feature').t`SMTP submission`,
        tooltip: c('new_plans: tooltip')
            .t`SMTP allows 3rd-party services or devices to send email through ${MAIL_APP_NAME}.`,
        included,
        iconUrl: getKnowledgeBaseUrl('/smtp-submission'),
        icon: 'envelopes',
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

const getAutoForwarding = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Automatic email forwarding`,
        tooltip: c('new_plans: tooltip')
            .t`Automatically forward emails sent to your ${MAIL_APP_NAME} account to any other email address.`,
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

const getAutoDeleteSpamAndTrash = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Auto-delete Spam and Trash`,
        tooltip: c('new_plans: tooltip').t`Automatically clear out messages older than 30 days from Trash and Spam`,
        included,
    };
};

const getScheduleAndSnooze = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Schedule and snooze emails for any time`,
        tooltip: c('new_plans: tooltip')
            .t`Choose custom times to be reminded about an email or for your message to arrive`,
        included,
    };
};

const getDesktopApp = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Desktop app`,
        tooltip: c('new_plans: tooltip')
            .t`Access ${MAIL_APP_NAME} and ${CALENDAR_APP_NAME} from the convenience of your desktop`,
        included,
    };
};

const getEmailDistributionLists = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`Email groups`,
        tooltip: c('new_plans: tooltip').t`Email everyone in a group with a single email address`,
        included,
    };
};

export const getProtonScribe = (included: boolean): PlanCardFeatureDefinition => {
    return {
        text: c('new_plans: feature').t`${BRAND_NAME} Scribe writing assistant`,
        icon: 'magic-wand',
        included,
    };
};

export const getMailFeatures = (plansMap: PlansMap, canAccessDistributionListFeature: boolean): PlanCardFeature[] => {
    return [
        {
            name: 'addresses',
            plans: {
                [PLANS.FREE]: getNAddressesFeature({ n: 1 }),
                [PLANS.BUNDLE]: getNAddressesFeature({ n: plansMap[PLANS.BUNDLE]?.MaxAddresses || 15 }),
                [PLANS.MAIL]: getNAddressesFeature({ n: plansMap[PLANS.MAIL]?.MaxAddresses || 10 }),
                [PLANS.VPN]: getNAddressesFeature({ n: plansMap[PLANS.VPN]?.MaxAddresses || 1 }),
                [PLANS.DRIVE]: getNAddressesFeature({ n: plansMap[PLANS.DRIVE]?.MaxAddresses || 1 }),
                [PLANS.DRIVE_BUSINESS]: getNAddressesFeature({ n: plansMap[PLANS.DRIVE_BUSINESS]?.MaxAddresses || 1 }),
                [PLANS.PASS]: getNAddressesFeature({ n: plansMap[PLANS.PASS]?.MaxAddresses || 1 }),
                [PLANS.WALLET]: getNAddressesFeature({ n: plansMap[PLANS.WALLET]?.MaxAddresses || 1 }),
                [PLANS.FAMILY]: getNAddressesFeature({
                    n: plansMap[PLANS.FAMILY]?.MaxAddresses || 75,
                    family: true,
                }),
                [PLANS.DUO]: getNAddressesFeature({
                    n: plansMap[PLANS.DUO]?.MaxAddresses || 75,
                    family: true,
                }),
                [PLANS.MAIL_PRO]: getNAddressesFeatureB2B({ n: plansMap[PLANS.MAIL_PRO]?.MaxAddresses || 10 }),
                [PLANS.MAIL_BUSINESS]: getNAddressesFeatureB2B({
                    n: plansMap[PLANS.MAIL_BUSINESS]?.MaxAddresses || 15,
                }),
                [PLANS.BUNDLE_PRO]: getNAddressesFeatureB2B({
                    n: plansMap[PLANS.BUNDLE_PRO]?.MaxAddresses || 20,
                }),
                [PLANS.BUNDLE_PRO_2024]: getNAddressesFeatureB2B({
                    n: plansMap[PLANS.BUNDLE_PRO_2024]?.MaxAddresses || 20,
                }),
                [PLANS.PASS_PRO]: getNAddressesFeature({ n: plansMap[PLANS.PASS_PRO]?.MaxAddresses || 1 }),
                [PLANS.PASS_BUSINESS]: getNAddressesFeature({ n: plansMap[PLANS.PASS_BUSINESS]?.MaxAddresses || 1 }),
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
                [PLANS.DRIVE_BUSINESS]: getNDomainsFeature({ n: plansMap[PLANS.DRIVE_BUSINESS]?.MaxDomains ?? 0 }),
                [PLANS.PASS]: getNDomainsFeature({ n: plansMap[PLANS.PASS]?.MaxDomains ?? 0 }),
                [PLANS.WALLET]: getNDomainsFeature({ n: plansMap[PLANS.WALLET]?.MaxDomains ?? 0 }),
                [PLANS.FAMILY]: getNDomainsFeature({ n: plansMap[PLANS.FAMILY]?.MaxDomains ?? 5 }),
                [PLANS.DUO]: getNDomainsFeature({ n: plansMap[PLANS.DUO]?.MaxDomains ?? 5 }),
                [PLANS.MAIL_PRO]: getNDomainsFeature({ n: plansMap[PLANS.MAIL_PRO]?.MaxDomains ?? 3 }),
                [PLANS.MAIL_BUSINESS]: getNDomainsFeature({ n: plansMap[PLANS.MAIL_BUSINESS]?.MaxDomains ?? 10 }),
                [PLANS.BUNDLE_PRO]: getNDomainsFeature({ n: plansMap[PLANS.BUNDLE_PRO]?.MaxDomains ?? 15 }),
                [PLANS.BUNDLE_PRO_2024]: getNDomainsFeature({ n: plansMap[PLANS.BUNDLE_PRO_2024]?.MaxDomains ?? 15 }),
                [PLANS.PASS_PRO]: getNDomainsFeature({ n: plansMap[PLANS.PASS_PRO]?.MaxDomains ?? 0 }),
                [PLANS.PASS_BUSINESS]: getNDomainsFeature({ n: plansMap[PLANS.PASS_BUSINESS]?.MaxDomains ?? 0 }),
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
                [PLANS.DRIVE_BUSINESS]: getNMessagesFeature(150),
                [PLANS.PASS]: getNMessagesFeature(150),
                [PLANS.WALLET]: getNMessagesFeature(150),
                [PLANS.FAMILY]: getNMessagesFeature('unlimited'),
                [PLANS.DUO]: getNMessagesFeature('unlimited'),
                [PLANS.MAIL_PRO]: getNMessagesFeature('unlimited'),
                [PLANS.MAIL_BUSINESS]: getNMessagesFeature('unlimited'),
                [PLANS.BUNDLE_PRO]: getNMessagesFeature('unlimited'),
                [PLANS.BUNDLE_PRO_2024]: getNMessagesFeature('unlimited'),
                [PLANS.PASS_PRO]: getNMessagesFeature(150),
                [PLANS.PASS_BUSINESS]: getNMessagesFeature(150),
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
                [PLANS.DRIVE_BUSINESS]: getFolders(3),
                [PLANS.PASS]: getFolders(3),
                [PLANS.WALLET]: getFolders(3),
                [PLANS.FAMILY]: getFolders('unlimited'),
                [PLANS.DUO]: getFolders('unlimited'),
                [PLANS.MAIL_PRO]: getFolders('unlimited'),
                [PLANS.MAIL_BUSINESS]: getFolders('unlimited'),
                [PLANS.BUNDLE_PRO]: getFolders('unlimited'),
                [PLANS.BUNDLE_PRO_2024]: getFolders('unlimited'),
                [PLANS.PASS_PRO]: getFolders(3),
                [PLANS.PASS_BUSINESS]: getFolders(3),
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
                [PLANS.DRIVE_BUSINESS]: getLabels(3),
                [PLANS.PASS]: getLabels(3),
                [PLANS.WALLET]: getLabels(3),
                [PLANS.FAMILY]: getLabels('unlimited'),
                [PLANS.DUO]: getLabels('unlimited'),
                [PLANS.MAIL_PRO]: getLabels('unlimited'),
                [PLANS.MAIL_BUSINESS]: getLabels('unlimited'),
                [PLANS.BUNDLE_PRO]: getLabels('unlimited'),
                [PLANS.BUNDLE_PRO_2024]: getLabels('unlimited'),
                [PLANS.PASS_PRO]: getLabels(3),
                [PLANS.PASS_BUSINESS]: getLabels(3),
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
                [PLANS.DRIVE_BUSINESS]: getFilters(1),
                [PLANS.PASS]: getFilters(1),
                [PLANS.WALLET]: getFilters(1),
                [PLANS.FAMILY]: getFilters('unlimited'),
                [PLANS.DUO]: getFilters('unlimited'),
                [PLANS.MAIL_PRO]: getFilters('unlimited'),
                [PLANS.MAIL_BUSINESS]: getFilters('unlimited'),
                [PLANS.BUNDLE_PRO]: getFilters('unlimited'),
                [PLANS.BUNDLE_PRO_2024]: getFilters('unlimited'),
                [PLANS.PASS_PRO]: getFilters(1),
                [PLANS.PASS_BUSINESS]: getFilters(1),
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
                [PLANS.DRIVE_BUSINESS]: getAttachments(),
                [PLANS.PASS]: getAttachments(),
                [PLANS.WALLET]: getAttachments(),
                [PLANS.FAMILY]: getAttachments(),
                [PLANS.DUO]: getAttachments(),
                [PLANS.MAIL_PRO]: getAttachments(),
                [PLANS.MAIL_BUSINESS]: getAttachments(),
                [PLANS.BUNDLE_PRO]: getAttachments(),
                [PLANS.BUNDLE_PRO_2024]: getAttachments(),
                [PLANS.PASS_PRO]: getAttachments(),
                [PLANS.PASS_BUSINESS]: getAttachments(),
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
                [PLANS.DRIVE_BUSINESS]: getSignature(),
                [PLANS.PASS]: getSignature(),
                [PLANS.WALLET]: getSignature(),
                [PLANS.FAMILY]: getSignature(),
                [PLANS.DUO]: getSignature(),
                [PLANS.MAIL_PRO]: getSignature(),
                [PLANS.MAIL_BUSINESS]: getSignature(),
                [PLANS.BUNDLE_PRO]: getSignature(),
                [PLANS.BUNDLE_PRO_2024]: getSignature(),
                [PLANS.PASS_PRO]: getSignature(),
                [PLANS.PASS_BUSINESS]: getSignature(),
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
                [PLANS.DRIVE_BUSINESS]: getEndToEndEncryption(),
                [PLANS.PASS]: getEndToEndEncryption(),
                [PLANS.WALLET]: getEndToEndEncryption(),
                [PLANS.FAMILY]: getEndToEndEncryption(),
                [PLANS.DUO]: getEndToEndEncryption(),
                [PLANS.MAIL_PRO]: getEndToEndEncryption(),
                [PLANS.MAIL_BUSINESS]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO]: getEndToEndEncryption(),
                [PLANS.BUNDLE_PRO_2024]: getEndToEndEncryption(),
                [PLANS.PASS_PRO]: getEndToEndEncryption(),
                [PLANS.PASS_BUSINESS]: getEndToEndEncryption(),
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
                [PLANS.DRIVE_BUSINESS]: getEncryptionOutside(),
                [PLANS.PASS]: getEncryptionOutside(),
                [PLANS.WALLET]: getEncryptionOutside(),
                [PLANS.FAMILY]: getEncryptionOutside(),
                [PLANS.DUO]: getEncryptionOutside(),
                [PLANS.MAIL_PRO]: getEncryptionOutside(),
                [PLANS.MAIL_BUSINESS]: getEncryptionOutside(),
                [PLANS.BUNDLE_PRO]: getEncryptionOutside(),
                [PLANS.BUNDLE_PRO_2024]: getEncryptionOutside(),
                [PLANS.PASS_PRO]: getEncryptionOutside(),
                [PLANS.PASS_BUSINESS]: getEncryptionOutside(),
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
                [PLANS.DRIVE_BUSINESS]: getEncryptedContacts(),
                [PLANS.PASS]: getEncryptedContacts(),
                [PLANS.WALLET]: getEncryptedContacts(),
                [PLANS.FAMILY]: getEncryptedContacts(),
                [PLANS.DUO]: getEncryptedContacts(),
                [PLANS.MAIL_PRO]: getEncryptedContacts(),
                [PLANS.MAIL_BUSINESS]: getEncryptedContacts(),
                [PLANS.BUNDLE_PRO]: getEncryptedContacts(),
                [PLANS.BUNDLE_PRO_2024]: getEncryptedContacts(),
                [PLANS.PASS_PRO]: getEncryptedContacts(),
                [PLANS.PASS_BUSINESS]: getEncryptedContacts(),
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
                [PLANS.DRIVE_BUSINESS]: getContactGroups(false),
                [PLANS.PASS]: getContactGroups(false),
                [PLANS.WALLET]: getContactGroups(false),
                [PLANS.FAMILY]: getContactGroups(true),
                [PLANS.DUO]: getContactGroups(true),
                [PLANS.MAIL_PRO]: getContactGroups(true),
                [PLANS.MAIL_BUSINESS]: getContactGroups(true),
                [PLANS.BUNDLE_PRO]: getContactGroups(true),
                [PLANS.BUNDLE_PRO_2024]: getContactGroups(true),
                [PLANS.PASS_PRO]: getContactGroups(false),
                [PLANS.PASS_BUSINESS]: getContactGroups(false),
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
                [PLANS.DRIVE_BUSINESS]: getSMTP(false),
                [PLANS.PASS]: getSMTP(false),
                [PLANS.WALLET]: getSMTP(false),
                [PLANS.FAMILY]: getSMTP(true),
                [PLANS.DUO]: getSMTP(true),
                [PLANS.MAIL_PRO]: getSMTP(true),
                [PLANS.MAIL_BUSINESS]: getSMTP(true),
                [PLANS.BUNDLE_PRO]: getSMTP(true),
                [PLANS.BUNDLE_PRO_2024]: getSMTP(true),
                [PLANS.PASS_PRO]: getSMTP(false),
                [PLANS.PASS_BUSINESS]: getSMTP(false),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'smtp-token',
            plans: {
                [PLANS.FREE]: getSMTPToken(false),
                [PLANS.BUNDLE]: getSMTPToken(false),
                [PLANS.MAIL]: getSMTPToken(false),
                [PLANS.VPN]: getSMTPToken(false),
                [PLANS.DRIVE]: getSMTPToken(false),
                [PLANS.DRIVE_BUSINESS]: getSMTPToken(false),
                [PLANS.PASS]: getSMTPToken(false),
                [PLANS.WALLET]: getSMTPToken(false),
                [PLANS.FAMILY]: getSMTPToken(true),
                [PLANS.DUO]: getSMTPToken(true),
                [PLANS.MAIL_PRO]: getSMTPToken(true),
                [PLANS.MAIL_BUSINESS]: getSMTPToken(true),
                [PLANS.BUNDLE_PRO]: getSMTPToken(true),
                [PLANS.BUNDLE_PRO_2024]: getSMTPToken(true),
                [PLANS.PASS_PRO]: getSMTPToken(false),
                [PLANS.PASS_BUSINESS]: getSMTPToken(false),
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
                [PLANS.DRIVE_BUSINESS]: getAutoReply(false),
                [PLANS.PASS]: getAutoReply(false),
                [PLANS.WALLET]: getAutoReply(false),
                [PLANS.FAMILY]: getAutoReply(true),
                [PLANS.DUO]: getAutoReply(true),
                [PLANS.MAIL_PRO]: getAutoReply(true, Audience.B2B),
                [PLANS.MAIL_BUSINESS]: getAutoReply(true, Audience.B2B),
                [PLANS.BUNDLE_PRO]: getAutoReply(true, Audience.B2B),
                [PLANS.BUNDLE_PRO_2024]: getAutoReply(true, Audience.B2B),
                [PLANS.PASS_PRO]: getAutoReply(false),
                [PLANS.PASS_BUSINESS]: getAutoReply(false),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'auto-forwarding',
            plans: {
                [PLANS.FREE]: getAutoForwarding(false),
                [PLANS.BUNDLE]: getAutoForwarding(true),
                [PLANS.MAIL]: getAutoForwarding(true),
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
                [PLANS.WALLET]: null,
                [PLANS.FAMILY]: getAutoForwarding(true),
                [PLANS.DUO]: getAutoForwarding(true),
                [PLANS.MAIL_PRO]: getAutoForwarding(true),
                [PLANS.MAIL_BUSINESS]: getAutoForwarding(true),
                [PLANS.BUNDLE_PRO]: getAutoForwarding(true),
                [PLANS.BUNDLE_PRO_2024]: getAutoForwarding(true),
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
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
                [PLANS.DRIVE_BUSINESS]: getCatchAll(false),
                [PLANS.PASS]: getCatchAll(false),
                [PLANS.WALLET]: getCatchAll(false),
                [PLANS.FAMILY]: getCatchAll(true),
                [PLANS.DUO]: getCatchAll(true),
                [PLANS.MAIL_PRO]: getCatchAll(true),
                [PLANS.MAIL_BUSINESS]: getCatchAll(true),
                [PLANS.BUNDLE_PRO]: getCatchAll(true),
                [PLANS.BUNDLE_PRO_2024]: getCatchAll(true),
                [PLANS.PASS_PRO]: getCatchAll(false),
                [PLANS.PASS_BUSINESS]: getCatchAll(false),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'auto-delete-spam-and-trash',
            plans: {
                [PLANS.FREE]: getAutoDeleteSpamAndTrash(false),
                [PLANS.BUNDLE]: getAutoDeleteSpamAndTrash(true),
                [PLANS.MAIL]: getAutoDeleteSpamAndTrash(true),
                [PLANS.VPN]: getAutoDeleteSpamAndTrash(false),
                [PLANS.DRIVE]: getAutoDeleteSpamAndTrash(false),
                [PLANS.DRIVE_BUSINESS]: getAutoDeleteSpamAndTrash(false),
                [PLANS.PASS]: getAutoDeleteSpamAndTrash(false),
                [PLANS.WALLET]: getAutoDeleteSpamAndTrash(false),
                [PLANS.FAMILY]: getAutoDeleteSpamAndTrash(true),
                [PLANS.DUO]: getAutoDeleteSpamAndTrash(true),
                [PLANS.MAIL_PRO]: getAutoDeleteSpamAndTrash(true),
                [PLANS.MAIL_BUSINESS]: getAutoDeleteSpamAndTrash(true),
                [PLANS.BUNDLE_PRO]: getAutoDeleteSpamAndTrash(true),
                [PLANS.BUNDLE_PRO_2024]: getAutoDeleteSpamAndTrash(true),
                [PLANS.PASS_PRO]: getAutoDeleteSpamAndTrash(false),
                [PLANS.PASS_BUSINESS]: getAutoDeleteSpamAndTrash(false),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'schedule-and-snooze',
            plans: {
                [PLANS.FREE]: getScheduleAndSnooze(false),
                [PLANS.BUNDLE]: getScheduleAndSnooze(true),
                [PLANS.MAIL]: getScheduleAndSnooze(true),
                [PLANS.VPN]: getScheduleAndSnooze(false),
                [PLANS.DRIVE]: getScheduleAndSnooze(false),
                [PLANS.DRIVE_BUSINESS]: getScheduleAndSnooze(false),
                [PLANS.PASS]: getScheduleAndSnooze(false),
                [PLANS.WALLET]: getScheduleAndSnooze(false),
                [PLANS.FAMILY]: getScheduleAndSnooze(true),
                [PLANS.DUO]: getScheduleAndSnooze(true),
                [PLANS.MAIL_PRO]: getScheduleAndSnooze(true),
                [PLANS.MAIL_BUSINESS]: getScheduleAndSnooze(true),
                [PLANS.BUNDLE_PRO]: getScheduleAndSnooze(true),
                [PLANS.BUNDLE_PRO_2024]: getScheduleAndSnooze(true),
                [PLANS.PASS_PRO]: getScheduleAndSnooze(false),
                [PLANS.PASS_BUSINESS]: getScheduleAndSnooze(false),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'desktop-app',
            plans: {
                [PLANS.FREE]: getDesktopApp(false),
                [PLANS.BUNDLE]: getDesktopApp(true),
                [PLANS.MAIL]: getDesktopApp(true),
                [PLANS.VPN]: getDesktopApp(false),
                [PLANS.DRIVE]: getDesktopApp(false),
                [PLANS.DRIVE_BUSINESS]: getDesktopApp(false),
                [PLANS.PASS]: getDesktopApp(false),
                [PLANS.WALLET]: getDesktopApp(false),
                [PLANS.FAMILY]: getDesktopApp(true),
                [PLANS.DUO]: getDesktopApp(true),
                [PLANS.MAIL_PRO]: getDesktopApp(true),
                [PLANS.MAIL_BUSINESS]: getDesktopApp(true),
                [PLANS.BUNDLE_PRO]: getDesktopApp(true),
                [PLANS.BUNDLE_PRO_2024]: getDesktopApp(true),
                [PLANS.PASS_PRO]: getDesktopApp(false),
                [PLANS.PASS_BUSINESS]: getDesktopApp(false),
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'email-distribution-lists',
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
                [PLANS.MAIL_PRO]: canAccessDistributionListFeature ? getEmailDistributionLists(false) : null,
                [PLANS.MAIL_BUSINESS]: canAccessDistributionListFeature ? getEmailDistributionLists(true) : null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: canAccessDistributionListFeature ? getEmailDistributionLists(true) : null,
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
        {
            name: 'scribe',
            plans: {
                [PLANS.FREE]: null,
                [PLANS.BUNDLE]: null,
                [PLANS.MAIL]: null,
                [PLANS.VPN]: null,
                [PLANS.DRIVE]: null,
                [PLANS.DRIVE_BUSINESS]: null,
                [PLANS.PASS]: null,
                [PLANS.WALLET]: null,
                [PLANS.FAMILY]: getProtonScribe(true),
                [PLANS.DUO]: getProtonScribe(true),
                [PLANS.MAIL_PRO]: null,
                [PLANS.MAIL_BUSINESS]: null,
                [PLANS.BUNDLE_PRO]: null,
                [PLANS.BUNDLE_PRO_2024]: null,
                [PLANS.PASS_PRO]: null,
                [PLANS.PASS_BUSINESS]: null,
                [PLANS.VPN_PRO]: null,
                [PLANS.VPN_BUSINESS]: null,
            },
        },
    ];
};
