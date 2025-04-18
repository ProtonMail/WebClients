import { CYCLE, PLANS } from '@proton/payments/index';

import { getMailUpsellsFooterText } from '../helpers/getUpsellConfigFooterText';
import { getMailUpsellsSubmitText } from '../helpers/getUpsellConfigSubmitText';
import { getUpsellPlanMonthlyPrice } from '../helpers/getupsellPlanMonthlyPrice';
import type { MailUpsellConfigCase } from '../interface';

export const getProtonSentinelUpsellConfig: MailUpsellConfigCase = async (props) => {
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
        footerText: getMailUpsellsFooterText({
            planIDs,
            currency,
            monthlyPrice,
        }),
        submitText: getMailUpsellsSubmitText({ planIDs }),
    };
};
