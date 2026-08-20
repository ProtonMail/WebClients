import { PLANS } from '@proton/payments/core/constants';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import type OfferSubscription from './offerSubscription';

/**
 * Tracking refs are `offer_26_sep_<currentPlan>_<offerPlan>_<app>_web`. The current plan and the app
 * are independent: a Drive Plus user reading their mail emits
 * `offer_26_sep_drive_plus_unlimited_mail_web`.
 *
 * Mail, Calendar and Drive each count as their own app, so a Drive Plus user in Calendar emits
 * `..._calendar_web`. Note the plan names are underscore-separated (`mail_plus`, not `mailplus`), so a
 * ref does not have a fixed segment count. Anything parsing these should match on the known plan names
 * rather than splitting on position.
 */
export type OfferProduct = 'mail' | 'calendar' | 'drive';

const APP_REF_NAMES: Partial<Record<APP_NAMES, OfferProduct>> = {
    [APPS.PROTONMAIL]: 'mail',
    [APPS.PROTONCALENDAR]: 'calendar',
    [APPS.PROTONDRIVE]: 'drive',
};

/** The `<app>` segment */
export const getOfferProduct = (appName: APP_NAMES, pathname: string): OfferProduct => {
    const app = appName === APPS.PROTONACCOUNT ? getAppFromPathnameSafe(pathname) : appName;

    return (app && APP_REF_NAMES[app]) || 'mail';
};

/** The `<currentPlan>` segment. Both Drive tiers and both VPN plans collapse to one name each. */
const PLAN_REF_NAMES: Partial<Record<PLANS, string>> = {
    [PLANS.MAIL]: 'mail_plus',
    [PLANS.DRIVE]: 'drive_plus',
    [PLANS.DRIVE_1TB]: 'drive_plus',
    [PLANS.VPN]: 'vpn_plus',
    [PLANS.VPN2024]: 'vpn_plus',
    [PLANS.PASS]: 'pass_plus',
    [PLANS.BUNDLE]: 'unlimited',
    [PLANS.DUO]: 'duo',
    [PLANS.FAMILY]: 'family',
};

export const getPlanRefName = (offerSubscription?: OfferSubscription): string => {
    if (!offerSubscription) {
        return 'free';
    }

    if (offerSubscription.hasFamily()) {
        return PLAN_REF_NAMES[PLANS.FAMILY]!;
    }
    if (offerSubscription.hasDuo()) {
        return PLAN_REF_NAMES[PLANS.DUO]!;
    }
    if (offerSubscription.hasBundle()) {
        return PLAN_REF_NAMES[PLANS.BUNDLE]!;
    }
    if (offerSubscription.hasMail()) {
        return PLAN_REF_NAMES[PLANS.MAIL]!;
    }
    if (offerSubscription.hasDrive() || offerSubscription.hasDrive1TB()) {
        return PLAN_REF_NAMES[PLANS.DRIVE]!;
    }
    if (offerSubscription.hasDeprecatedVPN() || offerSubscription.hasVPN2024()) {
        return PLAN_REF_NAMES[PLANS.VPN]!;
    }
    if (offerSubscription.hasPass()) {
        return PLAN_REF_NAMES[PLANS.PASS]!;
    }

    return 'free';
};
