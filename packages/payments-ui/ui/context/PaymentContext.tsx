import { type ReactNode, useEffect, useRef, useState } from 'react';

import { createSelector } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { entitlementCatalogThunk, selectEntitlementCatalog } from '@proton/account/entitlementCatalog';
import { paymentStatusThunk, selectPaymentStatus } from '@proton/account/paymentStatus';
import { plansThunk, selectPlans } from '@proton/account/plans';
import { selectSubscription, subscriptionThunk } from '@proton/account/subscription';
import { selectUser } from '@proton/account/user';
import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces';
import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useHandler } from '@proton/hooks/useHandler';
import { usePaymentsApi } from '@proton/payments-hooks/react-extensions/usePaymentsApi';
import {
    type InitializeProps,
    type IsTrialResolver,
    PaymentsContext,
    type PaymentsContextType,
    type PricesResult,
} from '@proton/payments-hooks/ui/context/paymentsContext';
import { useMultiCheckGroups } from '@proton/payments-hooks/ui/context/useMultiCheckGroups';
import { getPreferredPlansMap } from '@proton/payments-hooks/ui/hooks/usePreferredPlansMap';
import {
    type BillingAddressExtended,
    type BillingAddressExtraProperties,
    DEFAULT_TAX_BILLING_ADDRESS,
    type FullBillingAddressFlat,
} from '@proton/payments/core/billing-address/billing-address';
import { getBillingAddressFromPaymentStatus } from '@proton/payments/core/billing-address/billing-address-from-payments-status';
import { loadInitialBillingAddress } from '@proton/payments/core/billing-address/load-initial-billing-address';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { computeOptimisticCheckResult } from '@proton/payments/core/computeOptimisticCheckResult';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { getStaticCouponConfig } from '@proton/payments/core/coupon-config/get-static-coupon-config';
import { getAvailableCurrencies, getPreferredCurrency, mainCurrencies } from '@proton/payments/core/currencies';
import { emptyEntitlementCatalog } from '@proton/payments/core/entitlements/empty-entitlement-catalog';
import type { EntitlementCatalog } from '@proton/payments/core/entitlements/interface';
import { VatReverseChargeNotSupportedError } from '@proton/payments/core/errors';
import type {
    Currency,
    Cycle,
    FreeSubscription,
    PaymentStatus,
    PaymentsApi,
    PlanIDs,
} from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import {
    type SubscriptionSelection,
    isModifyingPaidSubscriptionSelection,
    isSubscriptionCheckForbiddenWithReason,
    isSubscriptionSelectionEqual,
    shouldPassIsTrial,
} from '@proton/payments/core/subscription/helpers';
import { getPlanIDs } from '@proton/payments/core/subscription/helpers/plan-ids';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import {
    type MultiSubscriptionContext,
    createMultiSubscriptionContext,
} from '@proton/payments/core/subscription/multi-subscription-context';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { EstimationChangeAction } from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { getPlanFromPlanIDs, getPlanNameFromIDs, hasFreePlanIDs } from '@proton/shared/lib/payments/plan/helpers';
import type { FreePlanDefault, Plan } from '@proton/shared/lib/payments/plan/interface';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { useCouponConfig } from '../coupon-config/useCouponConfig';
import { checkMultiplePlans, getPlanToCheck, getSubscriptionDataFromPlanToCheck } from './helpers';

export interface PaymentsContextProviderProps {
    children: ReactNode;
    preload?: boolean;
    authenticated?: boolean;
    cachedPlans?: Plan[];
    withGuards?: boolean;
    /**
     * Billing details the user already gave, for example in the signup link. They fill in the gaps of the exposed
     * `billingAddress`, for the billing form and the subscription, from the first render on, as a billing form reads
     * its initial address once. The price checks don't send them
     */
    billingDetails?: BillingAddressExtraProperties;
}

interface PaymentsContextProviderState {
    telemetryContext: PaymentTelemetryContext;
    product: ProductParam;
    billingAddress: BillingAddressExtended;
    subscription: Subscription | FreeSubscription;
    entitlementCatalog: EntitlementCatalog;
    plansData: {
        plans: Plan[];
        freePlan: FreePlanDefault;
    };
    paymentStatus: PaymentStatus | undefined;
    initialized: boolean;
    availableCurrencies: readonly Currency[];
    planToCheck: PlanToCheck;
    checkResult: SubscriptionEstimation;
    vatNumber: string | undefined;
    loading: boolean;
}

type CheckInputs = Pick<PaymentsContextProviderState, 'planToCheck' | 'billingAddress' | 'vatNumber'>;

const toMultiSubscriptionContext = (
    lumoMultiSubscriptions: boolean,
    { subscription, entitlementCatalog }: Pick<PaymentsContextProviderState, 'subscription' | 'entitlementCatalog'>
): MultiSubscriptionContext =>
    createMultiSubscriptionContext({
        lumoMultiSubscriptions,
        subscription,
        entitlementCatalog: entitlementCatalog === emptyEntitlementCatalog ? undefined : entitlementCatalog,
    });

const selectInitialPaymentData = createSelector(
    [selectUser, selectSubscription, selectPlans, selectPaymentStatus, selectEntitlementCatalog],
    (user, subscription, plans, paymentStatus, entitlementCatalog) => {
        return {
            // NOTE: with optionals due to user, subscription not being initialized in account's public app
            user: user?.value,
            subscription: subscription?.value,
            plans: plans?.value,
            paymentStatus: paymentStatus?.value,
            entitlementCatalog: entitlementCatalog?.value,
        };
    }
);

export const PaymentsContextProvider = ({
    children,
    preload = true,
    authenticated = true,
    cachedPlans,
    withGuards = false,
    billingDetails,
}: PaymentsContextProviderProps) => {
    const { APP_NAME } = useConfig();

    const defaultApi = useApi();

    const {
        user,
        paymentStatus: paymentStatusInitial,
        subscription: subscriptionInitial,
        plans: plansInitial,
        entitlementCatalog: entitlementCatalogInitial,
    } = useSelector(selectInitialPaymentData); // Avoid using model hooks to avoid fetching data
    const dispatch = useDispatch();
    const lumoMultiSubscriptions = useFlag('LumoMultiSubscriptions');

    const getLocalizedPlansMapParametrized = (params: {
        paramCurrency?: Currency;
        paymentStatus: PaymentStatus | undefined;
        multiSubscriptionContext: MultiSubscriptionContext;
        plans: Plan[];
    }) => {
        return getPreferredPlansMap({
            currencyFallback: false,
            currencyOverrides: params.paramCurrency ? { paramCurrency: params.paramCurrency } : undefined,
            user,
            paymentStatus: params.paymentStatus,
            multiSubscriptionContext: params.multiSubscriptionContext,
            plans: params.plans,
        }).plansMap;
    };

    const { createNotification } = useNotifications();

    // The details only fill in the fields the address doesn't have, so what the user typed in the form wins, even a
    // field they cleared. A missing detail isn't added as an empty field, which the subscription rejects
    const withBillingDetails = (billingAddress: BillingAddressExtended): BillingAddressExtended => ({
        ...Object.fromEntries(Object.entries(billingDetails ?? {}).filter(([, value]) => value)),
        ...billingAddress,
    });

    const [, rerender] = useState<{}>({});
    const [initialState] = useState((): PaymentsContextProviderState => {
        const subscription = subscriptionInitial ?? FREE_SUBSCRIPTION;
        const plansData = plansInitial ?? {
            plans: cachedPlans ?? [],
            freePlan: FREE_PLAN,
        };
        const paymentStatus = paymentStatusInitial;
        const entitlementCatalog = entitlementCatalogInitial ?? emptyEntitlementCatalog;
        const billingAddress = paymentStatus
            ? getBillingAddressFromPaymentStatus(paymentStatus, { shouldRestoreZipCode: !authenticated })
            : DEFAULT_TAX_BILLING_ADDRESS;

        const initialMultiSubscriptionContext = toMultiSubscriptionContext(lumoMultiSubscriptions, {
            subscription,
            entitlementCatalog,
        });
        const autoCurrency = getPreferredCurrency({
            user,
            multiSubscriptionContext: initialMultiSubscriptionContext,
            plans: plansData.plans,
            paymentStatus,
        });
        const plansMap = getLocalizedPlansMapParametrized({
            paramCurrency: autoCurrency,
            paymentStatus,
            multiSubscriptionContext: initialMultiSubscriptionContext,
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
            entitlementCatalog,
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
            billingAddress,
            subscription,
            plansData,
            paymentStatus,
            initialized: false,
            availableCurrencies: mainCurrencies,
            planToCheck,
            checkResult,
            vatNumber: undefined,
            loading: false,
            entitlementCatalog,
        };
    });
    const stateRef = useRef<PaymentsContextProviderState>(initialState);

    const getMultiSubscriptionContext = (): MultiSubscriptionContext =>
        toMultiSubscriptionContext(lumoMultiSubscriptions, stateRef.current);

    const setState = (newState: Partial<PaymentsContextProviderState>) => {
        stateRef.current = { ...stateRef.current, ...newState };
        rerender({});
    };

    const abortControllerRef = useRef<AbortController | undefined>(undefined);
    const guardedSelectionRef = useRef<SubscriptionSelection | undefined>(undefined);
    // The changes asked for since the last check settled. A check started meanwhile builds on them rather than on the
    // checked state, so it doesn't drop the change it aborts
    const requestedRef = useRef<Partial<CheckInputs>>({});
    const getRequested = (): CheckInputs => ({
        planToCheck: requestedRef.current.planToCheck ?? stateRef.current.planToCheck,
        billingAddress: requestedRef.current.billingAddress ?? stateRef.current.billingAddress,
        vatNumber: requestedRef.current.vatNumber ?? stateRef.current.vatNumber,
    });

    const getLocalizedPlansMap = (params: { paramCurrency?: Currency }) => {
        return getLocalizedPlansMapParametrized({
            ...params,
            paymentStatus: stateRef.current.paymentStatus,
            multiSubscriptionContext: getMultiSubscriptionContext(),
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

    const isTrialResolverRef = useRef<IsTrialResolver | undefined>(undefined);

    const getIsTrial = (planToCheck: PlanToCheck) => {
        const resolver = isTrialResolverRef.current;
        return resolver ? resolver(planToCheck.planIDs) : Boolean(planToCheck.trial);
    };

    const setIsTrialResolver = (resolver: IsTrialResolver | undefined) => {
        if (isTrialResolverRef.current === resolver) {
            return;
        }

        isTrialResolverRef.current = resolver;
        // The rendered `isTrial` is derived from the resolver, so consumers reading it during render would otherwise
        // keep seeing the answer from before the resolver was registered.
        rerender({});
    };

    const getShouldPassTrial = (planIDs: PlanIDs, cycle: Cycle, canDowngrade: boolean) => {
        return shouldPassIsTrial({
            plansMap: getPlansMap(),
            newPlanIDs: planIDs,
            newCycle: cycle,
            downgradeIsTrial: canDowngrade,
            subscription: stateRef.current.subscription,
            entitlementCatalog: stateRef.current.entitlementCatalog,
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
    ): Promise<SubscriptionEstimation> => {
        const requested = getRequested();
        const newPlanToCheck = diff.planToCheck ?? requested.planToCheck;
        // Each part of the billing form sends only its own fields, e.g. the country, state and ZIP code
        const newBillingAddress = { ...requested.billingAddress, ...diff.billingAddress };
        const newVatNumber = diff.vatNumber ?? requested.vatNumber;
        // A selection carries the billing changes still waiting for their check, which it aborts. If the API refuses
        // the VAT number they carry, they are dropped like their own check would have been, and the selection is
        // checked again without them instead of failing with them.
        const carriesBillingChanges =
            diff.billingAddress === undefined &&
            diff.vatNumber === undefined &&
            (requestedRef.current.billingAddress !== undefined || requestedRef.current.vatNumber !== undefined);
        // Only the changes, so what loads meanwhile, e.g. the billing address of the payment status, still applies
        requestedRef.current = {
            planToCheck: diff.planToCheck ?? requestedRef.current.planToCheck,
            billingAddress: diff.billingAddress ? newBillingAddress : requestedRef.current.billingAddress,
            vatNumber: diff.vatNumber ?? requestedRef.current.vatNumber,
        };

        const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(getMultiSubscriptionContext(), {
            planIDs: newPlanToCheck.planIDs,
            cycle: newPlanToCheck.cycle,
        });

        if (paymentForbiddenReason.forbidden) {
            abortControllerRef.current?.abort();
            guardedSelectionRef.current = undefined;
            const newCheckResult = getOptimisticCheckResult(newPlanToCheck);

            setState({
                planToCheck: newPlanToCheck,
                checkResult: {
                    ...newCheckResult,
                    AmountDue: 0,
                    PeriodEnd: 0,
                },
            });

            // We don't want to update billing address if the payment is forbidden for any other reason apart from the
            // selection of a free plan. This is mostly a safery measure for now and subject for re-evaluation in the
            // future - maybe we don't need to be that cautious and we may update the billing address in all cases.
            if (paymentForbiddenReason.reason === 'paid-plan-required') {
                setState({
                    billingAddress: newBillingAddress,
                });
            }

            return newCheckResult;
        }

        abortControllerRef.current?.abort();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        let shouldRetryWithoutBillingChanges = false;
        try {
            const selection = { planIDs: newPlanToCheck.planIDs, cycle: newPlanToCheck.cycle };
            const shouldValidateGuards =
                withGuards &&
                isModifyingPaidSubscriptionSelection(
                    stateRef.current.subscription,
                    selection.planIDs,
                    selection.cycle
                ) &&
                !(guardedSelectionRef.current && isSubscriptionSelectionEqual(guardedSelectionRef.current, selection));
            const checkResult = stateRef.current.checkResult;
            const previousGuardResult = checkResult.GuardResult;

            if (shouldValidateGuards) {
                guardedSelectionRef.current = undefined;
                setState({ loading: true, checkResult: { ...checkResult, GuardResult: [] } });
            } else {
                setState({ loading: true });
            }

            const subscriptionData = getSubscriptionDataFromPlanToCheck({
                ...newPlanToCheck,
                ValidateBillingAddress: true,
                BillingAddress: newBillingAddress,
                VatId: newVatNumber,
                trial: newPlanToCheck.trial || getShouldPassTrial(newPlanToCheck.planIDs, newPlanToCheck.cycle, true),
            });
            if (shouldValidateGuards) {
                subscriptionData.ValidateGuards = true;
            }

            const newCheckResult = await paymentsApiRef.current.checkSubscription(subscriptionData, {
                signal: abortController.signal,
                previousEstimation: stateRef.current.checkResult,
            });
            // An optimistic result is built by the frontend after a recoverable error and carries no guard verdict.
            if (shouldValidateGuards) {
                guardedSelectionRef.current = newCheckResult.optimistic ? undefined : selection;
            }
            const shouldCarryGuardResult = !shouldValidateGuards && !!guardedSelectionRef.current;
            const displayedCheckResult = shouldCarryGuardResult
                ? { ...newCheckResult, GuardResult: previousGuardResult }
                : newCheckResult;
            setState({
                planToCheck: newPlanToCheck,
                billingAddress: newBillingAddress,
                vatNumber: newVatNumber,
                checkResult: displayedCheckResult,
            });
            paymentsApiRef.current.cacheMultiCheck(subscriptionData, newCheckResult);

            return displayedCheckResult;
        } catch (error) {
            // Only a refused VAT number is thrown for billing details, other failures aren't caused by them
            if (
                !carriesBillingChanges ||
                abortController.signal.aborted ||
                !(error instanceof VatReverseChargeNotSupportedError)
            ) {
                throw error;
            }
            shouldRetryWithoutBillingChanges = true;
        } finally {
            // Unless a newer change aborted it, this check settled what was asked for: checked now, or failed and dropped
            if (!abortController.signal.aborted) {
                requestedRef.current = {};
            }
            // Unless a newer check replaced it, whose price is still loading, or the retry below still loads it
            if (abortControllerRef.current === abortController && !shouldRetryWithoutBillingChanges) {
                setState({ loading: false });
            }
        }

        // The refused billing changes were cleared from the requested ones above, so the confirmed ones are used
        return calculateSubscriptionEstimation({ planToCheck: newPlanToCheck });
    };

    const getCurrentSelectedPlan = () => {
        return new SelectedPlan(
            stateRef.current.planToCheck.planIDs,
            getPlansMap(),
            stateRef.current.planToCheck.cycle,
            stateRef.current.planToCheck.currency
        );
    };

    const selectNewPlan = async (requestedPlanToCheck: PlanToCheck) => {
        const selectedPlan = getCurrentSelectedPlan();
        const newPlanToCheck: PlanToCheck = {
            ...requestedPlanToCheck,
            currency: getPreferredCurrency({
                paramCurrency: requestedPlanToCheck.currency,
                paramPlanName: getPlanNameFromIDs(requestedPlanToCheck.planIDs),
                paymentStatus: stateRef.current.paymentStatus,
                plans: stateRef.current.plansData.plans,
                user,
                multiSubscriptionContext: getMultiSubscriptionContext(),
            }),
        };

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
                isTrial: getIsTrial(newPlanToCheck),
            });
        }

        const isFree = hasFreePlanIDs(newPlanToCheck.planIDs);
        if (isFree) {
            abortControllerRef.current?.abort();
            guardedSelectionRef.current = undefined;
            const newCheckResult = getOptimisticCheckResult(newPlanToCheck);
            setState({ planToCheck: newPlanToCheck, checkResult: newCheckResult });
            // The aborted check's other changes are still asked for
            requestedRef.current = { ...requestedRef.current, planToCheck: newPlanToCheck };
            return newCheckResult;
        }

        return calculateSubscriptionEstimation({ planToCheck: newPlanToCheck });
    };

    const preloadPaymentsData = async ({ api: apiOverride }: { api?: Api } = {}) => {
        const api = apiOverride ?? defaultApi;

        const [plansData, { paymentStatus, billingAddress }, subscription, entitlementCatalog] = await Promise.all([
            dispatch(plansThunk({ api })),
            loadInitialBillingAddress({
                getPaymentStatus: () => dispatch(paymentStatusThunk({ api })),
                getFullBillingAddress: paymentsApiRef.current.getFullBillingAddress,
                isAuthenticated: authenticated,
            }),
            authenticated ? dispatch(subscriptionThunk()) : Promise.resolve(FREE_SUBSCRIPTION as FreeSubscription),
            dispatch(entitlementCatalogThunk({ api })),
        ]);

        const result = {
            plansData,
            paymentStatus,
            subscription,
            billingAddress,
            entitlementCatalog,
        };

        setState(result satisfies Partial<PaymentsContextProviderState>);
        return result;
    };

    const initialize = async ({
        api,
        paramCurrency,
        planToCheck: planToCheckParam,
        availablePlans,
        vatNumber,
        telemetryContext,
        product,
        // paymentFlow,
        // onChargeable,
    }: InitializeProps) => {
        const { plansData, paymentStatus: status, subscription } = await preloadPaymentsData({ api });
        const plans = plansData.plans;

        const selectedPlanName = planToCheckParam ? getPlanNameFromIDs(planToCheckParam.planIDs) : undefined;
        let preferredCurrency = getPreferredCurrency({
            paramCurrency,
            paramPlanName: selectedPlanName,
            paymentStatus: status,
            plans,
            multiSubscriptionContext: getMultiSubscriptionContext(),
        });

        const availableCurrencies = getAvailableCurrencies({
            paramCurrency,
            selectedPlanName,
            paymentStatus: status,
            plans,
            multiSubscriptionContext: getMultiSubscriptionContext(),
        });

        setState({
            availableCurrencies,
            ...(vatNumber ? { vatNumber } : {}),
        });

        const paymentsApi = getPaymentsApi(api);
        paymentsApiRef.current = paymentsApi;
        // setFacadeParams({ flow: paymentFlow });
        // setOnChargeableCallback(onChargeable);

        const localizedPlansMap = getPreferredPlansMap({
            currencyFallback: false,
            currencyOverrides: { paramCurrency: preferredCurrency },
            user,
            paymentStatus: stateRef.current.paymentStatus,
            multiSubscriptionContext: getMultiSubscriptionContext(),
            plans: stateRef.current.plansData.plans,
        }).plansMap;

        // The selection's own check caches its price, so the batch leaves it out
        const selection = planToCheckParam && getPlanToCheck({ ...planToCheckParam, currency: preferredCurrency });

        const availablePlansWithCurrencyAndAutomaticCoupon = availablePlans
            ?.map((plan) => ({
                ...getPlanToCheck({
                    ...plan,
                    currency: preferredCurrency,
                    coupon: 'coupon' in plan ? plan.coupon : planToCheckParam?.coupon,
                }),
                billingAddress: stateRef.current.billingAddress,
            }))
            .filter((plan) => {
                // There needs to be a coupon for it to be worth to ask the API.
                const hasCoupon = !!plan.coupon;
                // With regional currencies, the currency might not exist for that plan. So ignore asking the API in that case.
                const strictPlan = getPlanFromPlanIDs(localizedPlansMap, plan.planIDs);
                const hasCurrency = plan.currency === strictPlan?.Currency;
                const isSelection =
                    !!selection &&
                    isSubscriptionSelectionEqual(plan, selection) &&
                    plan.coupon === selection.coupon &&
                    !!plan.trial === !!selection.trial;
                return hasCoupon && hasCurrency && !isSelection;
            });

        // Checked along with the selection, so their prices show as soon as the selection's
        const availablePlansCheck = availablePlansWithCurrencyAndAutomaticCoupon?.length
            ? checkMultiplePlans({
                  getLocalizedPlansMap,
                  multiCheckGroups,
                  paymentsApi,
                  subscription,
                  plansToCheck: availablePlansWithCurrencyAndAutomaticCoupon,
                  billingAddress: stateRef.current.billingAddress,
                  multiSubscriptionContext: getMultiSubscriptionContext(),
              }).catch(noop)
            : undefined;

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
                // A newer selection aborted the check and carries its own currency, the retry would abort it in turn
                const aborted = error instanceof Error && error.name === 'AbortError';

                if (plan && !aborted) {
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

        await availablePlansCheck;

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
            ...getRequested().planToCheck,
            planIDs,
        });
    };

    const selectCycle = async (cycle: Cycle) => {
        await selectNewPlan({
            ...getRequested().planToCheck,
            cycle,
        });
    };

    const selectCurrency = async (currency: Currency) => {
        await selectNewPlan({
            ...getRequested().planToCheck,
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
            ...getRequested().planToCheck,
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

    // The billing change waiting for the debounce. Each part of the form sends the whole address as it rendered it, so
    // the later ones are merged into it: a waiting change must neither undo nor drop a newer one
    const pendingBillingRef = useRef<{ billingAddress: BillingAddressExtended; vatNumber?: string } | undefined>(
        undefined
    );

    // The billing changes are debounced, so no caller can await their check. A failed one is dropped: where the API
    // isn't silenced, it already shows the error
    const instantSelectBillingAddress = (billingAddress: BillingAddressExtended, vatNumber?: string) => {
        pendingBillingRef.current = undefined;
        calculateSubscriptionEstimation({ billingAddress, vatNumber }).catch(noop);
    };

    const userInputDebounceDelay = 500;

    const debouncedSelectBillingAddress = useHandler(instantSelectBillingAddress, { debounce: userInputDebounceDelay });

    const selectFullBillingAddress = (fullBillingAddress: FullBillingAddressFlat) => {
        const { VatId, ...billingAddressUpdate } = fullBillingAddress;
        const pending = pendingBillingRef.current;
        const billingAddress = { ...pending?.billingAddress, ...billingAddressUpdate };
        const vatNumber = VatId ?? pending?.vatNumber;
        const requestedBillingAddress = getRequested().billingAddress;

        // Only a few props can trigger the subscription estimation to be re-run instantly. For example, CountryCode and
        // State are using dropdowns, so users can't change them rapidly, and it makes sense to disable any debouncing
        // delay. Many other fields are simple text fields, so we should avoid re-calculation on every keystroke.
        const instantProps: (keyof BillingAddressExtended)[] = ['CountryCode', 'State'];
        const isDeboucingPropChanged = Object.keys(billingAddressUpdate).some((key) => {
            const propertyName = key as keyof BillingAddressExtended;
            return (
                !instantProps.includes(propertyName) &&
                billingAddressUpdate[propertyName] !== requestedBillingAddress[propertyName]
            );
        });
        if (isDeboucingPropChanged) {
            pendingBillingRef.current = { billingAddress, vatNumber };
            debouncedSelectBillingAddress(billingAddress, vatNumber);
            return;
        }

        // The waiting change goes in this check, instead of undoing it once its debounce ends
        debouncedSelectBillingAddress.cancel?.();
        instantSelectBillingAddress(billingAddress, vatNumber);
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

    const setVatNumberInner = (vatNumber: string) => {
        const requestedVatNumber = getRequested().vatNumber;
        if (
            vatNumber === requestedVatNumber ||
            // both are falsy is a subcase of equality in this case. If both are falsy, then they are already equal, and
            // no calculation is needed.
            (!vatNumber && !requestedVatNumber)
        ) {
            return;
        }

        calculateSubscriptionEstimation({ vatNumber }).catch(noop);
    };

    const setVatNumber = useHandler(setVatNumberInner, { debounce: userInputDebounceDelay });

    const reRunPaymentChecks = async () => {
        return selectNewPlan(getRequested().planToCheck);
    };

    const value: PaymentsContextType = {
        multiSubscriptionContext: getMultiSubscriptionContext(),
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
                multiSubscriptionContext: getMultiSubscriptionContext(),
                plans: stateRef.current.plansData.plans,
                paramCurrency: stateRef.current.planToCheck.currency,
            }),

        getPreferredCurrency: (selectedPlanName: PLANS) =>
            getPreferredCurrency({
                paramPlanName: selectedPlanName,
                paymentStatus: stateRef.current.paymentStatus,
                user,
                multiSubscriptionContext: getMultiSubscriptionContext(),
                plans: stateRef.current.plansData.plans,
            }),
        selectNewPlan,
        selectCurrency,
        selectFullBillingAddress,
        checkMultiplePlans: async (plansToCheck) => {
            const results = await checkMultiplePlans({
                getLocalizedPlansMap,
                multiCheckGroups,
                paymentsApi: paymentsApiRef.current,
                subscription: stateRef.current.subscription,
                plansToCheck,
                billingAddress: stateRef.current.billingAddress,
                multiSubscriptionContext: getMultiSubscriptionContext(),
            });
            // The results land in the price cache that getPrice reads: render them
            rerender({});
            return results;
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
        isTrial: getIsTrial(stateRef.current.planToCheck),
        setIsTrialResolver,
        // paymentFacade,
        billingAddress: withBillingDetails(stateRef.current.billingAddress),
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
