import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    type Currency,
    type FreeSubscription,
    type FullPlansMap,
    type Plan,
    type Subscription,
    getPlansMap as getPlansMapInner,
} from '@proton/payments';
import { type UserModel } from '@proton/shared/lib/interfaces';

import { type GetPreferredCurrencyParamsHook, useCurrencies } from '../payments/client-extensions/useCurrencies';

type PreferredPlansMapHook = {
    plansMapLoading: boolean;
    plansMap: FullPlansMap;
    getPlansMap: (overrides?: GetPreferredCurrencyParamsHook) => {
        plansMap: FullPlansMap;
        preferredCurrency: Currency;
    };
    preferredCurrency: Currency;
};

export const getPreferredPlansMap = ({
    currencyOverrides,
    currencyFallback,
    getPreferredCurrency,
    user,
    subscription,
    plans,
    paymentStatus,
}: {
    currencyFallback?: boolean;
    currencyOverrides?: GetPreferredCurrencyParamsHook;
    getPreferredCurrency: ReturnType<typeof useCurrencies>['getPreferredCurrency'];
    user: UserModel;
    subscription?: Subscription | FreeSubscription;
    plans: Plan[];
    paymentStatus: ReturnType<typeof usePaymentStatus>[0];
}) => {
    const preferredCurrency = getPreferredCurrency({
        ...currencyOverrides,
        user,
        subscription,
        plans,
        paymentStatus,
    });

    return {
        preferredCurrency,
        plansMap: getPlansMapInner(plans, preferredCurrency, currencyFallback),
    };
};

export const usePreferredPlansMap = (currencyFallback?: boolean): PreferredPlansMapHook => {
    const [plansData, plansLoading] = usePlans();
    const [status, statusLoading] = usePaymentStatus();
    const [subscription, subscriptionLoading] = useSubscription();
    const [user] = useUser();
    const { getPreferredCurrency } = useCurrencies();

    const getPlansMap = (overrides: GetPreferredCurrencyParamsHook = {}) => {
        return getPreferredPlansMap({
            currencyFallback,
            currencyOverrides: overrides,
            getPreferredCurrency,
            user,
            subscription,
            plans: plansData?.plans ?? [],
            paymentStatus: status,
        });
    };

    return {
        ...getPlansMap(),
        getPlansMap,
        plansMapLoading: plansLoading || statusLoading || subscriptionLoading,
    };
};
