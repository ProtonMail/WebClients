import { type CheckWithAutomaticOptions, type Currency, type RequestOptions, isMainCurrency } from '@proton/payments';
import type { CheckSubscriptionData } from '@proton/shared/lib/api/payments';

import { usePaymentsApi } from '../payments/react-extensions/usePaymentsApi';

export const useRegionalPricing = () => {
    const { paymentsApi } = usePaymentsApi();

    const fetchPrice = async ({
        data,
        defaultPrice,
        currency,
        expectedPrice,
        requestOptions,
        options,
    }: {
        data: CheckSubscriptionData;
        defaultPrice: number;
        currency: Currency;
        expectedPrice?: number;
        requestOptions?: RequestOptions;
        options?: CheckWithAutomaticOptions;
    }) => {
        const isDefaultAmountDue = isMainCurrency(currency);
        if (isDefaultAmountDue) {
            return expectedPrice || defaultPrice;
        }

        const result = await paymentsApi.checkWithAutomaticVersion(data, requestOptions, options);
        if (result.AmountDue) {
            return result.AmountDue;
        }

        return defaultPrice;
    };

    return {
        fetchPrice,
    };
};
