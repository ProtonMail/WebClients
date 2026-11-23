import { type ReactNode, createContext, useContext, useRef, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';

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

interface InitializationStatus {
    /**
     * Has initialization been triggered?
     * ie has the correct default plan been set, and can we start rendering with a preselected plan
     */
    triggered: boolean;
    pricingInitialized: boolean;
    /** Why the initialization failed, when the plans or the prices couldn't be loaded */
    error?: unknown;
}

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
    selectedPlan: SelectedPlan;
    loadingPaymentDetails: boolean;
    initializationStatus: InitializationStatus;
    selectPlan: (checkOptions: Partial<OptimisticOptions>) => void;
    checkoutUi: PaymentsContextType['checkoutUi'];
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
}: PaymentsContextOptimisticProviderProps) => {
    const paymentsContext = usePayments();

    const cacheRef = useRef<{ availablePlans?: InitializeProps['availablePlans'] }>(undefined);

    const latestOptimisticRef = useRef<object | undefined>(undefined);
    const [optimistic, setOptimistic] = useState<Partial<OptimisticOptions>>({});
    const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
    const [checkingPlans, setCheckingPlans] = useState<PlanToCheck[][]>([]);
    const [initializationStatus, setInitializationStatus] = useState<InitializationStatus>({
        triggered: false,
        pricingInitialized: false,
    });

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

    const initialize: PaymentsContextOptimisticType['initialize'] = async ({
        api,
        paramCurrency,
        planToCheck: planToCheckParam,
        availablePlans,
        vatNumber,
        telemetryContext,
        product,
    }) => {
        /**
         * Track this initialization to prevent race conditions with user actions
         */
        const latest = {};
        latestOptimisticRef.current = latest;

        /**
         * Optimistic check result initialization
         */
        const currency = paramCurrency || 'CHF';
        const optimistic: Omit<OptimisticOptions, 'checkResult'> = {
            currency,
            planIDs: getPlanIDsWithinSeatLimits(planToCheckParam?.planIDs, currency),
            cycle: planToCheckParam?.cycle || CYCLE.MONTHLY,
            billingAddress: {
                CountryCode: '',
                State: '',
            },
            vatNumber,
            trial: planToCheckParam?.trial,
            coupon: planToCheckParam?.coupon,
        };
        const checkResult = paymentsContext.getOptimisticCheckResult(optimistic);
        setOptimistic({ ...optimistic, checkResult });

        setInitializationStatus((prev) => ({ ...prev, triggered: true, error: undefined }));
        setLoadingPaymentDetails(true);

        try {
            await paymentsContext.initialize({
                api,
                planToCheck: planToCheckParam,
                availablePlans,
                paramCurrency,
                vatNumber,
                telemetryContext,
                product,
            });
        } catch (error) {
            setInitializationStatus((prev) => ({ ...prev, error }));
            throw error;
        }

        // Only clear optimistic state if this initialization is still the latest operation
        // This prevents race conditions where user actions during initialization would be overridden
        if (latestOptimisticRef.current === latest) {
            setOptimistic({});
            setLoadingPaymentDetails(false);
        }

        cacheRef.current = { availablePlans };

        setInitializationStatus((prev) => ({
            ...prev,
            pricingInitialized: true,
        }));
    };

    const handleOptimisticCheck = async (
        optimistic: Parameters<typeof paymentsContext.selectNewPlan>[0],
        latest: object
    ) => {
        try {
            await paymentsContext.selectNewPlan(optimistic);
            if (latestOptimisticRef.current === latest) {
                setOptimistic({});
            }
        } catch (e) {
            if (latestOptimisticRef.current === latest) {
                // Reset any optimistic state on failures
                setOptimistic({});
                return;
            }
        } finally {
            if (latestOptimisticRef.current === latest) {
                setLoadingPaymentDetails(false);
            }
        }
    };

    const debouncedCheck = useHandler(
        (optimistic: Parameters<typeof paymentsContext.selectNewPlan>[0], latest: object) => {
            handleOptimisticCheck(optimistic, latest).catch(noop);
        },
        { debounce: 400 }
    );

    const subscriptionCheckOptions = {
        planIDs: paymentsContext.selectedPlan.planIDs,
        cycle: paymentsContext.selectedPlan.cycle,
        currency: paymentsContext.selectedPlan.currency,
        billingAddress: paymentsContext.billingAddress,
        checkResult: paymentsContext.checkResult,
        vatNumber: paymentsContext.vatNumber,
        trial: paymentsContext.checkResult.SubscriptionMode === SubscriptionMode.Trial,
    };
    const options: OptimisticOptions = {
        ...subscriptionCheckOptions,
        ...optimistic,
        checkResult: {
            ...subscriptionCheckOptions.checkResult,
            ...optimistic.checkResult,
        },
    };

    const handleOptimistic = (checkOptions: Partial<OptimisticOptions>) => {
        const mergedCheckOptions = {
            ...optimistic,
            ...checkOptions,
            trial: checkOptions.trial || false, // Necessary to override trial to false if the option is not provided
        };

        const completeCheckOptions = {
            ...subscriptionCheckOptions,
            ...mergedCheckOptions,
        };

        if (!completeCheckOptions.coupon) {
            // First, it attempts to get a coupon with the current parameters.
            let lastRememberedCouponForPlan = paymentsContext.getCoupon(completeCheckOptions);
            // If there's none, and if the currency is being changed, it attempts to get a coupon with the old currency.
            // This needs to happen because changing currency is updating the multi plan check in the background and the results may not be ready.
            if (!lastRememberedCouponForPlan && options.currency !== completeCheckOptions.currency) {
                lastRememberedCouponForPlan = paymentsContext.getCoupon({
                    ...completeCheckOptions,
                    currency: options.currency,
                });
            }
            if (lastRememberedCouponForPlan) {
                completeCheckOptions.coupon = lastRememberedCouponForPlan;
            }
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

        setOptimistic({
            ...mergedCheckOptions,
            checkResult: optimisticCheckResult,
        });
        const latest = {};
        latestOptimisticRef.current = latest;
        setLoadingPaymentDetails(true);
        debouncedCheck(completeCheckOptions, latest);
    };

    const selectPlanIDs = async (planIDs: PlanIDs) => {
        handleOptimistic({ planIDs });
    };

    const selectCycle = async (cycle: Cycle) => {
        handleOptimistic({ cycle });
    };

    const checkMultiplePlans: PaymentsContextType['checkMultiplePlans'] = async (plansToCheck) => {
        setCheckingPlans((checking) => [...checking, plansToCheck]);
        try {
            return await paymentsContext.checkMultiplePlans(plansToCheck);
        } finally {
            setCheckingPlans((checking) => checking.filter((plans) => plans !== plansToCheck));
        }
    };

    const getPriceOrFallback: PaymentsContextOptimisticType['getPriceOrFallback'] = (planToCheck) => {
        // Any coupon: a card that takes it from `getCoupon` has none in a new currency until this check returns
        const isChecked = checkingPlans.some((plans) =>
            plans.some(
                (plan) =>
                    plan.currency === planToCheck.currency &&
                    plan.cycle === planToCheck.cycle &&
                    isDeepEqual(plan.planIDs, planToCheck.planIDs)
            )
        );
        return {
            ...paymentsContext.getPriceOrFallback(planToCheck),
            loading: !initializationStatus.pricingInitialized || isChecked,
        };
    };

    const updateMultiPlanCheckCacheAfterChangingCurrency = async (newCurrency: Currency, oldCurrency: Currency) => {
        const availablePlans = cacheRef.current?.availablePlans;
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
        await checkMultiplePlans(plansWithCouponAndCurrency);
    };

    const selectCurrency: PaymentsContextType['selectCurrency'] = async (currency) => {
        handleOptimistic({ currency });

        // This is run in the background since we render the plan cards optimistically
        updateMultiPlanCheckCacheAfterChangingCurrency(currency, options.currency).catch(noop);
    };

    const selectedPlan = new SelectedPlan(options.planIDs, paymentsContext.plansMap, options.cycle, options.currency);

    return (
        <PaymentsContextOptimistic.Provider
            value={{
                ...paymentsContext,
                initialize,
                selectCycle,
                selectCurrency,
                selectPlanIDs,
                selectPlan: handleOptimistic,
                checkMultiplePlans,
                getPriceOrFallback,
                selectedPlan,
                loadingPaymentDetails: loadingPaymentDetails || paymentsContext.loading,
                initializationStatus,
                options,
                loadingTotal:
                    !initializationStatus.pricingInitialized ||
                    ((loadingPaymentDetails || paymentsContext.loading) &&
                        // Unless the selection already shows its price, the plan cards' for the details asked for
                        !isCheckedFor(optimistic.checkResult, paymentsContext.getRequested())),
                loadingPrice:
                    !initializationStatus.pricingInitialized ||
                    (!!optimistic.checkResult?.optimistic && !!optimistic.checkResult.requestData.Codes?.length),
                optimisticPaymentStatus:
                    paymentsContext.paymentStatus ?? getOptimisticPaymentStatus(optimisticVendorStates),
                checkoutUi: getCheckoutUi({
                    planIDs: options.planIDs,
                    plansMap: paymentsContext.plansMap,
                    checkResult: options.checkResult,
                }),
            }}
        >
            {children}
        </PaymentsContextOptimistic.Provider>
    );
};

export const PaymentsContextOptimisticProvider = ({
    children,
    preload,
    authenticated,
    cachedPlans,
    optimisticVendorStates,
    billingDetails,
}: PaymentsContextOptimisticProviderProps) => {
    return (
        <PaymentsContextProvider
            preload={preload}
            authenticated={authenticated}
            cachedPlans={cachedPlans}
            billingDetails={billingDetails}
        >
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
