import { c, msgid } from 'ttag';

import { LUMO_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { ADDON_PREFIXES, MAX_LUMO_ADDON, MAX_MEMBER_LUMO_ADDON, PLANS, TRIAL_MAX_LUMO_SEATS } from '../../constants';
import { getIsB2BAudienceFromPlanIDs } from '../../plan/helpers';
import type { AddonConfig } from '../interfaces';
import { notExternallyManagedLumo, passesCouponGate, planSupportsAddon } from '../visibility';

export const LUMO_ADDON_CONFIG: AddonConfig = {
    addonType: ADDON_PREFIXES.LUMO,
    min: {
        perMember: 1,
    },
    max: {
        perMember: MAX_LUMO_ADDON,
        perOrganization: MAX_MEMBER_LUMO_ADDON,
    },
    trialIncreaseBlockedReasonText: () =>
        c('b2b_trials_2025_Info')
            .t`You can have up to ${TRIAL_MAX_LUMO_SEATS} ${LUMO_SHORT_APP_NAME} seats during the trial period.`,
    maxTrial: { perOrganization: TRIAL_MAX_LUMO_SEATS },
    isPerMemberCapped: true,
    displayOrder: 5,
    featureLimit: {
        kind: 'synthetic',
        key: 'MaxLumo',
        grants: { MaxLumo: 1, MaxAI: 1 },
        pool: { group: 'ai', preferred: true },
    },
    includedByPlanOverride: { [PLANS.LUMO]: 1, [PLANS.LUMO_BUSINESS]: 1 },
    visibility: {
        couponHideFlag: 'hideLumoAddonBanner',
        rules: [
            planSupportsAddon(ADDON_PREFIXES.LUMO),
            notExternallyManagedLumo,
            passesCouponGate(ADDON_PREFIXES.LUMO),
        ],
    },
    transferStrategy: 'lumo',
    tooltipLabel: (price) => c('Addon').t`${price} per seat`,
    syncWithMembersAddon: 'when-equal',
    title: (isB2C: boolean) =>
        isB2C ? c('Addon').t`${LUMO_APP_NAME} AI license` : c('Addon').t`${LUMO_APP_NAME} seats`,
    dashboardTitle: (quantity, maxMembers) =>
        maxMembers > 1
            ? c('Addon').ngettext(
                  msgid`${LUMO_APP_NAME} AI assistant (for ${quantity} user)`,
                  `${LUMO_APP_NAME} AI assistant (for ${quantity} users)`,
                  quantity
              )
            : c('Addon').t`${LUMO_APP_NAME} AI assistant`,
    addonCheckoutTitle: (seats, { planIDs }) =>
        getIsB2BAudienceFromPlanIDs(planIDs)
            ? c('Addon').ngettext(msgid`${seats} ${LUMO_APP_NAME} seat`, `${seats} ${LUMO_APP_NAME} seats`, seats)
            : c('Addon').ngettext(
                  msgid`${seats} ${LUMO_APP_NAME} AI license`,
                  `${seats} ${LUMO_APP_NAME} AI licenses`,
                  seats
              ),
};
