import { Location } from 'history';

import { checkSubscription } from '@proton/shared/lib/api/payments';
import { APP_NAMES, PLAN_TYPES, SSO_PATHS } from '@proton/shared/lib/constants';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { Api, Currency, Cycle, PlansMap, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';

import { PlanIDs } from './interfaces';

export const getSubscriptionPrices = async (
    api: Api,
    planIDs: PlanIDs,
    currency: Currency,
    cycle: Cycle,
    couponCode?: string
) => {
    if (!hasPlanIDs(planIDs)) {
        return getFreeCheckResult(currency, cycle);
    }
    return api<SubscriptionCheckResponse>(
        checkSubscription({
            Plans: planIDs,
            Currency: currency,
            Cycle: cycle,
            CouponCode: couponCode,
        })
    );
};

export const getPlanFromPlanIDs = (plansMap: PlansMap, planIDs: PlanIDs = {}) => {
    const planID = Object.keys(planIDs).find((planID): planID is keyof PlansMap => {
        return plansMap[planID as keyof PlansMap]?.Type === PLAN_TYPES.PLAN;
    });
    if (planID) {
        return plansMap[planID];
    }
};

export const isMailTrialSignup = (location: Location) => {
    return location.pathname.includes(SSO_PATHS.TRIAL);
};

export const isMailReferAFriendSignup = (location: Location) => {
    return location.pathname.includes(SSO_PATHS.REFER);
};

export const getSignupApplication = (APP_NAME: APP_NAMES) => {
    if (APP_NAME === 'proton-vpn-settings') {
        return 'proton-vpn-settings';
    }

    return 'proton-account';
};
