import { c, msgid } from 'ttag';

import { ADDON_PREFIXES, MAX_IPS_ADDON, PLANS, TRIAL_MAX_DEDICATED_IPS } from '../../constants';
import type { AddonConfig } from '../interfaces';

export const IP_ADDON_CONFIG: AddonConfig = {
    addonType: ADDON_PREFIXES.IP,
    max: { perOrganization: MAX_IPS_ADDON },
    maxTrial: { perOrganization: TRIAL_MAX_DEDICATED_IPS },
    trialIncreaseBlockedReasonText: () =>
        c('b2b_trials_2025_Info')
            .t`You can have up to ${TRIAL_MAX_DEDICATED_IPS} dedicated server during the trial period.`,
    isPerMemberCapped: false,
    displayOrder: 2,
    alwaysOffered: true,
    featureLimit: { kind: 'synthetic', key: 'MaxIPs', grants: { MaxIPs: 1 } },
    includedByPlanOverride: { [PLANS.VPN_BUSINESS]: 1 },
    transferStrategy: 'subtract-included',
    tooltipLabel: (price) => c('Addon').t`${price} per dedicated server`,
    title: (_isB2C: boolean, options?: { short?: boolean }) =>
        options?.short ? c('Addon').t`Servers` : c('Addon').t`Dedicated VPN servers`,
    dashboardTitle: () => '',
    addonCheckoutTitle: (ips) =>
        c('Addon').ngettext(msgid`${ips} dedicated VPN server`, `${ips} dedicated VPN servers`, ips),
};
