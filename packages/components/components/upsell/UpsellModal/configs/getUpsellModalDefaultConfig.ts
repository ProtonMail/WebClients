import { CYCLE, PLANS, type PlanIDs } from '@proton/payments';

import { getUpsellModalFooterText } from '../helpers/getUpsellModalFooterText';
import { getUpsellModalSubmitText } from '../helpers/getUpsellModalSubmitText';
import { getUpsellPlanMonthlyPrice } from '../helpers/getUpsellPlanMonthlyPrice';
import type { UpsellModalConfigCase } from '../interface';

export const getUpsellModalDefaultConfig: UpsellModalConfigCase = async (props) => {
    const { currency, paymentsApi, plans } = props;

    // Paid users got the bundle for 12 months displayed
    const planIDs: PlanIDs = { [PLANS.BUNDLE]: 1 };
    const cycle = CYCLE.YEARLY;
    const monthlyPrice = await getUpsellPlanMonthlyPrice({
        currency,
        cycle,
        paymentsApi,
        planIDs,
        plans,
    });

    return {
        planIDs,
        cycle,
        monthlyPrice,
        footerText: getUpsellModalFooterText({
            planIDs,
            currency,
            monthlyPrice: monthlyPrice.regularPrice,
        }),
        submitText: getUpsellModalSubmitText({
            planIDs,
        }),
    };
};
