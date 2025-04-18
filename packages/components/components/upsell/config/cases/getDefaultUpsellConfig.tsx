import type { PlanIDs } from '@proton/payments/index';
import { CYCLE, PLANS } from '@proton/payments/index';

import { getMailUpsellsFooterText } from '../helpers/getUpsellConfigFooterText';
import { getMailUpsellsSubmitText } from '../helpers/getUpsellConfigSubmitText';
import { getUpsellPlanMonthlyPrice } from '../helpers/getupsellPlanMonthlyPrice';
import type { MailUpsellConfigCase } from '../interface';

export const getDefaultUpsellConfig: MailUpsellConfigCase = async (props) => {
    const { currency, paymentsApi, plans } = props;

    // Paid users got the bundle for 12 months displayed
    let planIDs: PlanIDs = { [PLANS.BUNDLE]: 1 };
    let cycle = CYCLE.YEARLY;
    let monthlyPrice = await getUpsellPlanMonthlyPrice({
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
        footerText: getMailUpsellsFooterText({
            planIDs,
            currency,
            monthlyPrice,
        }),
        submitText: getMailUpsellsSubmitText({
            planIDs,
        }),
    };
};
