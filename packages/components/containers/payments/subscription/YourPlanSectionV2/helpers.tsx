import { c, msgid } from 'ttag';

import { getAddonConfigByName } from '@proton/payments/core/addon/addons';
import { type ADDON_NAMES, type CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';

export function getPlanTitlePlusMaybeBrand(planTitle?: string, planName?: PLANS) {
    return planName === PLANS.FREE ? `${BRAND_NAME} ${planTitle}` : planTitle;
}

export const getDashboardUpsellTitle = (months: CYCLE) => {
    return c('Plans').ngettext(msgid`${months} month plan`, `${months} month plan`, months);
};

export const getBillingCycleText = (cycle: CYCLE) => {
    if (!cycle) {
        return '';
    }
    return c('Plans').ngettext(msgid`${cycle} month`, `${cycle} months`, cycle);
};

export const getAddonDashboardTitle = (
    addonName: ADDON_NAMES,
    quantity: number,
    maxMembers: number,
    scribeToLumo: boolean
): string => getAddonConfigByName(addonName)?.dashboardTitle(quantity, maxMembers, scribeToLumo) ?? '';

export const getPassLifetimeAddonDashboardTitle = (user: UserModel) => {
    if (hasPassLifetime(user)) {
        return PLAN_NAMES[PLANS.PASS_LIFETIME];
    }
    return '';
};
