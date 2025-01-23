import { type CheckWithAutomaticOptions, type Currency, type RequestOptions, isMainCurrency } from '@proton/payments';
import type { CheckSubscriptionData } from '@proton/shared/lib/api/payments';

import { usePaymentsApi } from '../payments/react-extensions/usePaymentsApi';

export const useRegionalPricing = () => {
    const { paymentsApi } = usePaymentsApi();

    const fetchPrice = async ({
        data,
        defaultPrice,
        currency,
        expectedPrice = defaultPrice,
        requestOptions,
        options,
    }: {
        data: CheckSubscriptionData;
        defaultPrice: number;
        currency: Currency;
        expectedPrice?: number;
        requestOptions?: RequestOptions;
        options?: CheckWithAutomaticOptions;
    }): Promise<number> => {
        if (isMainCurrency(currency)) {
            return expectedPrice ?? defaultPrice;
        }

        try {
            const result = await paymentsApi.checkWithAutomaticVersion(data, requestOptions, options);
            return result.AmountDue ?? defaultPrice;
        } catch (e) {
            return defaultPrice;
        }
    };

    return {
        fetchPrice,
    };
};
