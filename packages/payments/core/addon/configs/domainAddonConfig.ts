import { c, msgid } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';

import { ADDON_PREFIXES, MAX_DOMAIN_PRO_ADDON, TRIAL_MAX_EXTRA_CUSTOM_DOMAINS } from '../../constants';
import type { AddonConfig } from '../interfaces';
import { domainVpnBusinessGate } from '../visibility';

export const DOMAIN_ADDON_CONFIG: AddonConfig = {
    addonType: ADDON_PREFIXES.DOMAIN,
    max: { perOrganization: MAX_DOMAIN_PRO_ADDON },
    maxTrial: { perOrganization: TRIAL_MAX_EXTRA_CUSTOM_DOMAINS },
    trialIncreaseBlockedReasonText: () =>
        c('b2b_trials_2025_Info').t`You cannot add custom domains during the trial period.`,
    isPerMemberCapped: false,
    displayOrder: 1,
    featureLimit: { kind: 'native', key: 'MaxDomains' },
    transferStrategy: 'domain',
    visibility: {
        featureFlag: 'DomainVpnBiz2023',
        rules: [domainVpnBusinessGate],
    },
    customizerCopy: {
        label: () => c('Info').t`Custom email domains`,
        tooltip: () =>
            c('Info')
                .t`Email hosting is only available for domains you already own. Domain registration is not currently available through ${BRAND_NAME}. You can host email for domains registered on any domain registrar.`,
    },
    tooltipLabel: (price) => c('Addon').t`${price} per domain`,
    title: () => c('Addon').t`Domains`,
    dashboardTitle: (quantity) =>
        c('Addon').ngettext(msgid`${quantity} custom domain`, `${quantity} custom domains`, quantity),
    addonCheckoutTitle: (domains) =>
        c('Addon').ngettext(
            msgid`${domains} additional custom domain`,
            `${domains} additional custom domains`,
            domains
        ),
};
