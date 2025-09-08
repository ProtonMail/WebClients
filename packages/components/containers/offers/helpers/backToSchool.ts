import { c } from 'ttag';

import { PLANS, type Subscription } from '@proton/payments';

export const getBackToSchoolTitle = (): string => {
    return c('q3campaign_2025: Title').t`End-of-summer sale`;
};

export function userHasSupportedProduct(subscription?: Subscription) {
    const hasMail = subscription?.Plans?.some((plan) => plan.Name === PLANS.MAIL) ?? false;
    const hasDrive = subscription?.Plans?.some((plan) => plan.Name === PLANS.DRIVE) ?? false;
    const hasPass = subscription?.Plans?.some((plan) => plan.Name === PLANS.PASS) ?? false;
    const hasVPN = subscription?.Plans?.some((plan) => plan.Name === PLANS.VPN2024) ?? false;

    return hasMail || hasDrive || hasPass || hasVPN;
}
