import { CYCLE, PLANS } from '@proton/payments';

import { getUpsellModalFooterText } from '../helpers/getUpsellModalFooterText';
import { getUpsellModalSubmitText } from '../helpers/getUpsellModalSubmitText';
import { getUpsellPlanMonthlyPrice } from '../helpers/getUpsellPlanMonthlyPrice';
import type { UpsellModalConfigCase } from '../interface';

export const getUpsellModalBookingsConfig: UpsellModalConfigCase = async (props) => {
    const { currency, paymentsApi, plans, user } = props;
    const plan = user.hasPaidMail ? PLANS.BUNDLE_BIZ_2025 : PLANS.MAIL;
    const planIDs = { [plan]: 1 };
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
