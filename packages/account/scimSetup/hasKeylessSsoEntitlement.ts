import { PLANS } from '@proton/payments/core/constants';

// Cannot check the entitlement directly yet, so we check against the plans that have it.
// TODO: change this to an entitlement check on keyless-sso once it's supported.
const plansWithKeylessSsoEntitlement = [PLANS.VPN_BUSINESS];

const hasKeylessSsoEntitlement = (plan: PLANS | undefined) => {
    if (plan === undefined) {
        return false;
    }

    return plansWithKeylessSsoEntitlement.includes(plan);
};

export default hasKeylessSsoEntitlement;
