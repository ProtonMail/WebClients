import { c, msgid } from 'ttag';

import { MEET_APP_NAME, MEET_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { ADDON_PREFIXES, MAX_MEET_ADDON, MAX_MEMBER_MEET_ADDON, TRIAL_MAX_MEET_SEATS } from '../../constants';
import { getIsB2BAudienceFromPlanIDs } from '../../plan/helpers';
import type { AddonConfig } from '../interfaces';
import { passesCouponGate, planSupportsAddon } from '../visibility';

export const MEET_ADDON_CONFIG: AddonConfig = {
    addonType: ADDON_PREFIXES.MEET,
    min: {
        perMember: 1,
    },
    max: {
        perMember: MAX_MEET_ADDON,
        perOrganization: MAX_MEMBER_MEET_ADDON,
    },
    trialIncreaseBlockedReasonText: () =>
        c('meet_2025: Info')
            .t`You can have up to ${TRIAL_MAX_MEET_SEATS} ${MEET_SHORT_APP_NAME} seats during the trial period.`,
    maxTrial: { perOrganization: TRIAL_MAX_MEET_SEATS },
    isPerMemberCapped: true,
    displayOrder: 3,
    featureLimit: { kind: 'synthetic', key: 'MaxMeet', grants: { MaxMeet: 1 } },
    visibility: {
        couponHideFlag: 'hideMeetAddonBanner',
        rules: [planSupportsAddon(ADDON_PREFIXES.MEET), passesCouponGate(ADDON_PREFIXES.MEET)],
    },
    transferStrategy: 'meet',
    tooltipLabel: (price) => c('meet_2025: Addon').t`${price} per seat`,
    syncWithMembersAddon: 'always',
    title: (isB2C: boolean) =>
        isB2C ? c('meet_2025: Addon').t`${MEET_APP_NAME} license` : c('meet_2025: Addon').t`${MEET_APP_NAME} seats`,
    dashboardTitle: (quantity, maxMembers) =>
        maxMembers > 1
            ? c('meet_2025: Addon').ngettext(
                  msgid`${MEET_APP_NAME} (for ${quantity} user)`,
                  `${MEET_APP_NAME} (for ${quantity} users)`,
                  quantity
              )
            : MEET_APP_NAME,
    addonCheckoutTitle: (seats, { planIDs }) =>
        getIsB2BAudienceFromPlanIDs(planIDs)
            ? c('meet_2025: Addon').ngettext(
                  msgid`${seats} ${MEET_APP_NAME} seat`,
                  `${seats} ${MEET_APP_NAME} seats`,
                  seats
              )
            : c('Addon').ngettext(
                  msgid`${seats} ${MEET_APP_NAME} license`,
                  `${seats} ${MEET_APP_NAME} licenses`,
                  seats
              ),
};
