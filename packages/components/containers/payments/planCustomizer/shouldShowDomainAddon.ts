import { ADDON_NAMES } from '@proton/payments/core/constants';
import type { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';

import type { CustomiserMode } from './ProtonPlanCustomizer';

export function shouldShowDomainAddon({
    addonName,
    currentPlan,
    domainVpnBiz2023Enabled,
    mode,
}: {
    addonName: ADDON_NAMES;
    currentPlan: SelectedPlan;
    domainVpnBiz2023Enabled: boolean;
    mode: CustomiserMode;
}) {
    if (addonName !== ADDON_NAMES.DOMAIN_VPN_BUSINESS) {
        return true;
    }

    if (mode === 'signup') {
        return false;
    }

    return domainVpnBiz2023Enabled || currentPlan.getAdditionalDomains() > 0;
}
