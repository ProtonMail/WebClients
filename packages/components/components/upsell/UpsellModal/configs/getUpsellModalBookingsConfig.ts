import { CYCLE, PLANS, getFallbackCurrency } from '@proton/payments';

import { getUpsellModalFooterText } from '../helpers/getUpsellModalFooterText';
import { getUpsellModalSubmitText } from '../helpers/getUpsellModalSubmitText';
import { getUpsellPlanMonthlyPrice } from '../helpers/getUpsellPlanMonthlyPrice';
import type { UpsellModalConfigCase } from '../interface';

export const getUpsellModalBookingsConfig: UpsellModalConfigCase = async (props) => {
    const { currency: curr, paymentsApi, plans } = props;
    const plan = PLANS.BUNDLE_BIZ_2025;
    const planIDs = { [plan]: 1 };
    const cycle = CYCLE.YEARLY;

    const currency = getFallbackCurrency(curr);
    const monthlyPrice = await getUpsellPlanMonthlyPrice({
        // B2B plans don't support regional currencies, this fallback to a main currency
        currency,
        cycle,
        paymentsApi,
        planIDs,
        plans,
    });

    return {
        planIDs,
        cycle,
        footerText: getUpsellModalFooterText({
            planIDs,
            currency,
            monthlyPrice: monthlyPrice.regularPrice,
        }),
        submitText: getUpsellModalSubmitText({ planIDs }),
    };
};
