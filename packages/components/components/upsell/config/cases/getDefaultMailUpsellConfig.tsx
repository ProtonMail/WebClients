import type { PlanIDs } from '@proton/payments/index';
import { CYCLE, PLANS, getPlanByName, isMainCurrency } from '@proton/payments/index';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';

import { getMailUpsellsFooterText } from '../helpers/getUpsellConfigFooterText';
import { getMailUpsellsSubmitText } from '../helpers/getUpsellConfigSubmitText';
import type { MailUpsellConfigCase } from '../interface';

export const getDefaultMailUpsellConfig: MailUpsellConfigCase = async (props) => {
    const { currency, paymentsApi, plans } = props;

    // Paid users got the bundle for 12 months displayed
    let planIDs: PlanIDs = { [PLANS.BUNDLE]: 1 };
    let cycle = CYCLE.YEARLY;
    let monthlyPrice = await (async () => {
        if (isMainCurrency(currency)) {
            return getPricePerCycle(getPlanByName(plans, planIDs, currency), cycle) || 0;
        }

        const result = await paymentsApi.checkWithAutomaticVersion({
            Plans: planIDs,
            Currency: currency,
            Cycle: cycle,
        });

        return result.AmountDue / 12;
    })();

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
