import { c, msgid } from 'ttag';

import type { ADDON_NAMES, CYCLE } from '@proton/payments';
import { PLANS, PLAN_NAMES, isDomainAddon, isLumoAddon, isScribeAddon } from '@proton/payments';
import { BRAND_NAME, LUMO_APP_NAME } from '@proton/shared/lib/constants';
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

export const getAddonDashboardTitle = (addonName: ADDON_NAMES, quantity: number, maxMembers: number) => {
    if (isDomainAddon(addonName)) {
        return c('Addon').ngettext(msgid`${quantity} custom domain`, `${quantity} custom domains`, quantity);
    }

    if (isScribeAddon(addonName)) {
        if (maxMembers > 1) {
            // translator: sentence is "Proton Scribe writing assistant (for 1 user)" or "Proton Scribe writing assistant (for 6 users)"
            return c('Addon').ngettext(
                msgid`${BRAND_NAME} Scribe writing assistant (for ${quantity} user)`,
                `${BRAND_NAME} Scribe writing assistant (for ${quantity} users)`,
                quantity
            );
        } else {
            return c('Addon').t`${BRAND_NAME} Scribe writing assistant`;
        }
    }

    if (isLumoAddon(addonName)) {
        if (maxMembers > 1) {
            // translator: sentence is "Lumo AI assistant (for 1 user)" or "Lumo AI assistant (for 6 user)"
            return c('Addon').ngettext(
                msgid`${LUMO_APP_NAME} AI assistant (for ${quantity} user)`,
                `${LUMO_APP_NAME} AI assistant (for ${quantity} users)`,
                quantity
            );
        } else {
            return c('Addon').t`${LUMO_APP_NAME} AI assistant`;
        }
    }
    return '';
};

export const getPassLifetimeAddonDashboardTitle = (user: UserModel) => {
    if (hasPassLifetime(user)) {
        return PLAN_NAMES[PLANS.PASS_LIFETIME];
    }
    return '';
};
