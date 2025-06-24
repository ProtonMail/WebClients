/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
// @ts-nocheck
import { usePlans } from '@proton/account/plans/hooks';

import { PLANS } from '../core/constants';
import { getFallbackCurrency } from '../core/helpers';
import type { Currency, PlanIDs } from '../core/interface';
import { getPlanNameFromIDs } from '../core/plan/helpers';
import type { Plan, StrictPlan } from '../core/plan/interface';
import { getPlanByName, getPlansMap, getStrictPlanByName } from '../core/subscription/plans-map-wrapper';

// #region Example: Get plan name from planIDs object
function exampleGetPlanNameFromIDs() {
    const planIDs: PlanIDs = {
        [PLANS.MAIL]: 1,
    };

    const planName = getPlanNameFromIDs(planIDs);
    console.assert(planName === PLANS.MAIL, 'planName should be PLANS.MAIL');
}
// #endregion

// #region Example: Get Plan by plan name with currency fallback. It might be useful when you want to render a selected
// plan with a preferred currency, but you want to use the fallback currency in case if the selected plan doesn't
// support the preferred currency.

// option 1: get PlansMap with currency fallback
function useExampleGetPlanWithCurrencyFallback1() {
    const [plansResult, loading] = usePlans();
    if (!loading || !plansResult) {
        return null;
    }

    const regionalCurrency: Currency = 'BRL';

    const plansMap = getPlansMap(plansResult.plans, regionalCurrency, true);
    const plan = plansMap[PLANS.BUNDLE_PRO_2024];
    console.assert(plan.Name === PLANS.BUNDLE_PRO_2024, `plan.Name should be ${PLANS.BUNDLE_PRO_2024}`);
    console.assert(
        plan.Currency === getFallbackCurrency(regionalCurrency),
        `plan.Currency should be ${regionalCurrency}`
    );
}

// option 2: get plan manually
function useExampleGetPlanWithCurrencyFallback2() {
    const [plansResult, loading] = usePlans();
    if (!loading || !plansResult) {
        return null;
    }

    const regionalCurrency: Currency = 'BRL';

    const plan: Plan | undefined = getPlanByName(
        plansResult.plans,
        PLANS.BUNDLE_PRO_2024,
        regionalCurrency,
        undefined,
        true
    );

    // very similar, just makes sure that the return type can't be an addon
    const strictPlan: StrictPlan | undefined = getStrictPlanByName(
        plansResult.plans,
        PLANS.BUNDLE_PRO_2024,
        regionalCurrency,
        undefined,
        true
    );

    console.assert(plan?.Currency === 'EUR', 'plan.Currency should be EUR');
    console.assert(strictPlan?.Currency === 'EUR', 'strictPlan.Currency should be EUR');
}
// #endregion
