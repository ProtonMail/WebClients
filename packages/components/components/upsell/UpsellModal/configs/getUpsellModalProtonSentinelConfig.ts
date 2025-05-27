import { CYCLE, PLANS } from '@proton/payments';

import { getUpsellModalFooterText } from '../helpers/getUpsellModalFooterText';
import { getUpsellModalSubmitText } from '../helpers/getUpsellModalSubmitText';
import { getUpsellPlanMonthlyPrice } from '../helpers/getUpsellPlanMonthlyPrice';
import type { UpsellModalConfigCase } from '../interface';

export const getUpsellModalProtonSentinelConfig: UpsellModalConfigCase = async (props) => {
    const { currency, paymentsApi, plans } = props;
    const planIDs = { [PLANS.BUNDLE]: 1 };
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
        footerText: getUpsellModalFooterText({
            planIDs,
            currency,
            monthlyPrice: monthlyPrice.regularPrice,
        }),
        submitText: getUpsellModalSubmitText({ planIDs }),
    };
};
