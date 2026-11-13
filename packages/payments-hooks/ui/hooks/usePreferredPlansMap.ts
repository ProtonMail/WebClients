import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getPreferredCurrency } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';
import type { FullPlansMap } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import { getPlansMap as getPlansMapInner } from '@proton/payments/core/subscription/plans-map-wrapper';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import { useMultiSubscriptionContext } from '../../react-extensions/useMultiSubscriptionContext';

type PreferredCurrencyOverrides = Partial<Parameters<typeof getPreferredCurrency>[0]>;

type PreferredPlansMapHook = {
    plansMapLoading: boolean;
    plansMap: FullPlansMap;
    getPlansMap: (overrides?: PreferredCurrencyOverrides) => {
        plansMap: FullPlansMap;
        preferredCurrency: Currency;
    };
    preferredCurrency: Currency;
};

export const getPreferredPlansMap = ({
    currencyOverrides,
    currencyFallback,
    user,
    multiSubscriptionContext,
    plans,
    paymentStatus,
}: {
    currencyFallback?: boolean;
    currencyOverrides?: PreferredCurrencyOverrides;
    user: UserModel | undefined;
    multiSubscriptionContext: MultiSubscriptionContext;
    plans: Plan[];
    paymentStatus: ReturnType<typeof usePaymentStatus>[0];
}) => {
    const preferredCurrency = getPreferredCurrency({
        ...currencyOverrides,
        user,
        multiSubscriptionContext,
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
    const [, subscriptionLoading] = useSubscription();
    const multiSubscriptionContext = useMultiSubscriptionContext();
    const [user] = useUser();

    const getPlansMap = (overrides: PreferredCurrencyOverrides = {}) => {
        return getPreferredPlansMap({
            currencyFallback,
            currencyOverrides: overrides,
            user,
            multiSubscriptionContext,
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
