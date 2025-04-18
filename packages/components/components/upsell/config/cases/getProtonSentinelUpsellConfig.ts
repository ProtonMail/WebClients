import { CYCLE, PLANS, getPlanByName, isMainCurrency } from '@proton/payments/index';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';

import { getMailUpsellsFooterText } from '../helpers/getUpsellConfigFooterText';
import { getMailUpsellsSubmitText } from '../helpers/getUpsellConfigSubmitText';
import type { MailUpsellConfigCase } from '../interface';

export const getProtonSentinelUpsellConfig: MailUpsellConfigCase = async (props) => {
    const { currency, paymentsApi, plans } = props;
    const planIDs = { [PLANS.BUNDLE]: 1 };
    const cycle = CYCLE.YEARLY;

    const monthlyPrice = await (async () => {
        if (!isMainCurrency(currency)) {
            const result = await paymentsApi.checkWithAutomaticVersion({
                Plans: planIDs,
                Currency: currency,
                Cycle: cycle,
            });
            return result.AmountDue / 12;
        }

        const yearlyPrice = getPricePerCycle(getPlanByName(plans, planIDs, currency), cycle) || 0;
        return yearlyPrice / 12;
    })();

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
