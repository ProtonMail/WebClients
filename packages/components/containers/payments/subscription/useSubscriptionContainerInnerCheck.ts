import { useRef } from 'react';

import { c } from 'ttag';

import { useLoading } from '@proton/hooks';
import {
    type Cycle,
    type FreeSubscription,
    type FullPlansMap,
    PAYMENT_METHOD_TYPES,
    type PlainPaymentMethodType,
    type Plan,
    type PlanIDs,
    type Subscription,
    type SubscriptionEstimation,
    getFreeCheckResult,
    getIsPlanTransitionForbidden,
    getPlanIDs,
    hasPlanIDs,
    isSubscriptionCheckForbiddenWithReason,
} from '@proton/payments';
import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { ProrationMode } from '@proton/payments/core/api/api';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { VatReverseChargeNotSupportedError } from '@proton/payments/core/errors';
import { getAutoCoupon } from '@proton/payments/core/subscription/helpers';
import isTruthy from '@proton/utils/isTruthy';

import useNotifications from '../../../hooks/useNotifications';
import { forceAddonsMinMaxConstraints } from '../planCustomizer/ProtonPlanCustomizer';
import type { Model } from './SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from './constants';
import { getAllowedCycles } from './helpers/getAllowedCycles';

export const getCodes = ({ gift, coupon }: Pick<Model, 'gift' | 'coupon'>): string[] => [gift, coupon].filter(isTruthy);

export interface PlanTransitionCallbacks {
    onPlusToPlusTransition: (unlockPlan: Plan | undefined) => void;
    onVisionaryDowngradeWarning: () => Promise<void>;
    onVisionaryDowngradeHide: () => void;
}

interface NormalizeModelProps {
    skipPlanTransitionChecks: boolean;
    subscription: Subscription | FreeSubscription;
    plansMap: FullPlansMap;
    currentStep: SUBSCRIPTION_STEPS;
    callbacks: PlanTransitionCallbacks;
}

export interface UseSubscriptionContainerInnerCheckProps {
    model: Model;
    checkResult: SubscriptionEstimation;
    subscriptionCouponCode: string | undefined;
    subscription: Subscription | FreeSubscription;
    paymentsApi: {
        checkSubscription: (
            data: CheckSubscriptionData,
            options: { signal: AbortSignal; silence: boolean; previousEstimation: SubscriptionEstimation }
        ) => Promise<SubscriptionEstimation>;
    };
    paymentFacadeSelectedMethodType: PlainPaymentMethodType | undefined;
    skipPlanTransitionChecks: boolean;
    refs: {
        plansMapRef: { current: FullPlansMap };
        giftCodeRef: { current: { focus: () => void } | null };
    };
    setters: {
        setCheckResult: (result: SubscriptionEstimation) => void;
        setModel: (model: Model) => void;
        setVatReverseChargeErrorModal: (open: boolean) => void;
    };
    callbacks: {
        runAdditionalChecks: (
            newModel: Model,
            checkPayload: CheckSubscriptionData,
            checkResult: SubscriptionEstimation,
            signal: AbortSignal
        ) => Promise<void>;
        shouldPassIsTrial: (newModel: Model, downgradeIsTrial: boolean) => boolean | undefined;
        reportPlanIDsIfChanged: (planIDs: PlanIDs) => void;
        onCheck?: (
            data:
                | { model: Model; newModel: Model; type: 'error'; error: any }
                | { model: Model; newModel: Model; type: 'success'; result: SubscriptionEstimation }
        ) => void;
    } & PlanTransitionCallbacks;
}

function switchCycle(
    preferredCycle: Cycle,
    selectedPlanIDs: PlanIDs,
    currency: Model['currency'],
    subscription: Subscription | FreeSubscription,
    plansMap: FullPlansMap
): Cycle {
    const allowedCycles = getAllowedCycles({ subscription, planIDs: selectedPlanIDs, plansMap, currency });
    return allowedCycles.includes(preferredCycle) ? preferredCycle : allowedCycles[0];
}

async function normalizeModel(newModel: Model, props: NormalizeModelProps): Promise<boolean> {
    if (!props.skipPlanTransitionChecks) {
        const latestSubscription = props.subscription.UpcomingSubscription ?? props.subscription;
        const planTransitionForbidden = getIsPlanTransitionForbidden({
            subscription: props.subscription,
            plansMap: props.plansMap,
            planIDs: newModel.planIDs,
        });

        if (planTransitionForbidden?.type === 'lumo-plus' || planTransitionForbidden?.type === 'meet-plus') {
            newModel.planIDs = planTransitionForbidden.newPlanIDs;
            newModel.cycle = switchCycle(
                props.subscription?.Cycle ?? newModel.cycle,
                newModel.planIDs,
                newModel.currency,
                props.subscription,
                props.plansMap
            );
        }

        if (planTransitionForbidden?.type === 'plus-to-plus') {
            props.callbacks.onPlusToPlusTransition(
                planTransitionForbidden.newPlanName ? props.plansMap[planTransitionForbidden.newPlanName] : undefined
            );
            newModel.planIDs = getPlanIDs(latestSubscription);
            newModel.cycle = switchCycle(
                newModel.cycle,
                newModel.planIDs,
                newModel.currency,
                props.subscription,
                props.plansMap
            );
            newModel.step = props.currentStep;
        }

        if (planTransitionForbidden?.type === 'visionary-downgrade') {
            try {
                await props.callbacks.onVisionaryDowngradeWarning();
            } catch {
                return false;
            }
        } else {
            props.callbacks.onVisionaryDowngradeHide();
        }
    }

    newModel.planIDs =
        forceAddonsMinMaxConstraints({
            selectedPlanIDs: newModel.planIDs,
            plansMap: props.plansMap,
            currency: newModel.currency,
            subscription: props.subscription,
        }) ?? newModel.planIDs;

    return true;
}

export function useSubscriptionContainerInnerCheck(props: UseSubscriptionContainerInnerCheckProps): {
    check: (
        newModel?: Model,
        wantToApplyNewGiftCode?: boolean,
        selectedMethod?: PlainPaymentMethodType
    ) => Promise<SubscriptionEstimation | undefined>;
    loadingCheck: boolean;
} {
    const abortControllerRef = useRef<AbortController | undefined>(undefined);
    const latestValidCouponCodeRef = useRef('');
    const [loadingCheck, withLoadingCheck] = useLoading();
    const { createNotification } = useNotifications();

    const check = async (
        newModel: Model = props.model,
        wantToApplyNewGiftCode = false,
        selectedMethod?: PlainPaymentMethodType
    ): Promise<SubscriptionEstimation | undefined> => {
        const {
            model,
            checkResult,
            subscriptionCouponCode,
            subscription,
            paymentsApi,
            paymentFacadeSelectedMethodType,
            refs: { plansMapRef, giftCodeRef },
            setters: { setCheckResult, setModel, setVatReverseChargeErrorModal },
            callbacks: { runAdditionalChecks, shouldPassIsTrial, reportPlanIDsIfChanged, onCheck },
        } = props;

        const copyNewModel: Model = {
            ...newModel,
            initialCheckComplete: true,
            paymentForbiddenReason: { forbidden: false },
        };

        if (!hasPlanIDs(copyNewModel.planIDs)) {
            setCheckResult(getFreeCheckResult(model.currency, model.cycle));
            setModel(copyNewModel);
            return;
        }

        const shouldContinue = await normalizeModel(copyNewModel, {
            skipPlanTransitionChecks: props.skipPlanTransitionChecks,
            subscription: props.subscription,
            plansMap: props.refs.plansMapRef.current,
            currentStep: props.model.step,
            callbacks: props.callbacks,
        });
        if (!shouldContinue) {
            return;
        }

        reportPlanIDsIfChanged(copyNewModel.planIDs);

        const dontQueryCheck = copyNewModel.step === SUBSCRIPTION_STEPS.PLAN_SELECTION;

        if (dontQueryCheck) {
            setCheckResult({
                ...getOptimisticCheckResult({
                    plansMap: plansMapRef.current,
                    cycle: copyNewModel.cycle,
                    planIDs: copyNewModel.planIDs,
                    currency: copyNewModel.currency,
                }),
                Currency: copyNewModel.currency,
                PeriodEnd: 0,
            });
            setModel(copyNewModel);
            return;
        }

        const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(subscription, {
            planIDs: copyNewModel.planIDs,
            cycle: copyNewModel.cycle,
            coupon: getCodes(copyNewModel).at(0),
        });
        if (paymentForbiddenReason.forbidden) {
            setCheckResult({
                ...getOptimisticCheckResult({
                    plansMap: plansMapRef.current,
                    cycle: copyNewModel.cycle,
                    planIDs: copyNewModel.planIDs,
                    currency: copyNewModel.currency,
                }),
                Currency: copyNewModel.currency,
                PeriodEnd: 0,
                AmountDue: 0,
            });
            setModel({
                ...copyNewModel,
                paymentForbiddenReason,
            });
            return;
        }

        const checkPromise = (async () => {
            try {
                abortControllerRef.current?.abort();
                abortControllerRef.current = new AbortController();

                const coupon = getAutoCoupon({
                    coupon: copyNewModel.coupon,
                    planIDs: copyNewModel.planIDs,
                    cycle: copyNewModel.cycle,
                    currency: copyNewModel.currency,
                });

                // PAY-1822. To put it simply, this code removes all the previously applied coupons or gift codes
                // if user re-enters the same coupon code as in the currently active subscription.
                // We must do it because of backend limitations. The backend won't recognize the currently active
                // subscription coupon if there is any other valid coupon in the request payload.
                const codesArgument =
                    !!subscriptionCouponCode && copyNewModel.gift === subscriptionCouponCode
                        ? { coupon: subscriptionCouponCode }
                        : { gift: copyNewModel.gift, coupon };

                const Codes = getCodes(codesArgument);

                // selectedMethod variable prevails over paymentFacadeSelectedMethodType because it's passed in the
                // onMethod change handler. So this variable changes before paymentFacadeSelectedMethodType is
                // updated. We must take into account the case when user unselects SEPA, making selectedMethod not SEPA,
                // while paymentFacadeSelectedMethodType is still SEPA. In this case we want to call /check without
                // ProrationMode == Exact.
                const currentlySelectedMethod = selectedMethod ?? paymentFacadeSelectedMethodType;

                const checkPayload: CheckSubscriptionData = {
                    Codes,
                    Plans: copyNewModel.planIDs,
                    Currency: copyNewModel.currency,
                    Cycle: copyNewModel.cycle,
                    BillingAddress: {
                        CountryCode: copyNewModel.taxBillingAddress.CountryCode,
                        State: copyNewModel.taxBillingAddress.State,
                        ZipCode: copyNewModel.taxBillingAddress.ZipCode,
                    },
                    ProrationMode:
                        currentlySelectedMethod === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
                            ? ProrationMode.Exact
                            : undefined,
                    IsTrial: shouldPassIsTrial(newModel, false),
                    ValidateBillingAddress: true,
                };

                const newCheckResult = await paymentsApi.checkSubscription(checkPayload, {
                    signal: abortControllerRef.current.signal,
                    silence: true,
                    previousEstimation: checkResult,
                });

                try {
                    await runAdditionalChecks(
                        copyNewModel,
                        checkPayload,
                        newCheckResult,
                        abortControllerRef.current.signal
                    );
                } catch {}

                const { Gift = 0 } = newCheckResult;
                const { Code = '' } = newCheckResult.Coupon || {}; // Coupon can equal null

                if (wantToApplyNewGiftCode && copyNewModel.gift?.toLowerCase() !== Code.toLowerCase() && !Gift) {
                    createNotification({ text: c('Error').t`Invalid code`, type: 'error' });
                    giftCodeRef.current?.focus();

                    // Don't update state with the errored check result. This is especially important for the "already-subscribed" case
                    return checkResult;
                }

                if (Code) {
                    latestValidCouponCodeRef.current = Code;
                }
                copyNewModel.coupon = Code || subscriptionCouponCode || latestValidCouponCodeRef.current;

                if (!Gift) {
                    delete copyNewModel.gift;
                }

                setCheckResult(newCheckResult);
                setModel(copyNewModel);
                onCheck?.({ model, newModel: copyNewModel, type: 'success', result: newCheckResult });
            } catch (error: any) {
                if (error?.name === 'AbortError') {
                    return;
                }

                if (error.name === 'OfflineError') {
                    setModel({ ...model, step: SUBSCRIPTION_STEPS.NETWORK_ERROR });
                }

                if (error instanceof VatReverseChargeNotSupportedError) {
                    setVatReverseChargeErrorModal(true);
                    return;
                }

                onCheck?.({ model, newModel: copyNewModel, type: 'error', error });
            }

            return checkResult;
        })();

        void withLoadingCheck(checkPromise);

        return checkPromise;
    };

    return { check, loadingCheck };
}
