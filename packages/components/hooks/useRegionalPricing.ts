import { type CheckSubscriptionData, type Currency, type RequestOptions, isMainCurrency } from '@proton/payments';

import { usePaymentsApi } from '../payments/react-extensions/usePaymentsApi';

export const useRegionalPricing = () => {
    const { paymentsApi } = usePaymentsApi();

    const fetchPrice = async ({
        data,
        defaultPrice,
        currency,
        expectedPrice = defaultPrice,
        requestOptions,
    }: {
        data: CheckSubscriptionData;
        defaultPrice: number;
        currency: Currency;
        expectedPrice?: number;
        requestOptions?: RequestOptions;
    }): Promise<number> => {
        if (isMainCurrency(currency)) {
            return expectedPrice ?? defaultPrice;
        }

        try {
            const result = await paymentsApi.checkSubscription(data, requestOptions);
            return result.AmountDue ?? defaultPrice;
        } catch (e) {
            return defaultPrice;
        }
    };

    return {
        fetchPrice,
    };
};
