import {
    type CheckSubscriptionData,
    type Currency,
    type RequestOptions,
    type SubscriptionEstimation,
    isMainCurrency,
} from '@proton/payments';
import { getCheckoutUi, getOptimisticCheckResult } from '@proton/payments/core/checkout';

import { usePaymentsApi } from '../payments/react-extensions/usePaymentsApi';
import { usePreferredPlansMap } from './usePreferredPlansMap';

export const useRegionalPricing = () => {
    const { paymentsApi } = usePaymentsApi();
    const { plansMap } = usePreferredPlansMap();

    const getCheckResult = async ({
        data,
        currency,
        requestOptions,
    }: {
        data: CheckSubscriptionData;
        currency: Currency;
        requestOptions?: RequestOptions;
    }): Promise<SubscriptionEstimation> => {
        const optimisticCheckResult = getOptimisticCheckResult({
            planIDs: data.Plans,
            cycle: data.Cycle,
            currency,
            plansMap,
        });

        if (isMainCurrency(currency)) {
            return optimisticCheckResult;
        }

        try {
            return await paymentsApi.checkSubscription(data, requestOptions);
        } catch (e) {
            return optimisticCheckResult;
        }
    };

    const fetchPrice = async (requestParams: Parameters<typeof getCheckResult>[0]): Promise<number> => {
        const checkResult = await getCheckResult(requestParams);

        const checkout = getCheckoutUi({
            plansMap,
            checkResult,
            planIDs: requestParams.data.Plans,
        });

        return checkout.withDiscountPerCycle;
    };

    return {
        fetchPrice,
    };
};
