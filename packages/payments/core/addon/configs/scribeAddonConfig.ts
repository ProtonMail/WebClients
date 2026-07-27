import { c, msgid } from 'ttag';

import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { ADDON_PREFIXES, TRIAL_MAX_SCRIBE_SEATS } from '../../constants';
import { getIsB2BAudienceFromPlanIDs } from '../../plan/helpers';
import type { AddonConfig } from '../interfaces';

const getScribeWritingAssistantText = (scribeToLumo: boolean) => {
    return scribeToLumo
        ? c('Info').t`${LUMO_SHORT_APP_NAME} writing assistant`
        : c('Info').t`${BRAND_NAME} Scribe writing assistant`;
};

const getScribeDashboardTitle = (quantity: number, maxMembers: number, scribeToLumo: boolean) => {
    if (maxMembers > 1) {
        return scribeToLumo
            ? c('Addon').ngettext(
                  msgid`${LUMO_SHORT_APP_NAME} writing assistant (for ${quantity} user)`,
                  `${LUMO_SHORT_APP_NAME} writing assistant (for ${quantity} users)`,
                  quantity
              )
            : c('Addon').ngettext(
                  msgid`${BRAND_NAME} Scribe writing assistant (for ${quantity} user)`,
                  `${BRAND_NAME} Scribe writing assistant (for ${quantity} users)`,
                  quantity
              );
    } else {
        return getScribeWritingAssistantText(scribeToLumo);
    }
};

export const SCRIBE_ADDON_CONFIG: AddonConfig = {
    addonType: ADDON_PREFIXES.SCRIBE,
    max: { perMember: 1 },
    maxTrial: { perOrganization: TRIAL_MAX_SCRIBE_SEATS },
    trialIncreaseBlockedReasonText: (scribeToLumo: boolean) =>
        scribeToLumo
            ? c('b2b_trials_2025_Info')
                  .t`You can have up to ${TRIAL_MAX_SCRIBE_SEATS} ${LUMO_SHORT_APP_NAME} writing assistant seats during the trial period.`
            : c('b2b_trials_2025_Info')
                  .t`You can have up to ${TRIAL_MAX_SCRIBE_SEATS} Scribe seats during the trial period.`,
    isPerMemberCapped: true,
    displayOrder: 4,
    featureLimit: { kind: 'synthetic', key: 'MaxAI', grants: { MaxAI: 1 }, pool: { group: 'ai' } },
    transferStrategy: 'scribe',
    syncWithMembersAddon: 'when-equal',
    title: (isB2C: boolean) => (isB2C ? c('Addon').t`Writing assistant` : c('Addon').t`Writing assistant seats`),
    dashboardTitle: (quantity, maxMembers, scribeToLumo) => getScribeDashboardTitle(quantity, maxMembers, scribeToLumo),
    addonCheckoutTitle: (seats, { planIDs }) =>
        getIsB2BAudienceFromPlanIDs(planIDs)
            ? // translator: sentence is "1 writing assistant seat" or "2 writing assistant seats"
              c('Addon').ngettext(msgid`${seats} writing assistant seat`, `${seats} writing assistant seats`, seats)
            : c('Info').t`Writing assistant`,
};
