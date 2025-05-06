import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { useGetPaymentStatus, usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useGetPlans, usePlans } from '@proton/account/plans/hooks';
import { selectSubscription } from '@proton/account/subscription';
import { useGetSubscription } from '@proton/account/subscription/hooks';
import { getAutoCoupon } from '@proton/components/containers/payments/subscription/helpers';
import useApi from '@proton/components/hooks/useApi';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { type OnChargeable, useAutomaticCurrency, useCurrencies } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useStore } from '@proton/redux-shared-store/sharedProvider';
import {
    type EnrichedCheckResponse,
    type PaymentsCheckout,
    type RequiredCheckResponse,
    getCheckout,
    getOptimisticCheckResult,
} from '@proton/shared/lib/helpers/checkout';
import type { Api, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { type CheckSubscriptionData } from '../../core/api';
import { type BillingAddress, DEFAULT_TAX_BILLING_ADDRESS } from '../../core/billing-address';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '../../core/constants';
import type {
    Currency,
    Cycle,
    FreeSubscription,
    PaymentMethodFlows,
    PaymentMethodStatusExtended,
    PaymentsApi,
    PlanIDs,
} from '../../core/interface';
import type { FreePlanDefault, Plan, PlansMap } from '../../core/plan/interface';
import { FREE_PLAN } from '../../core/subscription/freePlans';
import { isCheckForbidden } from '../../core/subscription/helpers';
import { type FullPlansMap, type Subscription } from '../../core/subscription/interface';
import { SelectedPlan } from '../../core/subscription/selected-plan';
import { type MultiCheckGroupsResult, useMultiCheckGroups } from './useMultiCheckGroups';

export interface PlanToCheck {
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    coupon?: string;
    groupId?: string;
}

export function getPlanToCheck(params: PlanToCheck): PlanToCheck {
    const coupon = getAutoCoupon({
        coupon: params.coupon,
        planIDs: params.planIDs,
        cycle: params.cycle,
    });

    return { ...params, coupon };
}

export interface InitializeProps {
    api: Api;
    paramCurrency?: Currency;
    paymentFlow: PaymentMethodFlows;
    planToCheck?: Omit<PlanToCheck, 'currency'>;
    onChargeable: OnChargeable;
}

export interface PricesResult {
    checkResult: EnrichedCheckResponse;
    uiData: PaymentsCheckout;
}

type PaymentUiData = {
    checkout: PaymentsCheckout;
};

interface PaymentsContextTypeInner {
    createSubscription: () => Promise<void>;
    initialize: (props: InitializeProps) => Promise<void>;
    initialized: boolean;
    hasEssentialData: boolean;
    selectPlanIDs: (planIDs: PlanIDs) => Promise<void>;
    selectCycle: (cycle: Cycle) => Promise<void>;
    currency: Currency;
    selectCurrency: (currency: Currency) => Promise<void>;
    selectBillingAddress: (billingAddress: BillingAddress) => Promise<void>;
    checkMultiplePlans: (planToCheck: PlanToCheck[]) => Promise<SubscriptionCheckResponse[]>;
    /**
     * Returns the cached version of the subscription response
     */
    getPrice: (planToCheck: PlanToCheck) => PricesResult | null;
    getFallbackPrice: (planToCheck: PlanToCheck) => PricesResult;
    plans: Plan[];
    plansMap: PlansMap;

    // TODO: exposing for now. Will likely want to abstract this result
    checkResult: RequiredCheckResponse;

    // paymentFacade: ReturnType<typeof usePaymentFacade>;

    billingAddress: BillingAddress;
    uiData: PaymentUiData;
    paymentsStatus: PaymentMethodStatusExtended | undefined;
    paymentsApi: PaymentsApi;
    isGroupLoading: MultiCheckGroupsResult['isGroupLoading'];
    isGroupChecked: MultiCheckGroupsResult['isGroupChecked'];
    subscription: Subscription | FreeSubscription | undefined;
}

export type PaymentsContextType = Pick<
    PaymentsContextTypeInner,
    | 'createSubscription'
    | 'initialize'
    | 'initialized'
    | 'selectPlanIDs'
    | 'selectCycle'
    | 'currency'
    | 'selectCurrency'
    | 'selectBillingAddress'
    | 'checkMultiplePlans'
    | 'getPrice'
    | 'getFallbackPrice'
    | 'plans'
    | 'plansMap'
    | 'checkResult'
    | 'paymentsStatus'
    | 'paymentsApi'
    | 'hasEssentialData'
    | 'isGroupLoading'
    | 'isGroupChecked'
    | 'subscription'
>;

export const PaymentsContext = createContext<PaymentsContextTypeInner | null>(null);

interface PaymentsContextProviderProps {
    children: ReactNode;
    preload?: boolean;
    authenticated?: boolean;
}

export const PaymentsContextProvider = ({
    children,
    preload = true,
    authenticated = true,
}: PaymentsContextProviderProps) => {
    const store = useStore();

    const defaultApi = useApi();

    const [plansDataInitial] = usePlans();
    const [paymentStatusInitial] = usePaymentStatus();

    const getPlans = useGetPlans();
    const getPaymentStatus = useGetPaymentStatus();
    const getSubscription = useGetSubscription();
    const [plansData, setPlansData] = useState<{ plans: Plan[]; freePlan: FreePlanDefault }>(
        plansDataInitial ?? { plans: [], freePlan: FREE_PLAN }
    );
    const [paymentsStatus, setPaymentsStatus] = useState<PaymentMethodStatusExtended | undefined>(paymentStatusInitial);
    const [subscription, setSubscription] = useState<Subscription | FreeSubscription | undefined>(
        selectSubscription(store.getState()).value
    );

    const [billingAddress, setBillingAddress] = useState<BillingAddress>(DEFAULT_TAX_BILLING_ADDRESS);
    const plans = plansData.plans;
    const { getPaymentsApi, paymentsApi: initialPaymentsApi } = usePaymentsApi();
    const [paymentsApi, setPaymentsApi] = useState<PaymentsApi>(initialPaymentsApi);
    // const [onChargeableCallback, setOnChargeableCallback] = useState<OnChargeable>(() => Promise.resolve());

    const [initialized, setInitialized] = useState(false);
    const hasEssentialData = plans.length > 0 && paymentsStatus !== undefined && subscription !== undefined;

    const initialPlanIDs = { [PLANS.MAIL]: 1 };

    const [autoCurrency] = useAutomaticCurrency();

    const [planToCheck, setPlanToCheck] = useState<PlanToCheck>({
        cycle: CYCLE.MONTHLY,
        currency: autoCurrency,
        planIDs: initialPlanIDs,
        coupon: undefined,
    });
    const selectedPlan = new SelectedPlan(planToCheck.planIDs, plans, planToCheck.cycle, planToCheck.currency);

    const { getPreferredCurrency } = useCurrencies();
    // todo: implement currency selector
    // const [availableCurrencies, setAvailableCurrencies] = useState<readonly Currency[]>(mainCurrencies);

    const { plansMap: defaultPlansMap, getPlansMap } = usePreferredPlansMap(false);

    const [checkResult, setCheckResult] = useState<EnrichedCheckResponse>(
        getOptimisticCheckResult({
            cycle: planToCheck.cycle,
            planIDs: planToCheck.planIDs,
            plansMap: defaultPlansMap,
            currency: planToCheck.currency,
        })
    );

    // const [facadeParams, setFacadeParams] = useState<{
    //     flow: PaymentMethodFlows;
    // }>({
    //     flow: 'signup',
    // });

    // const paymentFacade = usePaymentFacade({
    //     checkResult,
    //     amount: checkResult.AmountDue,
    //     currency: checkResult.Currency,
    //     selectedPlanName: selectedPlan.getPlanName(),
    //     onChargeable: onChargeableCallback,
    //     paymentMethodStatusExtended: paymentsStatus,
    //     ...facadeParams,
    // });

    const multiCheckGroups = useMultiCheckGroups();

    const getSubscriptionDataFromPlanToCheck = ({
        planIDs,
        cycle,
        currency,
        coupon,
        billingAddress: newBillingAddress,
    }: PlanToCheck & { billingAddress?: BillingAddress }): CheckSubscriptionData => ({
        Plans: planIDs,
        Currency: currency,
        Cycle: cycle,
        Codes: coupon ? [coupon] : [],
        BillingAddress: newBillingAddress ?? billingAddress,
    });

    const selectNewPlan = async (
        newPlanToCheck: PlanToCheck & { billingAddress?: BillingAddress },
        {}: { subscription: Subscription | FreeSubscription } = {}
    ) => {
        const subscriptionData = getSubscriptionDataFromPlanToCheck(newPlanToCheck);

        const checkResult = await paymentsApi.checkWithAutomaticVersion(subscriptionData);

        setPlanToCheck(newPlanToCheck);
        setCheckResult(checkResult);
        paymentsApi.cacheMultiCheck(subscriptionData, undefined, checkResult);

        return checkResult;
    };

    const preloadPaymentsData = async ({ api: apiOverride }: { api?: Api } = {}) => {
        const api = apiOverride ?? defaultApi;

        const [plansData, status, subscription] = await Promise.all([
            getPlans({ api }).then((data) => {
                setPlansData(data);
                return data;
            }),
            getPaymentStatus({ api }).then((data) => {
                setPaymentsStatus(data);
                return data;
            }),
            authenticated
                ? getSubscription().then((data) => {
                      setSubscription(data);
                      return data;
                  })
                : Promise.resolve(FREE_SUBSCRIPTION),
        ]);

        return { plansData, status, subscription };
    };

    const initialize = async ({
        api,
        paramCurrency,
        planToCheck: planToCheckParam,
        // paymentFlow,
        // onChargeable,
    }: InitializeProps) => {
        const { plansData, status, subscription } = await preloadPaymentsData({ api });
        const plans = plansData.plans;

        const preferredCurrency = getPreferredCurrency({
            paramCurrency,
            status,
            plans,
        });

        const paymentsApi = getPaymentsApi(api);
        setPaymentsApi(paymentsApi);
        // setFacadeParams({ flow: paymentFlow });
        // setOnChargeableCallback(onChargeable);

        if (planToCheckParam) {
            await selectNewPlan(
                {
                    ...planToCheckParam,
                    currency: preferredCurrency,
                },
                { subscription }
            );
        }

        setInitialized(true);
    };

    useEffect(function preloadPaymentsDataOnMount() {
        if (!preload || hasEssentialData) {
            return;
        }

        preloadPaymentsData().catch(noop);
    }, []);

    const selectPlanIDs = async (planIDs: PlanIDs) => {
        await selectNewPlan({
            ...planToCheck,
            planIDs,
        });
    };

    const selectCycle = async (cycle: Cycle) => {
        await selectNewPlan({
            ...planToCheck,
            cycle,
        });
    };

    // critical: affects the checkout object (display values) and then the result of /check endpoint is used in createSubscription()
    const selectCurrency = async (currency: Currency) => {
        await selectNewPlan({
            ...planToCheck,
            currency,
        });
    };

    const selectBillingAddress = async (billingAddress: BillingAddress) => {
        setBillingAddress(billingAddress);
        await selectNewPlan({
            ...planToCheck,
            billingAddress,
        });
    };

    /**
     * This is used only for non-critical checks. For example, loading the prices for multiple plans on page loading.
     * Example: there is a coupon and it needs to be checked with different cycles/plans/currencies, etc.
     */
    const checkMultiplePlans = async (plansToCheck: PlanToCheck[]) => {
        const checkSubscriptionData = plansToCheck
            .map((planToCheck) => getSubscriptionDataFromPlanToCheck(planToCheck))
            .map((datum) => (isCheckForbidden(subscription, datum.Plans, datum.Cycle) ? null : datum));

        const indexesToExcludeFromCheck: number[] = [];
        const truthySubscriptionData = checkSubscriptionData.filter((data, index) => {
            if (data === null) {
                indexesToExcludeFromCheck.push(index);
            }

            return data !== null;
        });

        const resultsPromise = paymentsApi.multiCheck(truthySubscriptionData, { cached: true, silence: true });

        plansToCheck
            .map((planToCheck) => planToCheck.groupId)
            .filter(isTruthy)
            .forEach((groupId) => multiCheckGroups.addPromiseToGroup(groupId, resultsPromise));

        const results = await resultsPromise;
        const normalizedResults: EnrichedCheckResponse[] = [];

        let checkedIndex = 0;
        for (let index = 0; index < plansToCheck.length; index++) {
            if (indexesToExcludeFromCheck.includes(index)) {
                const planToCheck = plansToCheck[index];

                const localizedPlansMap = getPlansMap({
                    paramCurrency: planToCheck.currency,
                }).plansMap;

                normalizedResults.push(getOptimisticCheckResult({ plansMap: localizedPlansMap, ...planToCheck }));
            } else {
                normalizedResults.push(results[checkedIndex]);
                checkedIndex++;
            }
        }

        return normalizedResults;
    };

    const getPrice = (planToCheck: PlanToCheck) => {
        const subscriptionData = getSubscriptionDataFromPlanToCheck(planToCheck);

        const localizedPlansMap = getPlansMap({
            paramCurrency: planToCheck.currency,
        }).plansMap;

        let result: EnrichedCheckResponse | undefined;
        if (planToCheck.coupon) {
            result = paymentsApi.getCachedCheck(subscriptionData);
        } else {
            result = getOptimisticCheckResult({ plansMap: localizedPlansMap, ...planToCheck });
        }

        /**
         * Cache miss
         */
        if (!result) {
            return null;
        }

        return {
            checkResult: result,
            uiData: getCheckout({ planIDs: planToCheck.planIDs, plansMap: localizedPlansMap, checkResult: result }),
        };
    };

    const getFallbackPrice = (planToCheck: PlanToCheck): PricesResult => {
        const localizedPlansMap = getPlansMap({
            paramCurrency: planToCheck.currency,
        }).plansMap;

        const checkResult = getOptimisticCheckResult({ plansMap: localizedPlansMap, ...planToCheck });

        return {
            checkResult,
            uiData: getCheckout({ planIDs: planToCheck.planIDs, plansMap: localizedPlansMap, checkResult }),
        };
    };

    const isGroupLoading = multiCheckGroups.isGroupLoading;
    const isGroupChecked = multiCheckGroups.isGroupChecked;

    const value: PaymentsContextTypeInner = {
        createSubscription: async () => {},
        initialize,
        initialized,
        selectPlanIDs,
        selectCycle,
        currency: selectedPlan.currency,
        selectCurrency,
        selectBillingAddress,
        checkMultiplePlans,
        plans,
        plansMap: defaultPlansMap,
        getPrice,
        getFallbackPrice,
        checkResult,
        // paymentFacade,
        billingAddress,
        uiData: {
            checkout: getCheckout({ planIDs: checkResult.requestData.Plans, plansMap: defaultPlansMap, checkResult }),
        },
        paymentsStatus,
        paymentsApi,
        hasEssentialData,
        isGroupLoading,
        isGroupChecked,
        subscription,
    };

    return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
};

export const usePaymentsInner = (): PaymentsContextTypeInner => {
    const state = useContext(PaymentsContext);

    if (!state) {
        throw new Error('Expected to be within PaymentsContextProvider');
    }

    return state;
};

export const usePayments = usePaymentsInner as () => PaymentsContextType;

export type PreloadedPaymentsContextType = Omit<PaymentsContextType, 'paymentsStatus'> & {
    paymentsStatus: PaymentMethodStatusExtended;
    plansMap: FullPlansMap;
    subscription: Subscription | FreeSubscription;
};

export const usePaymentsPreloaded = (): PreloadedPaymentsContextType => {
    const payments = usePaymentsInner();
    if (!payments.hasEssentialData) {
        console.warn('Payments context did not preload the essential data.');
    }

    return payments as PreloadedPaymentsContextType;
};
