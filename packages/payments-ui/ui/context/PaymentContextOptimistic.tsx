import { type ReactNode, createContext, useContext, useRef, useState } from 'react';

import { forceAddonsMinMaxConstraints } from '@proton/components/containers/payments/planCustomizer/helpers';
import { useHandler } from '@proton/hooks/useHandler';
import type { InitializeProps, PricesResult } from '@proton/payments-hooks/ui/context/paymentsContext';
import { type PaymentsContextType, usePayments } from '@proton/payments-hooks/ui/context/paymentsContext';
import type { BillingAddress } from '@proton/payments/core/billing-address/billing-address';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { CYCLE } from '@proton/payments/core/constants';
import type { Currency, Cycle, PaymentStatus, PlanIDs } from '@proton/payments/core/interface';
import { getOptimisticPaymentStatus } from '@proton/payments/core/payment-status';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { PaymentsContextProvider, type PaymentsContextProviderProps } from './PaymentContext';
import { isCheckedFor } from './helpers';

type OptimisticOptions = PlanToCheck & {
    billingAddress: BillingAddress;
    checkResult: SubscriptionEstimation;
    vatNumber: string | undefined;
};

/**
 * `options`, `selectedPlan` and `checkoutUi` show the latest choice at once, estimated until its check returns. The
 * other fields, such as `checkResult`, `coupon` and `billingAddress`, are the last checked values. `selectPlan` and the
 * `select*` functions check 400 ms later and resolve before that; `selectNewPlan` checks now and returns the result.
 */
export type PaymentsContextOptimisticType = Omit<PaymentsContextType, 'getPriceOrFallback'> & {
    loadingPaymentDetails: boolean;
    selectPlan: (checkOptions: Partial<OptimisticOptions>) => void;
    options: OptimisticOptions;
    /** `options.checkResult`'s price is estimated without its coupon's discount until the prices load or the check returns */
    loadingPrice: boolean;
    /**
     * `options.checkResult`'s total and taxes may still change: until the prices load, or while a check runs, unless the
     * selection already holds its price, checked with the taxes for the plan cards for billing details still in place
     */
    loadingTotal: boolean;
    /** The checked price, or the list price, and whether it's still loading: until the prices load, or while it's checked */
    getPriceOrFallback: (planToCheck: PlanToCheck) => PricesResult & { loading: boolean };
    /** The payment status, or a guess until it loads, so the payment methods don't pop in */
    optimisticPaymentStatus: PaymentStatus;
};

const PaymentsContextOptimistic = createContext<PaymentsContextOptimisticType | null>(null);

interface PaymentsContextOptimisticProviderProps {
    children: ReactNode;
    preload?: boolean;
    authenticated?: boolean;
    cachedPlans?: Plan[];
    /** Payment methods the page offers beyond the usual ones, guessed active until the payment status loads */
    optimisticVendorStates?: Partial<PaymentStatus['VendorStates']>;
    billingDetails?: PaymentsContextProviderProps['billingDetails'];
}

const InnerPaymentsContextOptimisticProvider = ({
    children,
    optimisticVendorStates,
}: Pick<PaymentsContextOptimisticProviderProps, 'children' | 'optimisticVendorStates'>) => {
    const paymentsContext = usePayments();

    const availablePlansRef = useRef<InitializeProps['availablePlans']>(undefined);

    // The choice that isn't checked yet, there while its check is waited for
    const [pending, setPending] = useState<Partial<OptimisticOptions>>();
    const pricesLoaded = paymentsContext.initializationStatus.pricingInitialized;

    const getPlanIDsWithinSeatLimits = (planIDs: PlanIDs | undefined, currency: Currency): PlanIDs => {
        if (!planIDs) {
            return {};
        }
        return (
            forceAddonsMinMaxConstraints({
                selectedPlanIDs: planIDs,
                plansMap: paymentsContext.plansMap,
                currency,
                subscription: undefined,
            }) ?? planIDs
        );
    };

    // Only the latest choice is cleared, so an older check that returns doesn't override a newer choice
    const settle = (choice: Partial<OptimisticOptions>) =>
        setPending((current) => (current === choice ? undefined : current));

    const initialize: PaymentsContextOptimisticType['initialize'] = async (props) => {
        const { paramCurrency, planToCheck, vatNumber } = props;
        const currency = paramCurrency || 'CHF';
        const initial: Omit<OptimisticOptions, 'checkResult'> = {
            currency,
            planIDs: getPlanIDsWithinSeatLimits(planToCheck?.planIDs, currency),
            cycle: planToCheck?.cycle || CYCLE.MONTHLY,
            billingAddress: {
                CountryCode: '',
                State: '',
            },
            vatNumber,
            trial: planToCheck?.trial,
            coupon: planToCheck?.coupon,
        };
        const choice = { ...initial, checkResult: paymentsContext.getOptimisticCheckResult(initial) };
        setPending(choice);

        await paymentsContext.initialize(props);

        settle(choice);

        availablePlansRef.current = props.availablePlans;
    };

    const debouncedCheck = useHandler(
        (planToCheck: PlanToCheck, choice: Partial<OptimisticOptions>) => {
            // A failed check clears the estimate like a successful one
            void paymentsContext
                .selectNewPlan(planToCheck)
                .catch(noop)
                .then(() => settle(choice));
        },
        { debounce: 400 }
    );

    const checked = {
        planIDs: paymentsContext.selectedPlan.planIDs,
        cycle: paymentsContext.selectedPlan.cycle,
        currency: paymentsContext.selectedPlan.currency,
        billingAddress: paymentsContext.billingAddress,
        checkResult: paymentsContext.checkResult,
        vatNumber: paymentsContext.vatNumber,
        trial: paymentsContext.checkResult.SubscriptionMode === SubscriptionMode.Trial,
    };
    const options: OptimisticOptions = {
        ...checked,
        ...pending,
        checkResult: {
            ...checked.checkResult,
            ...pending?.checkResult,
        },
    };

    // The coupon of the plan's last check. A change of currency checks the plans again in the background, so until
    // those results are in, the coupon of the old currency is used
    const getRememberedCoupon = (planToCheck: PlanToCheck) =>
        paymentsContext.getCoupon(planToCheck) ||
        (options.currency !== planToCheck.currency
            ? paymentsContext.getCoupon({ ...planToCheck, currency: options.currency })
            : undefined);

    const selectPlan = (checkOptions: Partial<OptimisticOptions>) => {
        const mergedCheckOptions = {
            ...pending,
            ...checkOptions,
            trial: checkOptions.trial || false, // Necessary to override trial to false if the option is not provided
        };

        const completeCheckOptions = {
            ...checked,
            ...mergedCheckOptions,
        };

        const coupon = completeCheckOptions.coupon || getRememberedCoupon(completeCheckOptions);
        if (coupon) {
            completeCheckOptions.coupon = coupon;
        }

        const cachedPrice = paymentsContext.getPrice(completeCheckOptions)?.checkResult;
        const cardPrice = isCheckedFor(cachedPrice, paymentsContext.getRequested()) ? cachedPrice : undefined;
        const optimisticCheckResult =
            cardPrice ??
            paymentsContext.getOptimisticCheckResult({
                planIDs: completeCheckOptions.planIDs,
                cycle: completeCheckOptions.cycle,
                currency: completeCheckOptions.currency,
                coupon: completeCheckOptions.coupon,
            });

        const choice = { ...mergedCheckOptions, checkResult: optimisticCheckResult };
        setPending(choice);
        debouncedCheck(completeCheckOptions, choice);
    };

    const selectPlanIDs = async (planIDs: PlanIDs) => {
        selectPlan({ planIDs });
    };

    const selectCycle = async (cycle: Cycle) => {
        selectPlan({ cycle });
    };

    const getPriceOrFallback: PaymentsContextOptimisticType['getPriceOrFallback'] = (planToCheck) => ({
        ...paymentsContext.getPriceOrFallback(planToCheck),
        loading: !pricesLoaded || paymentsContext.isCheckingPrice(planToCheck),
    });

    const updateMultiPlanCheckCacheAfterChangingCurrency = async (newCurrency: Currency, oldCurrency: Currency) => {
        const availablePlans = availablePlansRef.current;
        if (!availablePlans?.length) {
            return;
        }
        const plansWithCouponAndCurrency = availablePlans
            .map((plan) => {
                const existingCoupon = paymentsContext.getCoupon({ ...plan, currency: newCurrency });
                // If the coupon is already cached for this currency, we don't need to refetch it
                if (existingCoupon) {
                    return;
                }
                const coupon = paymentsContext.getCoupon({ ...plan, currency: oldCurrency });
                // If no coupon exists for the old currency, we don't retry with the new currency
                if (!coupon) {
                    return null;
                }
                return { ...plan, currency: newCurrency, coupon };
            })
            .filter(isTruthy);
        if (!plansWithCouponAndCurrency.length) {
            return;
        }
        await paymentsContext.checkMultiplePlans(plansWithCouponAndCurrency);
    };

    const selectCurrency: PaymentsContextType['selectCurrency'] = async (currency) => {
        selectPlan({ currency });

        // This is run in the background since we render the plan cards optimistically
        updateMultiPlanCheckCacheAfterChangingCurrency(currency, options.currency).catch(noop);
    };

    const selectedPlan = new SelectedPlan(options.planIDs, paymentsContext.plansMap, options.cycle, options.currency);

    const checking = !!pending || paymentsContext.loading;

    const value: PaymentsContextOptimisticType = {
        ...paymentsContext,
        initialize,
        selectCycle,
        selectCurrency,
        selectPlanIDs,
        selectPlan,
        getPriceOrFallback,
        selectedPlan,
        loadingPaymentDetails: checking,
        options,
        loadingTotal:
            !pricesLoaded ||
            // Unless the selection already shows its price, the plan cards' for the details asked for
            (checking && !isCheckedFor(pending?.checkResult, paymentsContext.getRequested())),
        loadingPrice:
            !pricesLoaded || (!!pending?.checkResult?.optimistic && !!pending.checkResult.requestData.Codes?.length),
        optimisticPaymentStatus: paymentsContext.paymentStatus ?? getOptimisticPaymentStatus(optimisticVendorStates),
        checkoutUi: getCheckoutUi({
            planIDs: options.planIDs,
            plansMap: paymentsContext.plansMap,
            checkResult: options.checkResult,
        }),
    };

    return <PaymentsContextOptimistic.Provider value={value}>{children}</PaymentsContextOptimistic.Provider>;
};

export const PaymentsContextOptimisticProvider = ({
    children,
    optimisticVendorStates,
    ...providerProps
}: PaymentsContextOptimisticProviderProps) => {
    return (
        <PaymentsContextProvider {...providerProps}>
            <InnerPaymentsContextOptimisticProvider optimisticVendorStates={optimisticVendorStates}>
                {children}
            </InnerPaymentsContextOptimisticProvider>
        </PaymentsContextProvider>
    );
};

export const usePaymentOptimistic = (): PaymentsContextOptimisticType => {
    const state = useContext(PaymentsContextOptimistic);

    if (!state) {
        throw new Error('Expected to be within PaymentsContextOptimisticProvider');
    }

    return state;
};
