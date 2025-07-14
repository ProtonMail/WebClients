import { type ReactNode, createContext, useContext, useRef, useState } from 'react';

import useHandler from '@proton/components/hooks/useHandler';
import { type RequiredCheckResponse, getCheckout } from '@proton/shared/lib/helpers/checkout';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { defaultVPNServersCountData, getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type { BillingAddress } from '../../core/billing-address';
import { CYCLE, FREE_SUBSCRIPTION } from '../../core/constants';
import type { Currency, Cycle, PlanIDs } from '../../core/interface';
import type { Plan } from '../../core/plan/interface';
import { SelectedPlan } from '../../core/subscription/selected-plan';
import type { InitializeProps } from './PaymentContext';
import {
    PaymentsContextProvider,
    type PaymentsContextType,
    type PaymentsContextTypeInner,
    type PlanToCheck,
    usePaymentsInner,
} from './PaymentContext';

interface InitializationStatus {
    cacheInitialized: boolean;
    pricingInitialized: boolean;
    vpnServersInitialized: boolean;
}

type OptimisticOptions = PlanToCheck & {
    billingAddress: BillingAddress;
    checkResult: RequiredCheckResponse;
    vatNumber: string | undefined;
};

export type PaymentsContextOptimisticType = PaymentsContextType & {
    selectedPlan: SelectedPlan;
    loadingPaymentDetails: boolean;
    initializationStatus: InitializationStatus;
    selectPlan: (options: Parameters<PaymentsContextTypeInner['selectNewPlan']>[0]) => void;
    uiData: PaymentsContextTypeInner['uiData'];
    options: OptimisticOptions;
    vpnServersCountData: VPNServersCountData;
};

export const PaymentsContextOptimistic = createContext<PaymentsContextOptimisticType | null>(null);

interface PaymentsContextOptimisticProviderProps {
    children: ReactNode;
    preload?: boolean;
    authenticated?: boolean;
    cachedPlans?: Plan[];
}

export const InnerPaymentsContextOptimisticProvider = ({ children }: PaymentsContextOptimisticProviderProps) => {
    const paymentsContext = usePaymentsInner();

    const cacheRef = useRef<{ availablePlans?: InitializeProps['availablePlans'] }>();
    const [, rerender] = useState<any>();

    const latestOptimisticRef = useRef<any>();
    const [optimistic, setOptimistic] = useState<Partial<OptimisticOptions>>({});
    const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
    const [vpnServersCountData, setVpnServersCountData] = useState<VPNServersCountData>(defaultVPNServersCountData);
    const [initializationStatus, setInitializationStatus] = useState<InitializationStatus>({
        cacheInitialized: false,
        pricingInitialized: false,
        vpnServersInitialized: false,
    });

    const initialize: PaymentsContextOptimisticType['initialize'] = async ({
        api,
        paramCurrency,
        planToCheck: planToCheckParam,
        availablePlans,
        paymentFlow,
    }) => {
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
            vatNumber: undefined,
        };
        const checkResult = paymentsContext.getOptimisticCheckResult(optimistic);
        setOptimistic({ ...optimistic, checkResult });
        setLoadingPaymentDetails(true);

        // Fetch VPN servers count data in parallel with payments initialization
        const fetchVpnServersCount = getVPNServersCountData(api)
            .then((data) => {
                setVpnServersCountData(data);
                setInitializationStatus((prev) => ({ ...prev, vpnServersInitialized: true }));
            })
            .catch(noop);

        await Promise.all([
            paymentsContext.initialize({
                api,
                paymentFlow,
                onChargeable: async () => {},
                planToCheck: planToCheckParam,
                availablePlans,
                paramCurrency,
            }),
            fetchVpnServersCount,
        ]);

        setOptimistic({});
        setLoadingPaymentDetails(false);

        cacheRef.current = { availablePlans };

        setInitializationStatus({
            cacheInitialized: true,
            pricingInitialized: true,
            vpnServersInitialized: true,
        });
    };

    const handleOptimisticCheck = async (
        optimistic: Parameters<typeof paymentsContext.selectNewPlan>[0],
        latest: any
    ) => {
        try {
            await paymentsContext.selectNewPlan(optimistic, { subscription: FREE_SUBSCRIPTION });
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
    };
    const options: OptimisticOptions = {
        ...subscriptionCheckOptions,
        ...optimistic,
    };

    const handleOptimistic = (checkOptions: Partial<OptimisticOptions>) => {
        const mergedCheckOptions = {
            ...optimistic,
            ...checkOptions,
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
        // The multiple plans check doesn't trigger a rerender, so we need to force it to get the updated plan cards with the coupon
        rerender({});
    };

    const selectCurrency: PaymentsContextTypeInner['selectCurrency'] = async (currency) => {
        handleOptimistic({ currency });

        // This is run in the background since we render the plan cards optimistically
        updateMultiPlanCheckCacheAfterChangingCurrency(currency, options.currency).catch(noop);
    };

    const selectBillingAddress = async (billingAddress: BillingAddress) => {
        handleOptimistic({ billingAddress });
    };

    const selectedPlan = new SelectedPlan(options.planIDs, paymentsContext.plansMap, options.cycle, options.currency);

    return (
        <PaymentsContextOptimistic.Provider
            value={{
                ...paymentsContext,
                initialize,
                selectBillingAddress,
                selectCycle,
                selectCurrency,
                selectPlanIDs,
                selectPlan: handleOptimistic,
                selectedPlan,
                loadingPaymentDetails,
                initializationStatus,
                options,
                vpnServersCountData,
                uiData: {
                    checkout: getCheckout({
                        planIDs: options.planIDs,
                        plansMap: paymentsContext.plansMap,
                        checkResult: options.checkResult,
                    }),
                },
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
}: PaymentsContextOptimisticProviderProps) => {
    return (
        <PaymentsContextProvider preload={preload} authenticated={authenticated} cachedPlans={cachedPlans}>
            <InnerPaymentsContextOptimisticProvider>{children}</InnerPaymentsContextOptimisticProvider>
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
