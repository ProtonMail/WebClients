import { type ReactNode, createContext, useContext, useRef, useState } from 'react';

import { useHandler } from '@proton/hooks/useHandler';
import type { InitializeProps } from '@proton/payments-hooks/ui/context/paymentsContext';
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

interface InitializationStatus {
    /**
     * Has initialization been triggered?
     * ie has the correct default plan been set, and can we start rendering with a preselected plan
     */
    triggered: boolean;
    cacheInitialized: boolean;
    pricingInitialized: boolean;
    /** Why the initialization failed, when the plans or the prices couldn't be loaded */
    error?: unknown;
}

type OptimisticOptions = PlanToCheck & {
    billingAddress: BillingAddress;
    checkResult: SubscriptionEstimation;
    vatNumber: string | undefined;
};

export type PaymentsContextOptimisticType = PaymentsContextType & {
    selectedPlan: SelectedPlan;
    loadingPaymentDetails: boolean;
    initializationStatus: InitializationStatus;
    selectPlan: (checkOptions: Partial<OptimisticOptions>) => void;
    checkoutUi: PaymentsContextType['checkoutUi'];
    options: OptimisticOptions;
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

    const latestOptimisticRef = useRef<any>(undefined);
    const [optimistic, setOptimistic] = useState<Partial<OptimisticOptions>>({});
    const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
    const [initializationStatus, setInitializationStatus] = useState<InitializationStatus>({
        triggered: false,
        cacheInitialized: false,
        pricingInitialized: false,
    });

    const initialize: PaymentsContextOptimisticType['initialize'] = async ({
        api,
        paramCurrency,
        planToCheck: planToCheckParam,
        availablePlans,
        paymentFlow,
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
        const optimistic: Omit<OptimisticOptions, 'checkResult'> = {
            currency: paramCurrency || 'CHF',
            planIDs: planToCheckParam?.planIDs || {},
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
                paymentFlow,
                onChargeable: async () => {},
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
            cacheInitialized: true,
            pricingInitialized: true,
        }));
    };

    const handleOptimisticCheck = async (
        optimistic: Parameters<typeof paymentsContext.selectNewPlan>[0],
        latest: any
    ) => {
        try {
            await paymentsContext.selectNewPlan(optimistic);
            if (latestOptimisticRef.current === latest) {
                setOptimistic({});
            }
        } catch (e) {
            if (latestOptimisticRef.current === latest) {
                //handleError(e);
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
        (optimistic: Parameters<typeof paymentsContext.selectNewPlan>[0], latest: any) => {
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

        const optimisticCheckResult = paymentsContext.getOptimisticCheckResult({
            planIDs: completeCheckOptions.planIDs,
            cycle: completeCheckOptions.cycle,
            currency: completeCheckOptions.currency,
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
        await paymentsContext.checkMultiplePlans(plansWithCouponAndCurrency);
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
                selectedPlan,
                loadingPaymentDetails: loadingPaymentDetails || paymentsContext.loading,
                initializationStatus,
                options,
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
