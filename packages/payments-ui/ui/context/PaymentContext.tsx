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
import { forceAddonsMinMaxConstraints } from '@proton/components/containers/payments/planCustomizer/helpers';
import { useHandler } from '@proton/hooks/useHandler';
import { usePaymentsApi } from '@proton/payments-hooks/react-extensions/usePaymentsApi';
import {
    type CheckInputs,
    type InitializeProps,
    type IsTrialResolver,
    PaymentsContext,
    type PaymentsContextType,
    type PricesResult,
} from '@proton/payments-hooks/ui/context/paymentsContext';
import { useMultiCheckGroups } from '@proton/payments-hooks/ui/context/useMultiCheckGroups';
import type {
    BillingAddressExtended,
    BillingAddressExtraProperties,
    FullBillingAddressFlat,
} from '@proton/payments/core/billing-address/billing-address';
import { loadInitialBillingAddress } from '@proton/payments/core/billing-address/load-initial-billing-address';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { computeOptimisticCheckResult } from '@proton/payments/core/computeOptimisticCheckResult';
import { FREE_SUBSCRIPTION, type PLANS } from '@proton/payments/core/constants';
import { getStaticCouponConfig } from '@proton/payments/core/coupon-config/get-static-coupon-config';
import { getAvailableCurrencies, getPreferredCurrency } from '@proton/payments/core/currencies';
import { VatReverseChargeNotSupportedError } from '@proton/payments/core/errors';
import type { Currency, Cycle, FreeSubscription, PaymentsApi, PlanIDs } from '@proton/payments/core/interface';
import {
    type SubscriptionSelection,
    isModifyingPaidSubscriptionSelection,
    isSubscriptionCheckForbiddenWithReason,
    isSubscriptionSelectionEqual,
    shouldPassIsTrial,
} from '@proton/payments/core/subscription/helpers';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { MultiSubscriptionContext } from '@proton/payments/core/subscription/multi-subscription-context';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { getChangedSubscription } from '@proton/payments/core/subscription/purchase-eligibility';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { getPlanFromPlanIDs, getPlanNameFromIDs, hasFreePlanIDs } from '@proton/shared/lib/payments/plan/helpers';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { useCouponConfig } from '../coupon-config/useCouponConfig';
import {
    type PaymentsContextProviderState,
    checkMultiplePlans,
    getAvailablePlansToCheck,
    getEstimationChangeAction,
    getInitialState,
    getLocalizedPlansMapForUser,
    getPlanToCheck,
    getSubscriptionDataFromPlanToCheck,
    toMultiSubscriptionContext,
    withBillingDetails,
} from './helpers';

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

    const { createNotification } = useNotifications();

    const [, rerender] = useState<{}>({});
    const [initialState] = useState(() =>
        getInitialState({
            user,
            subscription: subscriptionInitial,
            plansData: plansInitial,
            cachedPlans,
            paymentStatus: paymentStatusInitial,
            entitlementCatalog: entitlementCatalogInitial,
            authenticated,
            lumoMultiSubscriptions,
        })
    );
    const stateRef = useRef<PaymentsContextProviderState>(initialState);

    const getMultiSubscriptionContext = (): MultiSubscriptionContext =>
        toMultiSubscriptionContext(lumoMultiSubscriptions, stateRef.current);

    const getSubscriptionChangedBy = (planIDs: PlanIDs) =>
        getChangedSubscription(getMultiSubscriptionContext(), planIDs);

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
        return getLocalizedPlansMapForUser({
            ...params,
            user,
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
        return computeOptimisticCheckResult(
            { plansMap, ...planToCheck },
            getSubscriptionChangedBy(planToCheck.planIDs),
            {
                isTrial: planToCheck.trial || getShouldPassTrial(planToCheck.planIDs, planToCheck.cycle, true),
            }
        );
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

            // Only a free-plan selection shows the billing address the user asked for. It stays requested either way,
            // so the next check sends it
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
                    getSubscriptionChangedBy(selection.planIDs),
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

        const action = getEstimationChangeAction(stateRef.current.planToCheck, newPlanToCheck);

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

    const checkPlans = (plansToCheck: PlanToCheck[]) =>
        checkMultiplePlans({
            getLocalizedPlansMap,
            multiCheckGroups,
            paymentsApi: paymentsApiRef.current,
            plansToCheck,
            billingAddress: stateRef.current.billingAddress,
            multiSubscriptionContext: getMultiSubscriptionContext(),
        });

    const initialize = async ({
        api,
        paramCurrency,
        planToCheck: requestedPlanToCheck,
        availablePlans,
        vatNumber,
        telemetryContext,
        product,
    }: InitializeProps) => {
        const { plansData, paymentStatus: status, subscription } = await preloadPaymentsData({ api });
        const plans = plansData.plans;

        const selectedPlanName = requestedPlanToCheck ? getPlanNameFromIDs(requestedPlanToCheck.planIDs) : undefined;
        const preferredCurrency = getPreferredCurrency({
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

        paymentsApiRef.current = getPaymentsApi(api);

        const localizedPlansMap = getLocalizedPlansMap({ paramCurrency: preferredCurrency });

        // Plans like Pass Professional can't be bought below a minimum seat count, so start there instead of at 1
        const planToCheckParam = requestedPlanToCheck && {
            ...requestedPlanToCheck,
            planIDs:
                forceAddonsMinMaxConstraints({
                    selectedPlanIDs: requestedPlanToCheck.planIDs,
                    plansMap: localizedPlansMap,
                    currency: preferredCurrency,
                    subscription,
                }) ?? requestedPlanToCheck.planIDs,
        };

        const selection = planToCheckParam && getPlanToCheck({ ...planToCheckParam, currency: preferredCurrency });
        const plansToCheck = getAvailablePlansToCheck({
            availablePlans,
            selection,
            selectionCoupon: planToCheckParam?.coupon,
            currency: preferredCurrency,
            plansMap: localizedPlansMap,
        });

        // Checked along with the selection, so their prices show as soon as the selection's
        const availablePlansCheck = plansToCheck.length ? checkPlans(plansToCheck).catch(noop) : undefined;

        if (planToCheckParam && selection) {
            try {
                await selectNewPlan(selection);
            } catch (error) {
                /**
                 * Check call can fail if the plan is not available in the preferred currency
                 * This will fallback to an available currency for the plan
                 */
                const plan = getPlanFromPlanIDs(localizedPlansMap, planToCheckParam.planIDs);
                // A newer selection aborted the check and carries its own currency, the retry would abort it in turn
                const aborted = error instanceof Error && error.name === 'AbortError';

                if (plan && !aborted) {
                    await selectNewPlan(getPlanToCheck({ ...planToCheckParam, currency: plan.Currency }));
                }
            }
        }

        await availablePlansCheck;

        setState({ telemetryContext, product, initialized: true });
    };

    const getHasEssentialData = () => {
        return stateRef.current.plansData.plans.length > 0 && stateRef.current.paymentStatus !== undefined;
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

    const getFallbackPrice = (planToCheck: PlanToCheck): PricesResult => {
        const localizedPlansMap = getLocalizedPlansMap({ paramCurrency: planToCheck.currency });
        const checkResult = getOptimisticCheckResult(planToCheck);

        return {
            checkResult,
            checkoutUi: getCheckoutUi({ planIDs: planToCheck.planIDs, plansMap: localizedPlansMap, checkResult }),
        };
    };

    const getPrice: PaymentsContextType['getPrice'] = (planToCheck) => {
        const subscriptionData = getSubscriptionDataFromPlanToCheck({
            ...planToCheck,
            BillingAddress: stateRef.current.billingAddress,
            VatId: stateRef.current.vatNumber,
        });
        const result = paymentsApiRef.current.getCachedCheck(subscriptionData);

        // Not checked yet: without a coupon, the plan's list price is its price, only its taxes are unknown
        if (!result) {
            return planToCheck.coupon ? null : getFallbackPrice(planToCheck);
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
        initialize,
        preloaded: getHasEssentialData(),
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
            const results = await checkPlans(plansToCheck);
            // The results land in the price cache that getPrice reads: render them
            rerender({});
            return results;
        },
        plans: stateRef.current.plansData.plans,
        freePlan: stateRef.current.plansData.freePlan,
        plansMap: getPlansMap(),
        getPrice,
        getPriceOrFallback,
        getRequested,
        getOptimisticCheckResult,
        getCoupon,
        checkResult: stateRef.current.checkResult,
        isTrial: getIsTrial(stateRef.current.planToCheck),
        setIsTrialResolver,
        billingAddress: withBillingDetails(stateRef.current.billingAddress, billingDetails),
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
