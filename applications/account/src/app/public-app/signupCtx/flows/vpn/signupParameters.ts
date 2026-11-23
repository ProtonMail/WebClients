import { PLANS } from '@proton/payments/core/constants';

import { getSignupSearchParams } from '../../../signup/searchParams';

const vpnSignupPlans: string[] = [
    'free',
    PLANS.BUNDLE,
    PLANS.DUO,
    PLANS.FAMILY,
    PLANS.VPN2024,
    PLANS.VPN_PRO,
    PLANS.VPN_PASS_BUNDLE,
    PLANS.VPN_BUSINESS,
    PLANS.VPN_PASS_BUNDLE_BUSINESS,
    PLANS.BUNDLE_PRO_2024,
];

export const getVpnSignupParameters = (pathname: string, searchParams: URLSearchParams) => {
    const result = getSignupSearchParams(pathname, searchParams);

    if (result.preSelectedPlan && !vpnSignupPlans.includes(result.preSelectedPlan)) {
        delete result.preSelectedPlan;
    }

    return result;
};
