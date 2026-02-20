import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';

import { createSelector } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { selectOrganization } from '@proton/account/organization';
import { paymentStatusThunk, selectPaymentStatus } from '@proton/account/paymentStatus';
import { plansThunk, selectPlans } from '@proton/account/plans';
import { selectSubscription, subscriptionThunk } from '@proton/account/subscription';
import { selectUser } from '@proton/account/user';
import type { CreateNotificationOptions } from '@proton/components/containers/notifications/interfaces';
import {
    type CouponConfigRendered,
    getStaticCouponConfig,
    useCouponConfig,
} from '@proton/components/containers/payments/subscription/coupon-config/useCouponConfig';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { useHandler } from '@proton/components/hooks/useHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { getPreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import type { OnChargeable } from '@proton/components/payments/client-extensions';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { type BillingAddress, DEFAULT_TAX_BILLING_ADDRESS } from '../../core/billing-address/billing-address';
import { getBillingAddressFromPaymentStatus } from '../../core/billing-address/billing-address-from-payments-status';
import { type PaymentsCheckoutUI, getCheckoutUi, type getOptimisticCheckResult } from '../../core/checkout';
import { computeOptimisticCheckResult } from '../../core/computeOptimisticCheckResult';
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
import { hasFreePlanIDs } from '../../core/planIDs';
import { FREE_PLAN } from '../../core/subscription/freePlans';
import { getPlanIDs, isSubscriptionCheckForbiddenWithReason } from '../../core/subscription/helpers';
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
import { checkMultiplePlans, getPlanToCheck, getSubscriptionDataFromPlanToCheck } from './helpers';
import { type MultiCheckGroupsResult, useMultiCheckGroups } from './useMultiCheckGroups';

export interface PlanToCheck {
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    coupon?: string;
    groupId?: string;
    trial?: boolean;
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

interface PricesResult {
    checkResult: EnrichedCheckResponse;
    checkoutUi: PaymentsCheckoutUI;
}

export interface PaymentsContextType {
    createSubscription: () => Promise<void>;
    initialize: (props: InitializeProps) => Promise<void>;
    initialized: boolean;
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
    checkoutUi: PaymentsCheckoutUI;
    paymentStatus: PaymentStatus | undefined;
    paymentsApi: PaymentsApi;
    isGroupLoading: MultiCheckGroupsResult['isGroupLoading'];
    isGroupChecked: MultiCheckGroupsResult['isGroupChecked'];
    subscription: Subscription | FreeSubscription | undefined;

    freePlan: FreePlanDefault;
    selectNewPlan: (newPlanToCheck: PlanToCheck) => Promise<EnrichedCheckResponse>;
    selectedPlan: SelectedPlan;
    getOptimisticCheckResult: (planToCheck: PlanToCheck) => ReturnType<typeof getOptimisticCheckResult>;
    availableCurrencies: readonly Currency[];
    /**
     * Returns available currencies for the given plan
     */
    getAvailableCurrencies: (selectedPlanName: PLANS) => ReturnType<typeof getAvailableCurrencies>;
    getPreferredCurrency: (selectedPlanName: PLANS) => ReturnType<typeof getPreferredCurrency>;

    setVatNumber: (vatNumber: string) => Promise<void>;
    vatNumber: string | undefined;

    telemetryContext: PaymentTelemetryContext;
    loading: boolean;

    reRunPaymentChecks: () => Promise<EnrichedCheckResponse | void>;
    getShouldPassTrial: (planIds: PlanIDs, cycle: Cycle, canDowngrade: boolean) => boolean;
    coupon: string | undefined;
    selectCoupon: (coupon: string) => Promise<void>;
    couponConfig: CouponConfigRendered | undefined;
}

export const PaymentsContext = createContext<PaymentsContextType | null>(null);

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
    subscription: Subscription | FreeSubscription;
    plansData: {
        plans: Plan[];
        freePlan: FreePlanDefault;
    };
    paymentStatus: PaymentStatus | undefined;
    initialized: boolean;
    availableCurrencies: readonly Currency[];
    planToCheck: PlanToCheck;
    checkResult: EnrichedCheckResponse;
    zipCodeValid: boolean;
    vatNumber: string | undefined;
    loading: boolean;
}

const selectInitialPaymentData = createSelector(
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
        paymentStatus: paymentStatusInitial,
        subscription: subscriptionInitial,
        plans: plansInitial,
        organization,
    } =
        // Avoid using model hooks to avoid fetching data
        useSelector(selectInitialPaymentData);
    const dispatch = useDispatch();

    const { getPreferredCurrency, getAvailableCurrencies } = useCurrencies();

    const getLocalizedPlansMapParametrized = (params: {
        paramCurrency?: Currency;
        paymentStatus: PaymentStatus | undefined;
        subscription: Subscription | FreeSubscription;
        plans: Plan[];
    }) => {
        return getPreferredPlansMap({
            currencyFallback: false,
            getPreferredCurrency,
            currencyOverrides: params.paramCurrency ? { paramCurrency: params.paramCurrency } : undefined,
            user,
            paymentStatus: params.paymentStatus,
            subscription: params.subscription,
            plans: params.plans,
        }).plansMap;
    };

    const { createNotification } = useNotifications();

    const [, rerender] = useState<{}>({});
    const stateRef = useRef<PaymentsContextProviderState>(
        (() => {
            const subscription = subscriptionInitial ?? FREE_SUBSCRIPTION;
            const plansData = plansInitial ?? {
                plans: cachedPlans ?? [],
                freePlan: FREE_PLAN,
            };
            const paymentStatus = paymentStatusInitial;

            const autoCurrency = getPreferredCurrency({
                user,
                subscription,
                plans: plansData.plans,
                paymentStatus,
            });
            const plansMap = getLocalizedPlansMapParametrized({
                paramCurrency: autoCurrency,
                paymentStatus,
                subscription,
                plans: plansData.plans,
            });

            const initialPlanIDs =
                subscription && !isFreeSubscription(subscription) ? getPlanIDs(subscription) : { [PLANS.MAIL]: 1 };

            /** The `trial` property here does not refer to the current trail status of the subscription.
             * Use this value if you want to start a new trial as part of the transaction.
             * As PaymentContext does not have any use-case where we need to start a trial, it is set to `undefined`
             * In the future iterations, if it still remains unused, we will eventually remove it
             **/

            const cycle = CYCLE.MONTHLY;
            const trial = shouldPassIsTrial({
                plansMap,
                newPlanIDs: initialPlanIDs,
                newCycle: cycle,
                downgradeIsTrial: true,
                subscription,
                organization,
            });
            const planToCheck = {
                cycle,
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
                telemetryContext: 'other',
                product: 'generic',
                billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
                subscription,
                plansData,
                paymentStatus,
                initialized: false,
                availableCurrencies: mainCurrencies,
                planToCheck,
                checkResult,
                zipCodeValid: true,
                vatNumber: undefined,
                loading: false,
            };
        })()
    );

    const setState = (newState: Partial<PaymentsContextProviderState>) => {
        stateRef.current = { ...stateRef.current, ...newState };
        rerender({});
    };

    const abortControllerRef = useRef<AbortController | undefined>(undefined);

    const getLocalizedPlansMap = (params: { paramCurrency?: Currency }) => {
        return getLocalizedPlansMapParametrized({
            ...params,
            paymentStatus: stateRef.current.paymentStatus,
            subscription: stateRef.current.subscription,
            plans: stateRef.current.plansData.plans,
        });
    };
    const getPlansMap = () => getLocalizedPlansMap({ paramCurrency: stateRef.current.planToCheck.currency });

    const { getPaymentsApi, paymentsApi: initialPaymentsApi } = usePaymentsApi();
    const paymentsApiRef = useRef<PaymentsApi>(initialPaymentsApi);

    const multiCheckGroups = useMultiCheckGroups();

    const couponConfig = useCouponConfig({
        checkResult: stateRef.current.checkResult,
        planIDs: stateRef.current.planToCheck.planIDs,
        plansMap: getPlansMap(),
    });

    const getShouldPassTrial = (planIDs: PlanIDs, cycle: Cycle, canDowngrade: boolean) => {
        return shouldPassIsTrial({
            plansMap: getPlansMap(),
            newPlanIDs: planIDs,
            newCycle: cycle,
            downgradeIsTrial: canDowngrade,
            subscription: stateRef.current.subscription,
            organization,
        });
    };

    const getOptimisticCheckResult: PaymentsContextType['getOptimisticCheckResult'] = (planToCheck) => {
        const plansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        return computeOptimisticCheckResult({ plansMap, ...planToCheck }, stateRef.current.subscription, {
            isTrial: planToCheck.trial || getShouldPassTrial(planToCheck.planIDs, planToCheck.cycle, true),
        });
    };

    /**
     * @throws {AbortError} if the operation is aborted
     */
    const calculateSubscriptionEstimation = async (
        diff: Partial<PaymentsContextProviderState>
    ): Promise<EnrichedCheckResponse> => {
        const newPlanToCheck = diff.planToCheck ?? stateRef.current.planToCheck;
        const newBillingAddress = diff.billingAddress ?? stateRef.current.billingAddress;
        const newVatNumber = diff.vatNumber ?? stateRef.current.vatNumber;

        const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(
            stateRef.current.subscription,
            newPlanToCheck.planIDs,
            newPlanToCheck.cycle
        );

        if (paymentForbiddenReason.forbidden) {
            const newCheckResult = getOptimisticCheckResult(newPlanToCheck);

            setState({
                planToCheck: newPlanToCheck,
                checkResult: {
                    ...newCheckResult,
                    AmountDue: 0,
                    PeriodEnd: 0,
                },
                zipCodeValid: true,
            });

            return newCheckResult;
        }

        try {
            setState({ loading: true });
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const subscriptionData = getSubscriptionDataFromPlanToCheck({
                ...newPlanToCheck,
                ValidateZipCode: true,
                BillingAddress: newBillingAddress,
                VatId: newVatNumber,
                trial: newPlanToCheck.trial || getShouldPassTrial(newPlanToCheck.planIDs, newPlanToCheck.cycle, true),
            });

            const newCheckResult = await paymentsApiRef.current.checkSubscription(subscriptionData, {
                signal: abortControllerRef.current.signal,
            });
            setState({
                planToCheck: newPlanToCheck,
                billingAddress: newBillingAddress,
                vatNumber: newVatNumber,
                checkResult: newCheckResult,
                zipCodeValid: true,
            });
            paymentsApiRef.current.cacheMultiCheck(subscriptionData, newCheckResult);
            return newCheckResult;
        } catch (error) {
            if (error instanceof InvalidZipCodeError) {
                setState({
                    planToCheck: newPlanToCheck,
                    zipCodeValid: false,
                });

                return stateRef.current.checkResult;
            } else {
                throw error;
            }
        } finally {
            setState({ loading: false });
        }
    };

    const getCurrentSelectedPlan = () => {
        return new SelectedPlan(
            stateRef.current.planToCheck.planIDs,
            getPlansMap(),
            stateRef.current.planToCheck.cycle,
            stateRef.current.planToCheck.currency
        );
    };

    const selectNewPlan = async (newPlanToCheck: PlanToCheck) => {
        const selectedPlan = getCurrentSelectedPlan();

        const action: EstimationChangeAction | null = (() => {
            const newSelectedPlan = new SelectedPlan(
                newPlanToCheck.planIDs,
                getPlansMap(),
                newPlanToCheck.cycle,
                newPlanToCheck.currency
            );

            if (newSelectedPlan.cycle !== selectedPlan.cycle) {
                return 'cycle_changed';
            }

            if (newSelectedPlan.currency !== selectedPlan.currency) {
                return 'currency_changed';
            }

            if (newPlanToCheck.coupon !== stateRef.current.planToCheck.coupon) {
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

        if (action && stateRef.current.initialized) {
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
            const newCheckResult = getOptimisticCheckResult(newPlanToCheck);
            setState({ planToCheck: newPlanToCheck, checkResult: newCheckResult, zipCodeValid: true });
            return newCheckResult;
        }

        return calculateSubscriptionEstimation({ planToCheck: newPlanToCheck });
    };

    const preloadPaymentsData = async ({ api: apiOverride }: { api?: Api } = {}) => {
        const api = apiOverride ?? defaultApi;

        const [plansData, paymentStatus, subscription] = await Promise.all([
            dispatch(plansThunk({ api })),
            dispatch(paymentStatusThunk({ api })),
            authenticated ? dispatch(subscriptionThunk()) : Promise.resolve(FREE_SUBSCRIPTION as FreeSubscription),
        ]);

        const result = {
            plansData,
            paymentStatus,
            subscription,
        };

        setState(result);
        return result;
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
        const { plansData, paymentStatus: status, subscription } = await preloadPaymentsData({ api });
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

        setState({ billingAddress: getBillingAddressFromPaymentStatus(status), availableCurrencies });

        const paymentsApi = getPaymentsApi(api);
        paymentsApiRef.current = paymentsApi;
        // setFacadeParams({ flow: paymentFlow });
        // setOnChargeableCallback(onChargeable);

        const localizedPlansMap = getPreferredPlansMap({
            currencyFallback: false,
            getPreferredCurrency,
            currencyOverrides: { paramCurrency: preferredCurrency },
            user,
            paymentStatus: stateRef.current.paymentStatus,
            subscription: stateRef.current.subscription,
            plans: stateRef.current.plansData.plans,
        }).plansMap;

        if (planToCheckParam) {
            try {
                await selectNewPlan({
                    ...getPlanToCheck({
                        ...planToCheckParam,
                        currency: preferredCurrency,
                    }),
                });
            } catch (error) {
                /**
                 * Check call can fail if the plan is not available in the preferred currency
                 * This will fallback to an available currency for the plan
                 */
                const plan = getPlanFromPlanIDs(localizedPlansMap, planToCheckParam?.planIDs);

                if (plan) {
                    preferredCurrency = plan.Currency;
                    await selectNewPlan({
                        ...getPlanToCheck({
                            ...planToCheckParam,
                            currency: preferredCurrency,
                        }),
                    });
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

        setState({ telemetryContext, product, initialized: true });
    };

    const getHasEssentialData = () => {
        return (
            stateRef.current.plansData.plans.length > 0 &&
            stateRef.current.paymentStatus !== undefined &&
            stateRef.current.subscription !== undefined
        );
    };

    useEffect(function preloadPaymentsDataOnMount() {
        if (!preload || getHasEssentialData()) {
            return;
        }

        preloadPaymentsData().catch(noop);
    }, []);

    const selectPlanIDs = async (planIDs: PlanIDs) => {
        await selectNewPlan({
            ...stateRef.current.planToCheck,
            planIDs,
        });
    };

    const selectCycle = async (cycle: Cycle) => {
        await selectNewPlan({
            ...stateRef.current.planToCheck,
            cycle,
        });
    };

    const selectCurrency = async (currency: Currency) => {
        await selectNewPlan({
            ...stateRef.current.planToCheck,
            currency,
        });
    };

    const selectCoupon = async (coupon: string) => {
        const errorNotification: CreateNotificationOptions = { text: c('Error').t`Invalid code`, type: 'error' };

        const staticCouponConfig = getStaticCouponConfig(coupon);
        if (staticCouponConfig?.blockManualEntryOfCoupon) {
            createNotification(errorNotification);
            return;
        }

        const checkResult = await selectNewPlan({
            ...stateRef.current.planToCheck,
            coupon,
        });

        if (
            checkResult &&
            coupon &&
            coupon.toLowerCase() !== checkResult.Coupon?.Code.toLowerCase() &&
            !checkResult.Gift
        ) {
            createNotification(errorNotification);
            return;
        }
    };

    const instantSelectBillingAddress = async (billingAddress: BillingAddress) => {
        try {
            await calculateSubscriptionEstimation({ billingAddress });
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                return;
            }
            throw error;
        }
    };

    const userInputDebounceDelay = 500;

    const debouncedSelectBillingAddress = useHandler(instantSelectBillingAddress, { debounce: userInputDebounceDelay });

    const selectBillingAddress = (billingAddress: BillingAddress) => {
        if (billingAddress.ZipCode !== stateRef.current.billingAddress.ZipCode) {
            return debouncedSelectBillingAddress(billingAddress);
        }

        return instantSelectBillingAddress(billingAddress);
    };

    const getFallbackPrice: PaymentsContextType['getFallbackPrice'] = (planToCheck): PricesResult => {
        const localizedPlansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        const checkResult = getOptimisticCheckResult(planToCheck);

        return {
            checkResult,
            checkoutUi: getCheckoutUi({ planIDs: planToCheck.planIDs, plansMap: localizedPlansMap, checkResult }),
        };
    };

    const getPrice: PaymentsContextType['getPrice'] = (planToCheck) => {
        if (!planToCheck.coupon) {
            return getFallbackPrice(planToCheck);
        }

        const subscriptionData = getSubscriptionDataFromPlanToCheck({
            ...planToCheck,
            BillingAddress: stateRef.current.billingAddress,
            VatId: stateRef.current.vatNumber,
        });
        const result = paymentsApiRef.current.getCachedCheck(subscriptionData);

        // Cache is missing
        if (!result) {
            return null;
        }

        const localizedPlansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        return {
            checkResult: result,
            checkoutUi: getCheckoutUi({
                planIDs: planToCheck.planIDs,
                plansMap: localizedPlansMap,
                checkResult: result,
            }),
        };
    };

    const getPriceOrFallback: PaymentsContextType['getPriceOrFallback'] = (planToCheck) => {
        const price = getPrice(planToCheck);
        if (!price) {
            return getFallbackPrice(planToCheck);
        }

        return price;
    };

    const getCoupon: PaymentsContextType['getCoupon'] = (planToCheck) => {
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

    const setVatNumberInner = async (vatNumber: string) => {
        if (
            vatNumber === stateRef.current.vatNumber ||
            // both are falsy is a subcase of equality in this case. If both are falsy, then they are already equal, and
            // no calculation is needed.
            (!vatNumber && !stateRef.current.vatNumber)
        ) {
            return;
        }

        try {
            await calculateSubscriptionEstimation({ vatNumber });
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                return;
            }
            throw error;
        }
    };

    const setVatNumber = useHandler(setVatNumberInner, { debounce: userInputDebounceDelay });

    const reRunPaymentChecks = async () => {
        return selectNewPlan(stateRef.current.planToCheck);
    };

    const value: PaymentsContextType = {
        createSubscription: async () => {},
        initialize,
        initialized: getHasEssentialData(),
        selectPlanIDs,
        selectCycle,
        selectedPlan: getCurrentSelectedPlan(),
        availableCurrencies: stateRef.current.availableCurrencies,
        getAvailableCurrencies: (selectedPlanName: PLANS) =>
            getAvailableCurrencies({
                selectedPlanName,
                paymentStatus: stateRef.current.paymentStatus,
                user,
                subscription: stateRef.current.subscription,
                plans: stateRef.current.plansData.plans,
                paramCurrency: stateRef.current.planToCheck.currency,
            }),

        getPreferredCurrency: (selectedPlanName: PLANS) =>
            getPreferredCurrency({
                paramPlanName: selectedPlanName,
                paymentStatus: stateRef.current.paymentStatus,
                user,
                subscription: stateRef.current.subscription,
                plans: stateRef.current.plansData.plans,
            }),
        selectNewPlan,
        selectCurrency,
        selectBillingAddress,
        checkMultiplePlans: (plansToCheck) => {
            return checkMultiplePlans({
                getLocalizedPlansMap,
                multiCheckGroups,
                paymentsApi: paymentsApiRef.current,
                subscription: stateRef.current.subscription,
                plansToCheck,
                billingAddress: stateRef.current.billingAddress,
            });
        },
        plans: stateRef.current.plansData.plans,
        freePlan: stateRef.current.plansData.freePlan,
        plansMap: getPlansMap(),
        getPrice,
        getFallbackPrice,
        getPriceOrFallback,
        getOptimisticCheckResult,
        getCoupon,
        checkResult: stateRef.current.checkResult,
        zipCodeValid: stateRef.current.zipCodeValid,
        // paymentFacade,
        billingAddress: stateRef.current.billingAddress,
        checkoutUi: getCheckoutUi({
            planIDs: stateRef.current.checkResult.requestData.Plans,
            plansMap: getPlansMap(),
            checkResult: stateRef.current.checkResult,
        }),
        paymentStatus: stateRef.current.paymentStatus,
        paymentsApi: paymentsApiRef.current,
        isGroupLoading,
        isGroupChecked,
        subscription: stateRef.current.subscription,
        setVatNumber,
        vatNumber: stateRef.current.vatNumber,
        telemetryContext: stateRef.current.telemetryContext,
        loading: stateRef.current.loading,
        reRunPaymentChecks,
        getShouldPassTrial,
        selectCoupon,
        coupon: stateRef.current.planToCheck.coupon,
        couponConfig,
    };

    return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>;
};

export const usePayments = (): PaymentsContextType => {
    const state = useContext(PaymentsContext);

    if (!state) {
        throw new Error('Expected to be within PaymentsContextProvider');
    }

    return state;
};

export type PreloadedPaymentsContextType = Omit<PaymentsContextType, 'paymentStatus'> & {
    paymentStatus: PaymentStatus;
    plansMap: FullPlansMap;
    subscription: Subscription | FreeSubscription;
};

export function isPaymentsPreloaded(payments: PaymentsContextType): payments is PreloadedPaymentsContextType {
    return payments.initialized;
}

export const usePaymentsPreloaded = (): PreloadedPaymentsContextType => {
    const payments = usePayments();
    if (!payments.initialized) {
        // eslint-disable-next-line no-console
        console.warn(
            'Payments context did not preload the essential data. Either call payments.initialize() first or use usePayments() instead of usePaymentsPreloaded().'
        );
    }

    return payments as PreloadedPaymentsContextType;
};
