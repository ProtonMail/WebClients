import { c, msgid } from 'ttag';

import { ADDON_NAMES, ADDON_PREFIXES, MAX_MEMBER_ADDON, PLANS, TRIAL_MAX_USERS } from '../../constants';
import type { AddonConfig } from '../interfaces';

// Member sub-variants are specific name sets, not a prefix, so they can't be derived from addonType.
const ORG_SIZE_ADDONS = [
    ADDON_NAMES.MEMBER_VPN_BUSINESS,
    ADDON_NAMES.MEMBER_VPN_PRO,
    ADDON_NAMES.MEMBER_PASS_BUSINESS,
    ADDON_NAMES.MEMBER_PASS_PRO,
];
const DRIVE_ORG_SIZE_ADDONS = [ADDON_NAMES.MEMBER_DRIVE_PRO, ADDON_NAMES.MEMBER_DRIVE_BUSINESS];

type MemberVariant = 'drive-org-size' | 'org-size' | 'default';

const getMemberVariant = (addonName: ADDON_NAMES): MemberVariant => {
    if (DRIVE_ORG_SIZE_ADDONS.includes(addonName)) {
        return 'drive-org-size';
    }
    if (ORG_SIZE_ADDONS.includes(addonName)) {
        return 'org-size';
    }
    return 'default';
};

export const MEMBER_ADDON_CONFIG: AddonConfig = {
    addonType: ADDON_PREFIXES.MEMBER,
    max: { perOrganization: MAX_MEMBER_ADDON },
    maxTrial: { perOrganization: TRIAL_MAX_USERS },
    trialIncreaseBlockedReasonText: () =>
        c('b2b_trials_2025_Info').t`You can have up to ${TRIAL_MAX_USERS} users during the trial period.`,
    isPerMemberCapped: false,
    displayOrder: 0,
    alwaysOffered: true,
    featureLimit: { kind: 'native', key: 'MaxMembers' },
    // FREE reports/floors to 1 member but actually has 0; this explicit 0 defeats that floor.
    includedByPlanOverride: { [PLANS.FREE]: 0 },
    transferStrategy: 'member',
    customizerCopy: {
        label: ({ addonName, memberCount }) => {
            const memberVariant = getMemberVariant(addonName);
            if (memberVariant === 'drive-org-size') {
                return c('Info').ngettext(
                    msgid`Create a secure cloud for ${memberCount} member`,
                    `Create a secure cloud for ${memberCount} members`,
                    memberCount
                );
            }
            if (memberVariant === 'org-size') {
                return c('Info').t`Organization size`;
            }
            return c('Info').t`Users`;
        },
        tooltip: ({ addonName, showUsersTooltip }) =>
            getMemberVariant(addonName) === 'default' && showUsersTooltip
                ? c('Info').t`A user is an account associated with a single username, mailbox, and person`
                : undefined,
    },
    tooltipLabel: (price) => c('Addon').t`${price} per user`,
    title: () => c('Addon').t`Users`,
    dashboardTitle: () => '',
    addonCheckoutTitle: (users) => c('Addon').ngettext(msgid`${users} user`, `${users} users`, users),
};
