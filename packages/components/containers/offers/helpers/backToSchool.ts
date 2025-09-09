import { c } from 'ttag';

import { CYCLE, PLANS, type Subscription } from '@proton/payments';

export const getBackToSchoolTitle = (): string => {
    return c('q3campaign_2025: Title').t`End-of-summer sale`;
};

export function whichAppsUserBought(subscription?: Subscription) {
    const hasMail =
        subscription?.Plans?.some((plan) => plan.Name === PLANS.MAIL && plan.Cycle === CYCLE.YEARLY) ?? false;
    const hasDrive = subscription?.Plans?.some((plan) => plan.Name === PLANS.DRIVE) ?? false;
    const hasPass =
        subscription?.Plans?.some((plan) => plan.Name === PLANS.PASS && plan.Cycle === CYCLE.YEARLY) ?? false;
    const hasVPN =
        subscription?.Plans?.some((plan) => plan.Name === PLANS.VPN2024 && plan.Cycle === CYCLE.YEARLY) ?? false;

    return { hasMail, hasDrive, hasPass, hasVPN };
}
