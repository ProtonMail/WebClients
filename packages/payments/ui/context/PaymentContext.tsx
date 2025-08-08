import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

import { useGetPaymentStatus, usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useGetPlans, usePlans } from '@proton/account/plans/hooks';
import { selectSubscription } from '@proton/account/subscription';
import { useGetSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getAutoCoupon } from '@proton/components/containers/payments/subscription/helpers';
import useApi from '@proton/components/hooks/useApi';
import { getPreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import {
    type GetPreferredCurrencyParamsHook,
    type OnChargeable,
    useCurrencies,
} from '@proton/components/payments/client-extensions';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useStore } from '@proton/redux-shared-store/sharedProvider';
import {
    type EnrichedCheckResponse,
    type PaymentsCheckout,
    type RequiredCheckResponse,
    getCheckout,
    getOptimisticCheckResult as innerGetOptimisticCheckResult,
} from '@proton/shared/lib/helpers/checkout';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import type { Api } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { type CheckSubscriptionData } from '../../core/api';
import { type BillingAddress, DEFAULT_TAX_BILLING_ADDRESS } from '../../core/billing-address/billing-address';
import { getBillingAddressFromPaymentStatus } from '../../core/billing-address/billing-address-from-payments-status';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '../../core/constants';
import { type getAvailableCurrencies, type getPreferredCurrency, mainCurrencies } from '../../core/helpers';
import type {
    Currency,
    Cycle,
    FreeSubscription,
    PaymentMethodFlow,
    PaymentStatus,
    PaymentsApi,
    PlanIDs,
} from '../../core/interface';
import { getPlanFromPlanIDs } from '../../core/plan/helpers';
import type { FreePlanDefault, Plan, PlansMap } from '../../core/plan/interface';
import { hasFreePlanIDs } from '../../core/planIDs';
import { FREE_PLAN } from '../../core/subscription/freePlans';
import { isCheckForbidden } from '../../core/subscription/helpers';
import {
    type FullPlansMap,
    type Subscription,
    type SubscriptionCheckResponse,
} from '../../core/subscription/interface';
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
    paymentFlow: PaymentMethodFlow;
    planToCheck?: Omit<PlanToCheck, 'currency'>;
    onChargeable: OnChargeable;
    availablePlans?: { planIDs: PlanIDs; cycle: Cycle }[];
}

export interface PricesResult {
    checkResult: EnrichedCheckResponse;
    uiData: PaymentsCheckout;
}

type PaymentUiData = {
    checkout: PaymentsCheckout;
};

const getSubscriptionDataFromPlanToCheck = (
    {
        planIDs,
        cycle,
        currency,
        coupon,
        billingAddress: newBillingAddress,
    }: PlanToCheck & {
        billingAddress?: BillingAddress;
    },
    billingAddress: BillingAddress
): CheckSubscriptionData => ({
    Plans: planIDs,
    Currency: currency,
    Cycle: cycle,
    Codes: coupon ? [coupon] : [],
    BillingAddress: newBillingAddress ?? billingAddress,
});

/**
 * This is used only for non-critical checks. For example, loading the prices for multiple plans on page loading.
 * Example: there is a coupon and it needs to be checked with different cycles/plans/currencies, etc.
 */
const checkMultiplePlans = async ({
    plansToCheck,
    subscription,
    paymentsApi,
    multiCheckGroups,
    getLocalizedPlansMap,
    billingAddress,
}: {
    plansToCheck: PlanToCheck[];
    subscription: Subscription | FreeSubscription;
    paymentsApi: PaymentsApi;
    multiCheckGroups: ReturnType<typeof useMultiCheckGroups>;
    getLocalizedPlansMap: (overrides?: {
        paramCurrency?: GetPreferredCurrencyParamsHook['paramCurrency'];
    }) => FullPlansMap;
    billingAddress: BillingAddress;
}) => {
    const checkSubscriptionData = plansToCheck
        .map((planToCheck) => getSubscriptionDataFromPlanToCheck(planToCheck, billingAddress))
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
            const plansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
            normalizedResults.push(innerGetOptimisticCheckResult({ plansMap, ...planToCheck }));
        } else {
            normalizedResults.push(results[checkedIndex]);
            checkedIndex++;
        }
    }

    return normalizedResults;
};

export interface PaymentsContextTypeInner {
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
     * Returns the cached version of the subscription response. Returns null if the cache is missing.
     * Make sure to call `checkMultiplePlans` first.
     */
    getPrice: (planToCheck: PlanToCheck) => PricesResult | null;
    getFallbackPrice: (planToCheck: PlanToCheck) => PricesResult;
    /**
     * Same as `getPrice`, but returns the fallback version of the price if cache is missing.
     */
    getPriceOrFallback: (planToCheck: PlanToCheck) => PricesResult;
    /**
     * Get a valid coupon by checking it against the cached multi check results
     */
    getCoupon: (planToCheck: PlanToCheck) => string | undefined;
    plans: Plan[];
    plansMap: PlansMap;

    // TODO: exposing for now. Will likely want to abstract this result
    checkResult: RequiredCheckResponse;
    zipCodeValid: boolean;

    // paymentFacade: ReturnType<typeof usePaymentFacade>;

    billingAddress: BillingAddress;
    uiData: PaymentUiData;
    paymentStatus: PaymentStatus | undefined;
    paymentsApi: PaymentsApi;
    isGroupLoading: MultiCheckGroupsResult['isGroupLoading'];
    isGroupChecked: MultiCheckGroupsResult['isGroupChecked'];
    subscription: Subscription | FreeSubscription | undefined;

    // Newly added
    freePlan: FreePlanDefault;
    selectNewPlan: (
        newPlanToCheck: PlanToCheck & { billingAddress?: BillingAddress },
        {}: { subscription: Subscription | FreeSubscription }
    ) => Promise<EnrichedCheckResponse>;
    selectedPlan: SelectedPlan;
    getOptimisticCheckResult: (planToCheck: PlanToCheck) => ReturnType<typeof innerGetOptimisticCheckResult>;
    availableCurrencies: readonly Currency[];
    /**
     * Returns available currencies for the given plan
     */
    getAvailableCurrencies: (selectedPlanName: PLANS) => ReturnType<typeof getAvailableCurrencies>;
    getPreferredCurrency: (selectedPlanName: PLANS) => ReturnType<typeof getPreferredCurrency>;

    setVatNumber: (vatNumber: string) => void;
    vatNumber: string | undefined;
}

export type PaymentsContextType = Pick<
    PaymentsContextTypeInner,
    | 'createSubscription'
    | 'initialize'
    | 'initialized'
    | 'selectPlanIDs'
    | 'selectCycle'
    | 'availableCurrencies'
    | 'getAvailableCurrencies'
    | 'getPreferredCurrency'
    | 'currency'
    | 'selectCurrency'
    | 'selectBillingAddress'
    | 'checkMultiplePlans'
    | 'getPrice'
    | 'getFallbackPrice'
    | 'getPriceOrFallback'
    | 'getCoupon'
    | 'plans'
    | 'plansMap'
    | 'freePlan'
    | 'checkResult'
    | 'paymentStatus'
    | 'paymentsApi'
    | 'hasEssentialData'
    | 'isGroupLoading'
    | 'isGroupChecked'
    | 'subscription'
    | 'zipCodeValid'
    | 'setVatNumber'
    | 'vatNumber'
>;

export const PaymentsContext = createContext<PaymentsContextTypeInner | null>(null);

interface PaymentsContextProviderProps {
    children: ReactNode;
    preload?: boolean;
    authenticated?: boolean;
    cachedPlans?: Plan[];
}

export const PaymentsContextProvider = ({
    children,
    preload = true,
    authenticated = true,
    cachedPlans,
}: PaymentsContextProviderProps) => {
    const store = useStore();

    const defaultApi = useApi();

    const [user] = useUser();
    const [plansDataInitial] = usePlans();
    const [paymentStatusInitial] = usePaymentStatus();

    const getPlans = useGetPlans();
    const getPaymentStatus = useGetPaymentStatus();
    const getSubscription = useGetSubscription();
    const [plansData, setPlansData] = useState<{ plans: Plan[]; freePlan: FreePlanDefault }>(
        plansDataInitial ?? { plans: cachedPlans ?? [], freePlan: FREE_PLAN }
    );
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | undefined>(paymentStatusInitial);
    const [subscription, setSubscription] = useState<Subscription | FreeSubscription>(
        selectSubscription(store.getState())?.value || FREE_SUBSCRIPTION
    );

    const [billingAddress, setBillingAddress] = useState<BillingAddress>(DEFAULT_TAX_BILLING_ADDRESS);
    const [vatNumber, setVatNumberInner] = useState<string | undefined>(undefined);

    const plans = plansData.plans;
    const { getPaymentsApi, paymentsApi: initialPaymentsApi } = usePaymentsApi();
    const paymentsApiRef = useRef<PaymentsApi>(initialPaymentsApi);
    // const [onChargeableCallback, setOnChargeableCallback] = useState<OnChargeable>(() => Promise.resolve());

    const [initialized, setInitialized] = useState(false);
    const hasEssentialData = plans.length > 0 && paymentStatus !== undefined && subscription !== undefined;

    const initialPlanIDs = { [PLANS.MAIL]: 1 };

    const { getPreferredCurrency, getAvailableCurrencies } = useCurrencies();

    //const plansMapCache = useRef<any>({});

    const getLocalizedPlansMap = (overrides?: { paramCurrency?: GetPreferredCurrencyParamsHook['paramCurrency'] }) => {
        const result = getPreferredPlansMap({
            currencyFallback: false,
            getPreferredCurrency,
            currencyOverrides: overrides ? { paramCurrency: overrides.paramCurrency } : undefined,
            user,
            paymentStatus,
            subscription,
            plans,
        }).plansMap;

        return result;
    };

    const [{ planToCheck, checkResult, zipCodeValid }, setPlanToCheck] = useState<{
        planToCheck: PlanToCheck;
        checkResult: EnrichedCheckResponse;
        zipCodeValid: boolean;
    }>(() => {
        const autoCurrency = getPreferredCurrency({
            user,
            plans,
            paymentStatus,
            subscription,
        });
        const plansMap = getLocalizedPlansMap({ paramCurrency: autoCurrency });
        const planToCheck = {
            cycle: CYCLE.MONTHLY,
            currency: autoCurrency,
            planIDs: initialPlanIDs,
            coupon: undefined,
        };
        const checkResult = innerGetOptimisticCheckResult({
            cycle: planToCheck.cycle,
            planIDs: planToCheck.planIDs,
            plansMap: plansMap,
            currency: planToCheck.currency,
        });
        return {
            planToCheck,
            checkResult,
            zipCodeValid: true,
        };
    });

    const plansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
    const selectedPlan = new SelectedPlan(planToCheck.planIDs, plansMap, planToCheck.cycle, planToCheck.currency);

    const [availableCurrencies, setAvailableCurrencies] = useState<readonly Currency[]>(mainCurrencies);

    const multiCheckGroups = useMultiCheckGroups();

    const selectNewPlan = async (
        newPlanToCheck: PlanToCheck & { billingAddress?: BillingAddress },
        {}: { subscription: Subscription | FreeSubscription } = {}
    ) => {
        const isFree = hasFreePlanIDs(newPlanToCheck.planIDs);
        if (isFree) {
            const plansMap = getLocalizedPlansMap({ paramCurrency: newPlanToCheck.currency });
            const newCheckResult = innerGetOptimisticCheckResult({
                plansMap,
                cycle: newPlanToCheck.cycle,
                planIDs: newPlanToCheck.planIDs,
                currency: newPlanToCheck.currency,
            });
            setPlanToCheck({ planToCheck: newPlanToCheck, checkResult: newCheckResult, zipCodeValid: true });
            return newCheckResult;
        }

        const subscriptionData = getSubscriptionDataFromPlanToCheck(newPlanToCheck, billingAddress);
        const newBillingAddress = newPlanToCheck.billingAddress;
        if (newBillingAddress) {
            setBillingAddress((old) => (isDeepEqual(old, newBillingAddress) ? old : newBillingAddress));
        }

        try {
            const newCheckResult = await paymentsApiRef.current.checkWithAutomaticVersion(subscriptionData);
            setPlanToCheck({ planToCheck: newPlanToCheck, checkResult: newCheckResult, zipCodeValid: true });
            paymentsApiRef.current.cacheMultiCheck(subscriptionData, undefined, newCheckResult);
            return newCheckResult;
        } catch (error) {
            if (error instanceof InvalidZipCodeError) {
                setPlanToCheck((oldData) => ({
                    ...oldData,
                    planToCheck: newPlanToCheck,
                    zipCodeValid: false,
                }));

                return checkResult;
            } else {
                throw error;
            }
        }
    };

    const preloadPaymentsData = async ({ api: apiOverride }: { api?: Api } = {}) => {
        const api = apiOverride ?? defaultApi;

        const [plansData, status, subscription] = await Promise.all([
            getPlans({ api }).then((data) => {
                setPlansData(data);
                return data;
            }),
            getPaymentStatus({ api }).then((data) => {
                setPaymentStatus(data);
                return data;
            }),
            authenticated
                ? getSubscription().then((data) => {
                      setSubscription(data);
                      return data;
                  })
                : Promise.resolve(FREE_SUBSCRIPTION as FreeSubscription),
        ]);

        return { plansData, status, subscription };
    };

    const initialize = async ({
        api,
        paramCurrency,
        planToCheck: planToCheckParam,
        availablePlans,
        // paymentFlow,
        // onChargeable,
    }: InitializeProps) => {
        const { plansData, status, subscription } = await preloadPaymentsData({ api });
        const plans = plansData.plans;

        let preferredCurrency = getPreferredCurrency({
            paramCurrency,
            paymentStatus: status,
            plans,
        });

        const availableCurrencies = getAvailableCurrencies({
            paramCurrency,
            paymentStatus: status,
            plans,
        });
        setAvailableCurrencies(availableCurrencies);

        const billingAddress: BillingAddress = getBillingAddressFromPaymentStatus({
            CountryCode: status.CountryCode,
            State: status.State,
            ZipCode: status.ZipCode,
        });
        setBillingAddress(billingAddress);

        const paymentsApi = getPaymentsApi(api);
        paymentsApiRef.current = paymentsApi;
        // setFacadeParams({ flow: paymentFlow });
        // setOnChargeableCallback(onChargeable);

        const localizedPlansMap = getPreferredPlansMap({
            currencyFallback: false,
            getPreferredCurrency,
            currencyOverrides: { paramCurrency: preferredCurrency },
            user,
            paymentStatus,
            subscription,
            plans,
        }).plansMap;

        if (planToCheckParam) {
            try {
                await selectNewPlan(
                    {
                        ...getPlanToCheck({
                            ...planToCheckParam,
                            currency: preferredCurrency,
                        }),
                        billingAddress,
                    },
                    { subscription }
                );
            } catch (error) {
                /**
                 * Check call can fail if the plan is not available in the preferred currency
                 * This will fallback to an available currency for the plan
                 */
                const plan = getPlanFromPlanIDs(localizedPlansMap, planToCheckParam?.planIDs);

                if (plan) {
                    preferredCurrency = plan.Currency;
                    await selectNewPlan(
                        {
                            ...getPlanToCheck({
                                ...planToCheckParam,
                                currency: preferredCurrency,
                            }),
                            billingAddress,
                        },
                        { subscription }
                    );
                }
            }
        }

        const availablePlansWithCurrencyAndAutomaticCoupon = availablePlans
            ?.map((plan) => ({
                ...getPlanToCheck({
                    ...plan,
                    currency: preferredCurrency,
                    coupon: planToCheckParam?.coupon,
                }),
                billingAddress,
            }))
            .filter((plan) => {
                // There needs to be a coupon for it to be worth to ask the API.
                const hasCoupon = !!plan.coupon;
                // With regional currencies, the currency might not exist for that plan. So ignore asking the API in that case.
                const strictPlan = getPlanFromPlanIDs(localizedPlansMap, plan.planIDs);
                const hasCurrency = plan.currency === strictPlan?.Currency;
                return hasCoupon && hasCurrency;
            });

        if (availablePlansWithCurrencyAndAutomaticCoupon?.length) {
            await checkMultiplePlans({
                getLocalizedPlansMap,
                multiCheckGroups,
                paymentsApi,
                subscription,
                plansToCheck: availablePlansWithCurrencyAndAutomaticCoupon,
                billingAddress,
            }).catch(noop);
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
        await selectNewPlan({
            ...planToCheck,
            billingAddress,
        });
    };

    const getFallbackPrice: PaymentsContextTypeInner['getFallbackPrice'] = (planToCheck): PricesResult => {
        const localizedPlansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        const checkResult = innerGetOptimisticCheckResult({ plansMap: localizedPlansMap, ...planToCheck });

        return {
            checkResult,
            uiData: getCheckout({ planIDs: planToCheck.planIDs, plansMap: localizedPlansMap, checkResult }),
        };
    };

    const getPrice: PaymentsContextTypeInner['getPrice'] = (planToCheck) => {
        if (!planToCheck.coupon) {
            return getFallbackPrice(planToCheck);
        }

        const subscriptionData = getSubscriptionDataFromPlanToCheck(planToCheck, billingAddress);
        const result = paymentsApiRef.current.getCachedCheck(subscriptionData);

        // Cache is missing
        if (!result) {
            return null;
        }

        const localizedPlansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        return {
            checkResult: result,
            uiData: getCheckout({ planIDs: planToCheck.planIDs, plansMap: localizedPlansMap, checkResult: result }),
        };
    };

    const getPriceOrFallback: PaymentsContextTypeInner['getPriceOrFallback'] = (planToCheck) => {
        const price = getPrice(planToCheck);
        if (!price) {
            return getFallbackPrice(planToCheck);
        }

        return price;
    };

    const getCoupon: PaymentsContextTypeInner['getCoupon'] = (planToCheck) => {
        const result = paymentsApiRef.current.getCachedCheckByPlans(planToCheck.planIDs);
        return result.find((value) => {
            return (
                Boolean(value.Coupon?.Code) &&
                value.Currency === planToCheck.currency &&
                value.Cycle === planToCheck.cycle
            );
        })?.Coupon?.Code;
    };

    const isGroupLoading = multiCheckGroups.isGroupLoading;
    const isGroupChecked = multiCheckGroups.isGroupChecked;

    const getOptimisticCheckResult: PaymentsContextTypeInner['getOptimisticCheckResult'] = (planToCheck) => {
        const plansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        return innerGetOptimisticCheckResult({ plansMap, ...planToCheck });
    };

    const setVatNumber = (vatNumber: string) => {
        setVatNumberInner(vatNumber);
    };

    const value: PaymentsContextTypeInner = {
        createSubscription: async () => {},
        initialize,
        initialized,
        selectPlanIDs,
        selectCycle,
        selectedPlan,
        availableCurrencies,
        getAvailableCurrencies: (selectedPlanName: PLANS) =>
            getAvailableCurrencies({
                selectedPlanName,
                paymentStatus,
                user,
                subscription,
                plans,
                paramCurrency: selectedPlan.currency,
            }),

        getPreferredCurrency: (selectedPlanName: PLANS) =>
            getPreferredCurrency({
                paramPlanName: selectedPlanName,
                paymentStatus,
                user,
                subscription,
                plans,
            }),
        currency: selectedPlan.currency,
        selectNewPlan,
        selectCurrency,
        selectBillingAddress,
        checkMultiplePlans: (plansToCheck) => {
            return checkMultiplePlans({
                getLocalizedPlansMap,
                multiCheckGroups,
                paymentsApi: paymentsApiRef.current,
                subscription,
                plansToCheck,
                billingAddress,
            });
        },
        plans,
        freePlan: plansData.freePlan,
        plansMap,
        getPrice,
        getFallbackPrice,
        getPriceOrFallback,
        getOptimisticCheckResult,
        getCoupon,
        checkResult,
        zipCodeValid,
        // paymentFacade,
        billingAddress,
        uiData: {
            checkout: getCheckout({ planIDs: checkResult.requestData.Plans, plansMap, checkResult }),
        },
        paymentStatus,
        paymentsApi: paymentsApiRef.current,
        hasEssentialData,
        isGroupLoading,
        isGroupChecked,
        subscription,
        setVatNumber,
        vatNumber,
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

export type PreloadedPaymentsContextType = Omit<PaymentsContextType, 'paymentStatus'> & {
    paymentStatus: PaymentStatus;
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
