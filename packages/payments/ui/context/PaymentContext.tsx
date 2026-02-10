import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

import { createSelector } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { selectOrganization } from '@proton/account/organization';
import { paymentStatusThunk, selectPaymentStatus } from '@proton/account/paymentStatus';
import { plansThunk, selectPlans } from '@proton/account/plans';
import { selectSubscription, subscriptionThunk } from '@proton/account/subscription';
import { selectUser } from '@proton/account/user';
import { useCouponConfig } from '@proton/components/containers/payments/subscription/coupon-config/useCouponConfig';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getPreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import type { GetPreferredCurrencyParamsHook, OnChargeable } from '@proton/components/payments/client-extensions';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import type { CheckSubscriptionData } from '../../core/api/api';
import { type BillingAddress, DEFAULT_TAX_BILLING_ADDRESS } from '../../core/billing-address/billing-address';
import { getBillingAddressFromPaymentStatus } from '../../core/billing-address/billing-address-from-payments-status';
import {
    type PaymentsCheckout,
    getCheckout,
    getOptimisticCheckResult as innerGetOptimisticCheckResult,
} from '../../core/checkout';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '../../core/constants';
import { type getAvailableCurrencies, type getPreferredCurrency, mainCurrencies } from '../../core/currencies';
import type {
    Currency,
    Cycle,
    FreeSubscription,
    PaymentMethodFlow,
    PaymentStatus,
    PaymentsApi,
    PlanIDs,
} from '../../core/interface';
import { getPlanFromPlanIDs, shouldPassIsTrial } from '../../core/plan/helpers';
import type { FreePlanDefault, Plan, PlansMap } from '../../core/plan/interface';
import { hasFreePlanIDs, planIDsPositiveDifference } from '../../core/planIDs';
import { getPrice } from '../../core/price-helpers';
import { SubscriptionMode } from '../../core/subscription/constants';
import { FREE_PLAN } from '../../core/subscription/freePlans';
import {
    getAutoCoupon,
    getPlanIDs,
    isSubscriptionCheckForbidden,
    isSubscriptionCheckForbiddenWithReason,
} from '../../core/subscription/helpers';
import type {
    EnrichedCheckResponse,
    FullPlansMap,
    Subscription,
    SubscriptionCheckResponse,
} from '../../core/subscription/interface';
import { SelectedPlan } from '../../core/subscription/selected-plan';
import { isFreeSubscription } from '../../core/type-guards';
import type { PaymentTelemetryContext } from '../../telemetry/helpers';
import type { EstimationChangeAction } from '../../telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '../../telemetry/telemetry';
import useIsB2BTrial from '../hooks/useIsB2BTrial';
import { type MultiCheckGroupsResult, useMultiCheckGroups } from './useMultiCheckGroups';

export interface PlanToCheck {
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    coupon?: string;
    groupId?: string;
    trial?: boolean;
}

export function getPlanToCheck(params: PlanToCheck): PlanToCheck {
    const coupon = getAutoCoupon({
        coupon: params.coupon,
        planIDs: params.planIDs,
        cycle: params.cycle,
        trial: params.trial,
        currency: params.currency,
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
    telemetryContext: PaymentTelemetryContext;
    product: ProductParam;
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
        trial = false,
        billingAddress: newBillingAddress,
        ValidateZipCode,
    }: PlanToCheck & {
        billingAddress?: BillingAddress;
        ValidateZipCode?: boolean;
    },
    billingAddress: BillingAddress
): CheckSubscriptionData => ({
    Plans: planIDs,
    Currency: currency,
    Cycle: cycle,
    Codes: coupon ? [coupon] : [],
    BillingAddress: newBillingAddress ?? billingAddress,
    ValidateZipCode,
    IsTrial: trial,
});

export const computeOptimisticSubscriptionMode = (
    { planIDs, cycle, currency, plansMap }: Parameters<typeof innerGetOptimisticCheckResult>[0],
    subscription: Subscription | FreeSubscription,
    {
        isTrial,
    }: {
        isTrial?: boolean;
    } = {}
): SubscriptionMode => {
    if (isFreeSubscription(subscription)) {
        return isTrial ? SubscriptionMode.Trial : SubscriptionMode.Regular;
    }

    const currentPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

    const selectedPlan = new SelectedPlan(planIDs ?? {}, plansMap, cycle, currency);

    if (currentPlan.getPlanName() !== selectedPlan.getPlanName() || currentPlan.currency !== selectedPlan.currency) {
        return SubscriptionMode.Regular;
    }

    const positiveDifference = planIDsPositiveDifference(currentPlan.planIDs, selectedPlan.planIDs);
    const hasMoreAddons = Object.values(positiveDifference).some((value) => value > 0);
    if (hasMoreAddons) {
        return SubscriptionMode.CustomBillings;
    }

    const negativeDifference = planIDsPositiveDifference(selectedPlan.planIDs, currentPlan.planIDs);
    const hasLessAddons = Object.values(negativeDifference).some((value) => value > 0);
    if (hasLessAddons) {
        return SubscriptionMode.ScheduledChargedLater;
    }

    if (selectedPlan.cycle > currentPlan.cycle) {
        return SubscriptionMode.ScheduledChargedImmediately;
    }

    if (selectedPlan.cycle < currentPlan.cycle) {
        return SubscriptionMode.ScheduledChargedLater;
    }

    return SubscriptionMode.Regular;
};

export const computeOptimisticRenewProperties = (
    params: Parameters<typeof innerGetOptimisticCheckResult>[0]
): {
    BaseRenewAmount: number | null;
    RenewCycle: CYCLE | null;
} | null => {
    const selectedPlan = new SelectedPlan(params.planIDs ?? {}, params.plansMap, params.cycle, params.currency);
    const plansWithVariableCycleOffer: PLANS[] = [
        PLANS.MAIL,
        PLANS.VPN2024,
        PLANS.BUNDLE,
        PLANS.DUO,
        PLANS.FAMILY,
        PLANS.VISIONARY,
    ];

    if (plansWithVariableCycleOffer.includes(selectedPlan.getPlanName()) && selectedPlan.cycle > CYCLE.YEARLY) {
        const yearlyPrice = getPrice(selectedPlan.planIDs, CYCLE.YEARLY, params.plansMap);

        return {
            BaseRenewAmount: yearlyPrice,
            RenewCycle: CYCLE.YEARLY,
        };
    }

    return null;
};

export const computeOptimisticCheckResult = (
    params: Parameters<typeof innerGetOptimisticCheckResult>[0],
    subscription: Subscription | FreeSubscription,
    options: {
        isTrial?: boolean;
    }
): EnrichedCheckResponse => {
    const subscriptionMode = computeOptimisticSubscriptionMode(params, subscription, options);
    const optimisticCheckResult = innerGetOptimisticCheckResult(params);
    optimisticCheckResult.SubscriptionMode = subscriptionMode;

    const optimisticRenewProperties = computeOptimisticRenewProperties(params);

    return {
        ...optimisticCheckResult,
        ...optimisticRenewProperties,
    };
};

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
        .map((datum) => (isSubscriptionCheckForbidden(subscription, datum.Plans, datum.Cycle) ? null : datum));

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
            normalizedResults.push(
                computeOptimisticCheckResult({ plansMap, ...planToCheck }, subscription, { isTrial: planToCheck.trial })
            );
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
    checkResult: EnrichedCheckResponse;
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
    reRunPaymentChecks: () => Promise<EnrichedCheckResponse | void>;
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

    telemetryContext: PaymentTelemetryContext;
    loading: boolean;
    getIsTrial: (planIds: PlanIDs, cycle: Cycle, canDowngrade: boolean) => boolean;
    coupon: string;
    selectCoupon: (coupon: string) => Promise<void>;
    couponConfig: ReturnType<typeof useCouponConfig>;
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
    | 'telemetryContext'
>;

export const PaymentsContext = createContext<PaymentsContextTypeInner | null>(null);

interface PaymentsContextProviderProps {
    children: ReactNode;
    preload?: boolean;
    authenticated?: boolean;
    cachedPlans?: Plan[];
}

interface PaymentsContextProviderState {
    telemetryContext: PaymentTelemetryContext;
    product: ProductParam;
    billingAddress: BillingAddress;
}

export const selectData = createSelector(
    [selectUser, selectSubscription, selectPlans, selectPaymentStatus, selectOrganization],
    (user, subscription, plans, paymentStatus, organization) => {
        return {
            // NOTE: with optionals due to user, subscription not being initialized in account's public app
            user: user?.value,
            subscription: subscription?.value,
            plans: plans?.value,
            paymentStatus: paymentStatus?.value,
            organization: organization?.value,
        };
    }
);

export const PaymentsContextProvider = ({
    children,
    preload = true,
    authenticated = true,
    cachedPlans,
}: PaymentsContextProviderProps) => {
    const { APP_NAME } = useConfig();

    const defaultApi = useApi();

    const {
        user,
        organization,
        paymentStatus: paymentStatusInitial,
        subscription: subscriptionInitial,
        plans: plansInitial,
        // Avoid using model hooks to avoid fetching data
    } = useSelector(selectData);
    const dispatch = useDispatch();

    const [plansData, setPlansData] = useState<{ plans: Plan[]; freePlan: FreePlanDefault }>(
        plansInitial ?? { plans: cachedPlans ?? [], freePlan: FREE_PLAN }
    );
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | undefined>(paymentStatusInitial);
    const [subscription, setSubscription] = useState<Subscription | FreeSubscription>(
        subscriptionInitial || FREE_SUBSCRIPTION
    );
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const [couponCode, setCouponCode] = useState('');

    const [, rerender] = useState<{}>({});
    const stateRef = useRef<PaymentsContextProviderState>({
        telemetryContext: 'other',
        product: 'generic',
        billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
    });

    const setState = (state: Partial<PaymentsContextProviderState>) => {
        stateRef.current = { ...stateRef.current, ...state };
        rerender({});
    };

    const [vatNumber, setVatNumberInner] = useState<string | undefined>(undefined);

    const plans = plansData.plans;
    const { getPaymentsApi, paymentsApi: initialPaymentsApi } = usePaymentsApi();
    const paymentsApiRef = useRef<PaymentsApi>(initialPaymentsApi);
    // const [onChargeableCallback, setOnChargeableCallback] = useState<OnChargeable>(() => Promise.resolve());

    const [initialized, setInitialized] = useState(false);
    const hasEssentialData = plans.length > 0 && paymentStatus !== undefined && subscription !== undefined;

    const initialPlanIDs =
        subscription && !isFreeSubscription(subscription) ? getPlanIDs(subscription) : { [PLANS.MAIL]: 1 };

    const { getPreferredCurrency, getAvailableCurrencies } = useCurrencies();

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

        /** The `trial` property here does not refer to the current trail status of the subscription.
         * Use this value if you want to start a new trial as part of the transaction.
         * As PaymentContext does not have any use-case where we need to start a trial, it is set to `undefined`
         * In the future iterations, if it still remains unused, we will eventually remove it
         **/
        const trial = undefined;
        const planToCheck = {
            cycle: CYCLE.MONTHLY,
            currency: autoCurrency,
            planIDs: initialPlanIDs,
            coupon: undefined,
            trial,
        };
        const checkResult = computeOptimisticCheckResult(
            {
                cycle: planToCheck.cycle,
                planIDs: planToCheck.planIDs,
                plansMap: plansMap,
                currency: planToCheck.currency,
            },
            subscription,
            { isTrial: trial }
        );
        return {
            planToCheck,
            checkResult,
            zipCodeValid: true,
        };
    });

    const plansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
    const selectedPlan = new SelectedPlan(planToCheck.planIDs, plansMap, planToCheck.cycle, planToCheck.currency);

    const [availableCurrencies, setAvailableCurrencies] = useState<readonly Currency[]>(mainCurrencies);
    const couponConfig = useCouponConfig({ checkResult, planIDs: planToCheck.planIDs, plansMap });

    const multiCheckGroups = useMultiCheckGroups();

    const subscriptionState = subscription;

    const getOptimisticCheckResult: PaymentsContextTypeInner['getOptimisticCheckResult'] = (planToCheck) => {
        const plansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        return computeOptimisticCheckResult({ plansMap, ...planToCheck }, subscription, { isTrial: planToCheck.trial });
    };

    const selectNewPlan = async (
        newPlanToCheck: PlanToCheck & { billingAddress?: BillingAddress },
        { subscription }: { subscription: Subscription | FreeSubscription } = { subscription: subscriptionState }
    ) => {
        const action: EstimationChangeAction | null = (() => {
            const newSelectedPlan = new SelectedPlan(
                newPlanToCheck.planIDs,
                plansMap,
                newPlanToCheck.cycle,
                newPlanToCheck.currency
            );

            if (newSelectedPlan.cycle !== selectedPlan.cycle) {
                return 'cycle_changed';
            }

            if (newSelectedPlan.currency !== selectedPlan.currency) {
                return 'currency_changed';
            }

            if (newPlanToCheck.coupon !== planToCheck.coupon) {
                return 'coupon_changed';
            }

            if (newSelectedPlan.getPlanName() !== selectedPlan.getPlanName()) {
                return 'plan_changed';
            }

            if (!newSelectedPlan.isEqualTo(selectedPlan)) {
                return 'plan_changed';
            }

            return null;
        })();

        if (action && initialized) {
            checkoutTelemetry.reportSubscriptionEstimationChange({
                action,
                context: stateRef.current.telemetryContext,
                subscription: undefined,
                userCurrency: undefined,
                selectedPlanIDs: newPlanToCheck.planIDs,
                selectedCurrency: newPlanToCheck.currency,
                selectedCycle: newPlanToCheck.cycle,
                selectedCoupon: newPlanToCheck.coupon,
                paymentMethodType: undefined,
                paymentMethodValue: undefined,
                build: APP_NAME,
                product: stateRef.current.product,
            });
        }

        const isFree = hasFreePlanIDs(newPlanToCheck.planIDs);
        if (isFree) {
            const plansMap = getLocalizedPlansMap({ paramCurrency: newPlanToCheck.currency });
            const newCheckResult = computeOptimisticCheckResult(
                {
                    plansMap,
                    cycle: newPlanToCheck.cycle,
                    planIDs: newPlanToCheck.planIDs,
                    currency: newPlanToCheck.currency,
                },
                subscription,
                { isTrial: newPlanToCheck.trial }
            );
            setPlanToCheck({ planToCheck: newPlanToCheck, checkResult: newCheckResult, zipCodeValid: true });
            return newCheckResult;
        }

        const subscriptionData = getSubscriptionDataFromPlanToCheck(
            { ...newPlanToCheck, ValidateZipCode: true },
            stateRef.current.billingAddress
        );

        const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(
            subscription,
            newPlanToCheck.planIDs,
            newPlanToCheck.cycle
        );

        if (paymentForbiddenReason.forbidden) {
            const newCheckResult = {
                ...getOptimisticCheckResult(newPlanToCheck),
                Currency: newPlanToCheck.currency,
                PeriodEnd: 0,
                AmountDue: 0,
            };
            setPlanToCheck({ planToCheck: newPlanToCheck, checkResult: newCheckResult, zipCodeValid: true });
            return newCheckResult;
        }

        const newBillingAddress = newPlanToCheck.billingAddress;
        if (newBillingAddress) {
            setState({ billingAddress: newBillingAddress });
        }

        try {
            const newCheckResult = (await withLoading(
                paymentsApiRef.current.checkSubscription(subscriptionData)
            )) as EnrichedCheckResponse;
            if (newCheckResult) {
                setPlanToCheck({ planToCheck: newPlanToCheck, checkResult: newCheckResult, zipCodeValid: true });
                paymentsApiRef.current.cacheMultiCheck(subscriptionData, newCheckResult);
            }
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
            dispatch(plansThunk({ api })).then((data) => {
                setPlansData(data);
                return data;
            }),
            dispatch(paymentStatusThunk({ api })).then((data) => {
                setPaymentStatus(data);
                return data;
            }),
            authenticated
                ? dispatch(subscriptionThunk()).then((data) => {
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
        telemetryContext,
        product,
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

        setState({ billingAddress: getBillingAddressFromPaymentStatus(status) });

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
                        billingAddress: stateRef.current.billingAddress,
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
                            billingAddress: stateRef.current.billingAddress,
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
                billingAddress: stateRef.current.billingAddress,
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
                billingAddress: stateRef.current.billingAddress,
            }).catch(noop);
        }

        setState({ telemetryContext, product });

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

    const selectCoupon = async (coupon: string) => {
        setCouponCode(coupon);
        const checkResult = await selectNewPlan({
            ...planToCheck,
            coupon,
        });
        if (
            checkResult &&
            coupon &&
            coupon.toLowerCase() !== checkResult.Coupon?.Code.toLowerCase() &&
            !checkResult.Gift
        ) {
            createNotification({ text: c('Error').t`Invalid code`, type: 'error' });
        }
    };

    const getFallbackPrice: PaymentsContextTypeInner['getFallbackPrice'] = (planToCheck): PricesResult => {
        const localizedPlansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        const checkResult = computeOptimisticCheckResult(
            { plansMap: localizedPlansMap, ...planToCheck },
            subscription,
            { isTrial: planToCheck.trial }
        );

        return {
            checkResult,
            uiData: getCheckout({ planIDs: planToCheck.planIDs, plansMap: localizedPlansMap, checkResult }),
        };
    };

    const getPrice: PaymentsContextTypeInner['getPrice'] = (planToCheck) => {
        if (!planToCheck.coupon) {
            return getFallbackPrice(planToCheck);
        }

        const subscriptionData = getSubscriptionDataFromPlanToCheck(planToCheck, stateRef.current.billingAddress);
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

    const getIsTrial = (planIDs: PlanIDs, cycle: Cycle, canDowngrade: boolean) => {
        if (!isB2BTrial) {
            return false;
        }

        const oldSubscription = subscription?.UpcomingSubscription ?? subscription;

        if (!oldSubscription) {
            return false;
        }

        return shouldPassIsTrial({
            plansMap,
            newPlanIDs: planIDs,
            oldPlanIDs: getPlanIDs(subscription),
            newCycle: cycle,
            oldCycle: oldSubscription.Cycle,
            downgradeIsTrial: canDowngrade,
        });
    };

    const isGroupLoading = multiCheckGroups.isGroupLoading;
    const isGroupChecked = multiCheckGroups.isGroupChecked;

    const setVatNumber = (vatNumber: string) => {
        setVatNumberInner(vatNumber);
    };

    const reRunPaymentChecks = async () => {
        return selectNewPlan(planToCheck);
    };

    const value: PaymentsContextTypeInner = {
        createSubscription: async () => {},
        initialize,
        initialized,
        couponConfig,
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
                billingAddress: stateRef.current.billingAddress,
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
        billingAddress: stateRef.current.billingAddress,
        uiData: {
            checkout: getCheckout({
                planIDs: checkResult?.requestData.Plans ?? planToCheck.planIDs,
                plansMap,
                checkResult,
            }),
        },
        paymentStatus,
        paymentsApi: paymentsApiRef.current,
        hasEssentialData,
        isGroupLoading,
        isGroupChecked,
        subscription,
        setVatNumber,
        vatNumber,
        telemetryContext: stateRef.current.telemetryContext,
        coupon: couponCode,
        selectCoupon,
        loading,
        getIsTrial,
        reRunPaymentChecks: reRunPaymentChecks,
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

export function isPaymentsPreloaded(payments: PaymentsContextType): payments is PreloadedPaymentsContextType {
    return payments.hasEssentialData;
}

export const usePaymentsPreloaded = (): PreloadedPaymentsContextType => {
    const payments = usePaymentsInner();
    if (!payments.hasEssentialData) {
        // eslint-disable-next-line no-console
        console.warn(
            'Payments context did not preload the essential data. Either call payments.initialize() first or use usePayments() instead of usePaymentsPreloaded().'
        );
    }

    return payments as PreloadedPaymentsContextType;
};
