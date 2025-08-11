import type { FormEvent, ReactNode, RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button, Tooltip } from '@proton/atoms';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { setUsedBfOffer } from '@proton/components/containers/offers/bfOffer';
import PlusToPlusUpsell from '@proton/components/containers/payments/subscription/PlusToPlusUpsell';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useEventManager from '@proton/components/hooks/useEventManager';
import useHandler from '@proton/components/hooks/useHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { type TelemetryPaymentFlow } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import type { WebPaymentsSubscriptionStepsTotal } from '@proton/metrics/types/web_payments_subscription_steps_total_v1.schema';
import {
    type AddonGuard,
    Audience,
    type BillingAddress,
    type CheckSubscriptionData,
    type Currency,
    type Cycle,
    DEFAULT_CURRENCY,
    DisplayablePaymentError,
    type FreePlanDefault,
    type MultiCheckSubscriptionData,
    PAYMENT_METHOD_TYPES,
    PLANS,
    type PaymentMethodType,
    type PaymentProcessorHook,
    type PaymentProcessorType,
    type PaymentStatus,
    type PlainPaymentMethodType,
    type Plan,
    type PlanIDs,
    ProrationMode,
    type Subscription,
    type SubscriptionCheckResponse,
    SubscriptionMode,
    captureWrongPlanIDs,
    captureWrongPlanName,
    getCheckoutModifiers,
    getFreeCheckResult,
    getHas2024OfferCoupon,
    getIsB2BAudienceFromPlan,
    getIsB2BAudienceFromSubscription,
    getIsPlanTransitionForbidden,
    getMaximumCycleForApp,
    getPaymentsVersion,
    getPlanCurrencyFromPlanIDs,
    getPlanFromPlanIDs,
    getPlanIDs,
    getPlanNameFromIDs,
    getPlansMap,
    hasDeprecatedVPN,
    hasLumoPlan,
    hasPlanIDs,
    isCheckForbidden,
    isFreeSubscription,
    isManagedExternally,
    shouldPassIsTrial as shouldPassIsTrialPayments,
    switchPlan,
} from '@proton/payments';
import { PaymentsContextProvider, useIsB2BTrial, useTaxCountry, useVatNumber } from '@proton/payments/ui';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/plans';
import { APPS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import {
    type EnrichedCheckResponse,
    getIsCustomCycle,
    getOptimisticCheckResult,
} from '@proton/shared/lib/helpers/checkout';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { usePaymentFacade } from '../../../../components/payments/client-extensions';
import { useChargebeeContext } from '../../../../components/payments/client-extensions/useChargebeeContext';
import { usePollEvents } from '../../../../components/payments/client-extensions/usePollEvents';
import type { Operations, OperationsSubscriptionData } from '../../../../components/payments/react-extensions';
import { usePaymentsApi } from '../../../../components/payments/react-extensions/usePaymentsApi';
import { useModalTwoPromise } from '../../../components/modalTwo/useModalTwo';
import GenericError from '../../error/GenericError';
import { changeDefaultPaymentMethodBeforePayment } from '../DefaultPaymentMethodMessage';
import InclusiveVatText from '../InclusiveVatText';
import PaymentGiftCode from '../PaymentGiftCode';
import PaymentWrapper from '../PaymentWrapper';
import { ProtonPlanCustomizer } from '../planCustomizer/ProtonPlanCustomizer';
import { getHasPlanCustomizer } from '../planCustomizer/helpers';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import PlanSelection from './PlanSelection';
import { RenewalEnableNote } from './RenewalEnableNote';
import SubscriptionSubmitButton from './SubscriptionSubmitButton';
import { useCancelSubscriptionFlow } from './cancelSubscription/useCancelSubscriptionFlow';
import { SUBSCRIPTION_STEPS } from './constants';
import { useCouponConfig } from './coupon-config/useCouponConfig';
import SubscriptionCheckoutCycleItem from './cycle-selector/SubscriptionCheckoutCycleItem';
import SubscriptionCycleSelector from './cycle-selector/SubscriptionCycleSelector';
import type { SelectedProductPlans } from './helpers';
import { getAutoCoupon, getDefaultSelectedProductPlans } from './helpers';
import { getAllowedCycles } from './helpers/getAllowedCycles';
import { getInitialCycle } from './helpers/getInitialCycle';
import { getInitialCheckoutStep } from './helpers/initialCheckoutStep';
import SubscriptionCheckout from './modal-components/SubscriptionCheckout';
import SubscriptionThanks from './modal-components/SubscriptionThanks';
import { PostSubscriptionModalLoadingContent } from './postSubscription/modals/PostSubscriptionModalsComponents';
import useSubscriptionModalTelemetry from './useSubscriptionModalTelemetry';

import './SubscriptionContainer.scss';

type Source = WebPaymentsSubscriptionStepsTotal['Labels']['source'];
type FromPlan = WebPaymentsSubscriptionStepsTotal['Labels']['fromPlan'];
type MetricsStep = WebPaymentsSubscriptionStepsTotal['Labels']['step'];

export interface Model {
    step: SUBSCRIPTION_STEPS;
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    coupon?: string;
    gift?: string;
    initialCheckComplete: boolean;
    taxBillingAddress: BillingAddress;
    paymentForbidden: boolean;
    zipCodeValid: boolean;
}

const BACK: Partial<{ [key in SUBSCRIPTION_STEPS]: SUBSCRIPTION_STEPS }> = {
    [SUBSCRIPTION_STEPS.CHECKOUT]: SUBSCRIPTION_STEPS.PLAN_SELECTION,
};

const getCodes = ({ gift, coupon }: Pick<Model, 'gift' | 'coupon'>): string[] => [gift, coupon].filter(isTruthy);

interface RenderProps {
    title: string;
    content: ReactNode;
    footer?: ReactNode;
    onSubmit: (e: FormEvent) => void;
    step: SUBSCRIPTION_STEPS;
    planIDs: PlanIDs;
}

export interface SubscriptionContainerProps {
    topRef?: RefObject<HTMLDivElement>;
    app: ProductParam;
    step?: SUBSCRIPTION_STEPS;
    cycle?: Cycle;
    minimumCycle?: Cycle;
    maximumCycle?: Cycle;
    currency?: Currency;
    plan?: PLANS;
    planIDs?: PlanIDs;
    coupon?: string | null;
    disablePlanSelection?: boolean;
    disableThanksStep?: boolean;
    defaultAudience?: Audience;
    disableCycleSelector?: boolean;
    defaultSelectedProductPlans?: SelectedProductPlans;
    onSubscribed?: () => void;
    onUnsubscribed?: () => void;
    onCancel?: () => void;
    onCheck?: (
        data:
            | { model: Model; newModel: Model; type: 'error'; error: any }
            | { model: Model; newModel: Model; type: 'success'; result: SubscriptionCheckResponse }
    ) => void;
    metrics: {
        source: Source;
    };
    telemetryFlow?: TelemetryPaymentFlow;
    render: (renderProps: RenderProps) => ReactNode;
    subscription: Subscription;
    organization: Organization;
    plans: Plan[];
    freePlan: FreePlanDefault;
    mode?: 'upsell-modal';
    upsellRef?: string;
    parent?: string;
    /**
     * If none specified, then shows all addons
     */
    allowedAddonTypes?: AddonGuard[];
    paymentStatus: PaymentStatus;
}

/**
 * If user already has mobile lumo subscription then they can't buy lumo addon.
 */
const canAddLumoAddon = (subscription: Subscription): boolean => {
    // Check if the current subscription or any of the secondary subscriptions has a mobile lumo subscription.
    return ![subscription, ...(subscription.SecondarySubscriptions ?? [])].some(
        (sub) => hasLumoPlan(sub) && isManagedExternally(sub)
    );
};

const SubscriptionContainerInner = ({
    topRef: customTopRef,
    upsellRef,
    app,
    step: maybeStep,
    cycle: maybeCycle,
    minimumCycle,
    maximumCycle: maybeMaximumCycle,
    currency: maybeCurrency,
    coupon: maybeCoupon,
    plan,
    planIDs: maybePlanIDs,
    onSubscribed,
    onUnsubscribed,
    onCancel,
    onCheck,
    disablePlanSelection,
    disableCycleSelector: maybeDisableCycleSelector,
    disableThanksStep,
    defaultAudience = Audience.B2C,
    defaultSelectedProductPlans,
    metrics: outerMetricsProps,
    telemetryFlow,
    render,
    subscription,
    organization,
    plans,
    freePlan,
    mode,
    parent,
    allowedAddonTypes,
    paymentStatus,
}: SubscriptionContainerProps) => {
    const lumoAddonEnabled = canAddLumoAddon(subscription);

    const defaultMaximumCycle = getMaximumCycleForApp(app);
    const maximumCycle = maybeMaximumCycle ?? defaultMaximumCycle;

    const metricStepMap: Record<SUBSCRIPTION_STEPS, MetricsStep> = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: 'network-error',
        [SUBSCRIPTION_STEPS.PLAN_SELECTION]: 'plan-selection',
        [SUBSCRIPTION_STEPS.CHECKOUT]: 'checkout',
        [SUBSCRIPTION_STEPS.UPGRADE]: 'upgrade',
        [SUBSCRIPTION_STEPS.THANKS]: 'thanks',
    };

    const topRef = useRef<HTMLDivElement>(null);
    const api = useApi();
    const { paymentsApi } = usePaymentsApi(api);
    const [user] = useUser();
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const { call } = useEventManager();
    const pollEventsMultipleTimes = usePollEvents();
    const [calendarDowngradeModal, showCalendarDowngradeModal] = useModalTwoPromise();
    const { createNotification } = useNotifications();
    const { cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({ app });
    const [vpnServers] = useVPNServersCount();
    const getCalendars = useGetCalendars();
    const { APP_NAME } = useConfig();

    const [subscribing, withSubscribing] = useLoading();
    const [loadingCheck, withLoadingCheck] = useLoading();
    const [blockCycleSelector, withBlockCycleSelector] = useLoading();
    const [blockAccountSizeSelector, withBlockAccountSizeSelector] = useLoading();
    const [loadingGift, withLoadingGift] = useLoading();
    const [additionalCheckResults, setAdditionalCheckResults] = useState<SubscriptionCheckResponse[]>();
    const chargebeeContext = useChargebeeContext();
    const scribeEnabled = useAssistantFeatureEnabled();
    const [upsellModal, setUpsellModal, renderUpsellModal] = useModalState();
    const [plusToPlusUpsell, setPlusToPlusUpsell] = useState<{ unlockPlan: Plan | undefined } | null>(null);

    const [audience, setAudience] = useState(() => {
        if ((plan && getIsB2BAudienceFromPlan(plan)) || getIsB2BAudienceFromSubscription(subscription)) {
            return Audience.B2B;
        }
        return defaultAudience;
    });

    const { reportSubscriptionModalInitialization, reportSubscriptionModalPayment } = useSubscriptionModalTelemetry();

    const latestSubscription = subscription.UpcomingSubscription ?? subscription;

    const { getPreferredCurrency } = useCurrencies();
    const [preferredCurrency, setPreferredCurrency] = useState(() =>
        getPreferredCurrency({
            user,
            subscription,
            plans,
            paramCurrency: maybeCurrency,
            paymentStatus,
            paramPlanName: plan,
        })
    );

    const plansMap = getPlansMap(plans, preferredCurrency);

    const planIDs = useMemo(() => {
        const subscriptionPlanIDs = getPlanIDs(latestSubscription);

        // we don't let existing users of the deprecated VPN plan to modify their subscription
        // and stay on the same plan. If they want to do manual action then we change them to the new VPN plan.
        let newPlan = plan;
        if (hasDeprecatedVPN(latestSubscription) && !plan) {
            newPlan = PLANS.VPN2024;
        }

        if (newPlan) {
            return switchPlan({
                subscription: latestSubscription,
                newPlan,
                organization,
                plans,
            });
        }

        return maybePlanIDs || subscriptionPlanIDs;
    }, [subscription, plansMap, organization, plans, maybePlanIDs]);

    const [model, setModel] = useState<Model>(() => {
        const step = getInitialCheckoutStep(planIDs, maybeStep);

        const currency = getPlanCurrencyFromPlanIDs(plansMap, planIDs) ?? preferredCurrency;

        const cycle = getInitialCycle({
            cycleParam: maybeCycle,
            subscription,
            planIDs,
            plansMap,
            isPlanSelection: step === SUBSCRIPTION_STEPS.PLAN_SELECTION,
            app,
            minimumCycle,
            maximumCycle,
            currency,
            allowDowncycling: true,
        });

        const model: Model = {
            step,
            cycle,
            currency,
            coupon: maybeCoupon || subscription.CouponCode || undefined,
            planIDs,
            initialCheckComplete: false,
            taxBillingAddress: {
                CountryCode: paymentStatus.CountryCode,
                State: paymentStatus.State,
                ZipCode: paymentStatus.ZipCode,
            },
            paymentForbidden: false,
            zipCodeValid: true,
        };

        return model;
    });

    const [checkResult, setCheckResult] = useState<SubscriptionCheckResponse>(
        getFreeCheckResult(model.currency, model.cycle)
    );

    const couponConfig = useCouponConfig({ checkResult, planIDs: model.planIDs, plansMap });

    const [selectedProductPlans, setSelectedProductPlans] = useState(
        defaultSelectedProductPlans ||
            getDefaultSelectedProductPlans({
                appName: app,
            })
    );

    const application = useMemo(() => {
        if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
            return APPS.PROTONVPN_SETTINGS;
        }
        if (APP_NAME === APPS.PROTONACCOUNTLITE) {
            return APPS.PROTONACCOUNTLITE;
        }

        return APPS.PROTONACCOUNT;
    }, [APP_NAME]);

    const metricsProps = {
        ...outerMetricsProps,
        step: metricStepMap[model.step],
        fromPlan: isFreeSubscription(subscription) ? 'free' : ('paid' as FromPlan),
        application,
    };

    const checkoutModifiers = getCheckoutModifiers(checkResult);

    const amountDue = checkResult?.AmountDue || 0;
    const couponCode = checkResult?.Coupon?.Code;
    const couponDescription = checkResult?.Coupon?.Description;

    const subscriptionCouponCode = subscription?.CouponCode;
    const latestValidCouponCodeRef = useRef('');

    const giftCodeRef = useRef<HTMLInputElement>(null);

    const abortControllerRef = useRef<AbortController>();

    const amount = model.step === SUBSCRIPTION_STEPS.CHECKOUT ? amountDue : 0;

    const getCodesForSubscription = () => {
        return getCodes({
            // the gift code is always set by user directly, it can't come from subscription or from
            // /check endpoint
            gift: model.gift,
            // the coupon can come from multiple sources but must be always validated by /check
            // endpoint. If the endpoint doesn't return the code back then it's invalid and we
            // should not use it for subscription endpoint.
            coupon: checkResult?.Coupon?.Code,
        });
    };

    const isTrial = checkResult?.SubscriptionMode === SubscriptionMode.Trial;

    const handleSubscribe = async (
        operations: Operations,
        { operationsSubscriptionData, paymentProcessorType, paymentMethodValue }: SubscriptionContext
    ) => {
        if (!hasPlanIDs(operationsSubscriptionData.Plans)) {
            const result = await cancelSubscription({});
            if (result?.status === 'kept') {
                return;
            }
            onUnsubscribed?.();
            return;
        }

        const shouldCalendarPreventSubscriptionChangePromise = getShouldCalendarPreventSubscripitionChange({
            user,
            api,
            getCalendars,
            newPlan: operationsSubscriptionData.Plans,
            plans,
        });

        if (await shouldCalendarPreventSubscriptionChangePromise) {
            return showCalendarDowngradeModal();
        }

        // When user has an error during checkout, we need to return him to the exact same step
        const checkoutStep = model.step;
        try {
            setModel((model) => ({ ...model, step: SUBSCRIPTION_STEPS.UPGRADE }));
            try {
                await changeDefaultPaymentMethodBeforePayment(
                    api,
                    paymentMethodValue,
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    paymentFacade.methods.savedMethods ?? []
                );

                const codes = getCodesForSubscription();
                await operations.subscribe({
                    Codes: codes,
                    Plans: model.planIDs,
                    Cycle: model.cycle,
                    product: app,
                    taxBillingAddress: model.taxBillingAddress,
                    StartTrial: isTrial,
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    vatNumber: vatNumber.vatNumber,
                });

                if (codes.some((code) => getHas2024OfferCoupon(code))) {
                    setUsedBfOffer(true);
                } else {
                    setUsedBfOffer(false);
                }

                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                paymentFacade.telemetry.reportPaymentSuccess(paymentProcessorType);
                if (parent === 'subscription-modal') {
                    void reportSubscriptionModalPayment({
                        cycle: model.cycle,
                        currency: model.currency,
                        plan: getPlanNameFromIDs(model.planIDs) || 'n/a',
                        coupon: model.coupon,
                    });
                }
            } catch (error) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                paymentFacade.telemetry.reportPaymentFailure(paymentProcessorType);

                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                paymentFacade.reset();

                throw error;
            }
            await call();

            void metrics.payments_subscription_total.increment({
                ...metricsProps,
                status: 'success',
            });

            if (disableThanksStep) {
                onSubscribed?.();
            } else {
                setModel((model) => ({ ...model, step: SUBSCRIPTION_STEPS.THANKS }));
            }
        } catch (error: any) {
            const { Code = 0 } = error.data || {};

            if (Code === API_CUSTOM_ERROR_CODES.PAYMENTS_SUBSCRIPTION_AMOUNT_MISMATCH) {
                await check(); // eslint-disable-line @typescript-eslint/no-use-before-define
                // translator: this message pops in a notification, in case user is waiting really too long, or does the checkout in another tab, which makes this ones not valid/expiring
                createNotification({ text: c('Error').t`Checkout expired, please try again`, type: 'error' });
            }

            observeApiError(error, (status) =>
                metrics.payments_subscription_total.increment({
                    ...metricsProps,
                    status,
                })
            );

            setModel((model) => ({ ...model, step: checkoutStep }));
            throw error;
        }
    };

    type SubscriptionContext = {
        operationsSubscriptionData: OperationsSubscriptionData;
        paymentProcessorType: PaymentProcessorType;
        paymentMethodValue: PaymentMethodType;
    };

    const selectedPlanCurrency = checkResult?.Currency ?? DEFAULT_CURRENCY;
    const selectedPlanName = getPlanFromPlanIDs(plansMap, model.planIDs)?.Name;

    const paymentFacade = usePaymentFacade({
        checkResult,
        amount,
        currency: selectedPlanCurrency,
        selectedPlanName,
        billingAddress: model.taxBillingAddress,
        billingPlatform: subscription?.BillingPlatform,
        chargebeeUserExists: user.ChargebeeUserExists,
        paymentStatus,
        onChargeable: (operations, { paymentProcessorType, source }) => {
            const context: SubscriptionContext = {
                operationsSubscriptionData: {
                    Plans: model.planIDs,
                    Cycle: model.cycle,
                    product: app,
                    Codes: getCodesForSubscription(),
                    taxBillingAddress: model.taxBillingAddress,
                    StartTrial: isTrial,
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    vatNumber: vatNumber.vatNumber,
                },
                paymentProcessorType,
                paymentMethodValue: source,
            };

            const promise = withSubscribing(handleSubscribe(operations, context));

            promise.then(() => pollEventsMultipleTimes()).catch(noop);

            return promise.catch(noop);
        },
        flow: 'subscription',
        telemetryFlow,
        user,
        subscription,
        planIDs: model.planIDs,
        coupon: couponCode,
        onBeforeSepaPayment: async () => {
            if (checkResult.ProrationMode === ProrationMode.Exact) {
                const currentAmountDue = checkResult.AmountDue;
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                const newCheckResult = await check();
                if (newCheckResult?.AmountDue !== currentAmountDue) {
                    createNotification({
                        text: c('Error').t`The amount due has changed. Please try again.`,
                        type: 'warning',
                        expiration: -1,
                    });
                    return false;
                }
            }

            return true;
        },
    });

    // even though this value tighly connected to paymentFacade.initialized, we still used it to *delay* the moment
    // when the loading state is hidden from the user. This is needed to avoid flickering between the moment when
    // paymentFacade.initialized === true but the first check() hasn't started yet.
    const [initialLoading, setInitialLoading] = useState(!paymentFacade.initialized);

    const isFreePlanSelected = !hasPlanIDs(model.planIDs);
    const disableCycleSelector =
        isFreePlanSelected ||
        maybeDisableCycleSelector ||
        getIsCustomCycle(model.cycle) ||
        selectedPlanName === PLANS.PASS_LIFETIME;

    const computeAllowedCycles = (planIDs: PlanIDs) =>
        getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            currency: selectedPlanCurrency,
            planIDs,
            plansMap,
            allowDowncycling: true,
            cycleParam: maybeCycle,
            app,
            couponConfig,
        });

    const runAdditionalChecks = async (
        newModel: Model,
        checkPayload: CheckSubscriptionData,
        checkResult: EnrichedCheckResponse,
        signal: AbortSignal
    ) => {
        setAdditionalCheckResults([]);

        const codes = checkPayload.Codes;

        const noCodes = !codes || codes.length === 0;
        if (noCodes) {
            return;
        }

        paymentsApi.cacheMultiCheck(checkPayload, undefined, checkResult);

        const additionalCycles = computeAllowedCycles(newModel.planIDs)
            // skip the cycle that was just checked
            .filter((cycle) => cycle !== checkResult.Cycle)

            // skip cycles of the currently active subscription, because the backend doesn't allows to check them
            .filter((cycle) => !isCheckForbidden(subscription, newModel.planIDs, cycle));

        const additionalPayloads = additionalCycles.map(
            (Cycle) =>
                ({
                    ...checkPayload,
                    Cycle,
                }) as MultiCheckSubscriptionData
        );
        const additionalChecks = await paymentsApi.multiCheck(additionalPayloads, {
            signal,
            cached: true,
            silence: true,
        });

        setAdditionalCheckResults([...additionalChecks, checkResult]);
    };

    const shouldPassIsTrial = (newModel: Model, downgradeIsTrial: boolean) => {
        if (!isB2BTrial) {
            return false;
        }

        const oldSubscription = subscription?.UpcomingSubscription ?? subscription;

        if (!oldSubscription) {
            return false;
        }

        const newPlanIDs = newModel.planIDs;
        const oldPlanIDs = getPlanIDs(subscription);
        const newCycle = newModel.cycle;
        const oldCycle = oldSubscription.Cycle;

        return shouldPassIsTrialPayments({
            plansMap,
            newPlanIDs,
            oldPlanIDs,
            newCycle,
            oldCycle,
            downgradeIsTrial,
        });
    };

    const normalizeModelBeforeCheck = (newModel: Model) => {
        const planTransitionForbidden = getIsPlanTransitionForbidden({
            subscription,
            plansMap,
            planIDs: newModel.planIDs,
        });

        if (planTransitionForbidden?.type === 'lumo-plus') {
            newModel.planIDs = planTransitionForbidden.newPlanIDs;
            newModel.cycle = subscription?.Cycle ?? newModel.cycle;
        }

        if (planTransitionForbidden?.type === 'plus-to-plus') {
            setPlusToPlusUpsell({
                unlockPlan: planTransitionForbidden.newPlanName
                    ? plansMap[planTransitionForbidden.newPlanName]
                    : undefined,
            });
            setUpsellModal(true);
            // In case this transition is disallowed, reset the plan IDs to the plan IDs of the current subscription
            newModel.planIDs = getPlanIDs(latestSubscription);
            // Also, reset the step to the previous step (so that it doesn't change from plan selection -> checkout)
            newModel.step = model.step;
            // Continue here with the rest of the steps so that we actually perform the rest of the call correctly (but just with reset plan ids)
        }
    };

    const check = async (
        newModel: Model = model,
        wantToApplyNewGiftCode: boolean = false,
        selectedMethod?: PlainPaymentMethodType
    ): Promise<SubscriptionCheckResponse | undefined> => {
        const copyNewModel: Model = {
            ...newModel,
            initialCheckComplete: true,
            paymentForbidden: false,
            zipCodeValid: true,
        };

        if (!hasPlanIDs(copyNewModel.planIDs)) {
            setCheckResult(getFreeCheckResult(model.currency, model.cycle));
            setModel(copyNewModel);
            return;
        }

        normalizeModelBeforeCheck(copyNewModel);

        const dontQueryCheck = copyNewModel.step === SUBSCRIPTION_STEPS.PLAN_SELECTION;

        if (dontQueryCheck) {
            setCheckResult({
                ...getOptimisticCheckResult({
                    plansMap,
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

        if (isCheckForbidden(subscription, copyNewModel.planIDs, copyNewModel.cycle)) {
            setCheckResult({
                ...getOptimisticCheckResult({
                    plansMap,
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
                paymentForbidden: true,
            });
            return;
        }

        const run = async () => {
            try {
                abortControllerRef.current?.abort();
                abortControllerRef.current = new AbortController();

                const coupon = getAutoCoupon({
                    coupon: copyNewModel.coupon,
                    planIDs: copyNewModel.planIDs,
                    cycle: copyNewModel.cycle,
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

                // selectedMethod variable prevails over paymentFacade.selectedMethodType because it's passed in the
                // onMethod change handler. So this variable changes before the paymentFacade.selectedMethodType is
                // updated. We must take into account the case when user unselects SEPA, making selectedMethod not SEPA,
                // while paymentFacade.selectedMethodType is still SEPA. In this case we want to call /check without
                // ProrationMode == Exact.
                const currentlySelectedMethod = selectedMethod ?? paymentFacade.selectedMethodType;

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
                };

                const checkResult = await paymentsApi.checkWithAutomaticVersion(checkPayload, {
                    signal: abortControllerRef.current.signal,
                    silence: true,
                });

                try {
                    await runAdditionalChecks(
                        copyNewModel,
                        checkPayload,
                        checkResult,
                        abortControllerRef.current.signal
                    );
                } catch {}

                const { Gift = 0 } = checkResult;
                const { Code = '' } = checkResult.Coupon || {}; // Coupon can equal null

                if (wantToApplyNewGiftCode && copyNewModel.gift?.toLowerCase() !== Code.toLowerCase() && !Gift) {
                    createNotification({ text: c('Error').t`Invalid code`, type: 'error' });
                    giftCodeRef.current?.focus();
                }

                if (Code) {
                    latestValidCouponCodeRef.current = Code;
                }
                copyNewModel.coupon = Code || subscriptionCouponCode || latestValidCouponCodeRef.current;

                if (!Gift) {
                    delete copyNewModel.gift;
                }

                setCheckResult(checkResult);
                setModel(copyNewModel);
                onCheck?.({ model, newModel: copyNewModel, type: 'success', result: checkResult });
            } catch (error: any) {
                if (error?.name === 'AbortError') {
                    return;
                }

                if (error.name === 'OfflineError') {
                    setModel({ ...model, step: SUBSCRIPTION_STEPS.NETWORK_ERROR });
                }

                if (error instanceof InvalidZipCodeError) {
                    setModel({
                        ...model,
                        zipCodeValid: false,
                    });
                    // We don't want to report this as an error to the parent of SubscriptionContainer
                    return;
                }

                onCheck?.({ model, newModel: copyNewModel, type: 'error', error });
            }

            return checkResult;
        };

        const checkPromise = run();
        void withLoadingCheck(checkPromise);

        return checkPromise;
    };

    useEffect(() => {
        captureWrongPlanIDs(maybePlanIDs, { source: 'SubscriptionModal/PlanIDs' });
        captureWrongPlanName(plan, { source: 'SubscriptionModal/PlanName' });
    }, []);

    useEffect(() => {
        if (!model.initialCheckComplete) {
            return;
        }

        void metrics.payments_subscription_steps_total.increment(metricsProps);
    }, [model.step, model.initialCheckComplete]);

    useEffect(() => {
        if (!paymentFacade.initialized) {
            return;
        }

        setInitialLoading(false);

        // Trigger once to initialise the check values
        void check();
        if (parent === 'subscription-modal') {
            // Send telemetry event: initialization
            void reportSubscriptionModalInitialization({
                step: maybeStep,
                plan: plan,
                cycle: model.cycle,
                currency: model.currency,
                upsellRef,
                coupon: model.coupon,
            });
        }
    }, [paymentFacade.initialized]);

    useEffect(() => {
        // Each time the user switch between steps, scroll to the top
        if (customTopRef?.current) {
            customTopRef.current?.scrollIntoView?.();
        } else {
            topRef?.current?.scrollIntoView?.();
        }
    }, [model.step, customTopRef?.current, topRef?.current]);

    const process = async (processor?: PaymentProcessorHook) =>
        withSubscribing(async () => {
            if (!processor) {
                return;
            }

            try {
                paymentFacade.paymentContext.setSubscriptionData({
                    Plans: model.planIDs,
                    Codes: getCodesForSubscription(),
                    Cycle: model.cycle,
                    product: app,
                    taxBillingAddress: model.taxBillingAddress,
                    StartTrial: isTrial,
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    vatNumber: vatNumber.vatNumber,
                });
                await processor.processPaymentToken();
            } catch (e) {
                let tokenDidntHaveEmail = false;
                if (e instanceof DisplayablePaymentError) {
                    createNotification({ text: e.message, type: 'error' });
                    tokenDidntHaveEmail = true;
                }

                const error = getSentryError(e);
                if (error) {
                    const context = {
                        app,
                        step: model.step,
                        cycle: model.cycle,
                        currency: model.currency,
                        amount,
                        coupon: model.coupon,
                        planIDs,
                        audience,
                        processorType: paymentFacade.selectedProcessor?.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        paymentsVersion: getPaymentsVersion(),
                        chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
                        tokenDidntHaveEmail,
                    };
                    captureMessage('Payments: failed to handle subscription', {
                        level: 'error',
                        extra: { error, context },
                    });
                }
            }
        });

    const handleChangeCycle = (cycle: Cycle) => {
        if (loadingCheck || cycle === model.cycle) {
            return;
        }
        const checkPromise = check({ ...model, cycle });
        void withBlockAccountSizeSelector(checkPromise);
    };

    const handleGift = (gift = '') => {
        if (loadingCheck) {
            return;
        }
        if (!gift) {
            const withoutGift = { ...model };
            delete withoutGift.gift;
            return withLoadingGift(check(withoutGift));
        }
        if (getHas2024OfferCoupon(gift.trim().toUpperCase())) {
            createNotification({ text: c('Error').t`Invalid code`, type: 'error' });
            return;
        }
        void withLoadingGift(check({ ...model, gift }, true));
    };

    const handleChangeCurrency = (currency: Currency, context?: { paymentMethodType: PlainPaymentMethodType }) => {
        if (loadingCheck || currency === preferredCurrency) {
            return;
        }
        setPreferredCurrency(currency);

        const planCurrency = getPlanCurrencyFromPlanIDs(getPlansMap(plans, currency), model.planIDs) ?? currency;

        void check({ ...model, currency: planCurrency }, false, context?.paymentMethodType);
    };

    const handleBillingAddressChange = (billingAddress: BillingAddress) => {
        void check({ ...model, taxBillingAddress: billingAddress });
    };

    const taxCountry = useTaxCountry({
        onBillingAddressChange: handleBillingAddressChange,
        zipCodeBackendValid: model.zipCodeValid,
        paymentStatus,
        paymentFacade,
        previosValidZipCode: model.taxBillingAddress.ZipCode,
    });

    const vatNumber = useVatNumber({
        selectedPlanName,
        taxCountry,
    });

    const backStep = BACK[model.step];
    const isFreeUserWithFreePlanSelected = user.isFree && isFreePlanSelected;

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (model.paymentForbidden) {
            onCancel?.();
            return;
        }

        if (loadingCheck || loadingGift) {
            return;
        }

        void process(paymentFacade.selectedProcessor);
    };

    const TITLE = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: c('Title').t`Network error`,
        [SUBSCRIPTION_STEPS.PLAN_SELECTION]: c('Title').t`Select a plan`,
        [SUBSCRIPTION_STEPS.CHECKOUT]:
            checkResult?.AmountDue === 0 && shouldPassIsTrial(model, true)
                ? c('new_plans: title').t`Review subscription`
                : c('new_plans: title').t`Review subscription and pay`,
        [SUBSCRIPTION_STEPS.UPGRADE]: '',
        [SUBSCRIPTION_STEPS.THANKS]: '',
    };

    const modeType = mode ? mode : 'modal';
    const showFreePlan = modeType === 'upsell-modal' ? false : undefined;

    const hasPaymentMethod = !!paymentFacade.methods.savedMethods?.length;

    const subscriptionCheckoutSubmit = (
        <>
            <SubscriptionSubmitButton
                currency={model.currency}
                onDone={onSubscribed}
                step={model.step}
                loading={
                    subscribing ||
                    paymentFacade.bitcoinInhouse.bitcoinLoading ||
                    paymentFacade.bitcoinChargebee.bitcoinLoading
                }
                checkResult={checkResult}
                className="w-full"
                disabled={isFreeUserWithFreePlanSelected}
                paymentForbidden={model.paymentForbidden}
                subscription={subscription}
                hasPaymentMethod={hasPaymentMethod}
                taxCountry={taxCountry}
                paymentFacade={paymentFacade}
            />
            {paymentFacade.showInclusiveTax && (
                <InclusiveVatText
                    tax={checkResult?.Taxes?.[0]}
                    currency={selectedPlanCurrency}
                    className="text-sm color-weak text-center mt-1"
                />
            )}
        </>
    );

    const gift = !model.paymentForbidden && !couponConfig?.hidden && (
        <>
            {couponCode && (
                <div className="flex items-center mb-1">
                    <Icon name="gift" className="mr-2 mb-1" />
                    <Tooltip title={couponDescription}>
                        <code>{couponCode.toUpperCase()}</code>
                    </Tooltip>
                </div>
            )}
            {!getHas2024OfferCoupon(couponCode) && (
                <PaymentGiftCode
                    giftCodeRef={giftCodeRef}
                    key={
                        /* Reset the toggle state when a coupon code gets applied */
                        couponCode
                    }
                    giftCode={model.gift}
                    onApply={handleGift}
                    loading={loadingGift}
                />
            )}
        </>
    );

    const { currentPlan, hasPlanCustomizer } = getHasPlanCustomizer({ plansMap, planIDs: model.planIDs });

    const [optimisticPlanIDs, setOptimisticPlanIDs] = useState<PlanIDs | null>(null);
    const optimisticPlanIDsRef = useRef<any | undefined>();

    const handleChangePlanIDs = useHandler(
        (planIDs: PlanIDs, id: any) => {
            const newModel = { ...model, planIDs };
            setModel(newModel);
            const checkPromise = check(newModel);
            void withBlockCycleSelector(checkPromise);
            checkPromise.catch(noop).finally(() => {
                // Only if it's the latest call is it reset
                if (optimisticPlanIDsRef.current === id) {
                    setOptimisticPlanIDs(null);
                }
            });
        },
        { debounce: 300 }
    );

    const handleOptimisticPlanIDs = (planIDs: PlanIDs) => {
        const id = {};
        optimisticPlanIDsRef.current = id;
        setOptimisticPlanIDs(planIDs);
        handleChangePlanIDs(planIDs, id);
    };

    const content = (
        <>
            {!customTopRef && <div ref={topRef} />}
            {model.step === SUBSCRIPTION_STEPS.NETWORK_ERROR && <GenericError />}
            {model.step === SUBSCRIPTION_STEPS.PLAN_SELECTION && (
                <PlanSelection
                    app={app}
                    freePlan={freePlan}
                    loading={loadingCheck}
                    plans={plans}
                    currency={preferredCurrency}
                    vpnServers={vpnServers}
                    cycle={model.cycle}
                    maximumCycle={maximumCycle}
                    minimumCycle={minimumCycle}
                    planIDs={model.planIDs}
                    mode={modeType}
                    hasFreePlan={showFreePlan}
                    subscription={subscription}
                    onChangePlanIDs={(planIDs, cycle, currency) =>
                        check({
                            ...model,
                            planIDs,
                            cycle,
                            currency,
                            step: SUBSCRIPTION_STEPS.CHECKOUT,
                        })
                    }
                    onChangeCycle={handleChangeCycle}
                    onChangeCurrency={handleChangeCurrency}
                    onChangeAudience={setAudience}
                    audience={audience}
                    selectedProductPlans={selectedProductPlans}
                    onChangeSelectedProductPlans={setSelectedProductPlans}
                    organization={organization}
                    paymentStatus={paymentStatus}
                    paymentsApi={paymentsApi}
                    coupon={maybeCoupon ?? undefined}
                />
            )}

            {model.step === SUBSCRIPTION_STEPS.CHECKOUT && (
                <div className="subscriptionCheckout-top-container gap-4 lg:gap-6">
                    <div className="flex-1 w-full md:w-auto pt-6">
                        <div
                            className="mx-auto max-w-custom subscriptionCheckout-soptions"
                            style={{ '--max-w-custom': '37em' }}
                        >
                            {(() => {
                                if (isFreePlanSelected) {
                                    return null;
                                }

                                return (
                                    <>
                                        <h2 className="text-2xl text-bold mb-4">
                                            {couponConfig?.checkoutSubtitle
                                                ? couponConfig?.checkoutSubtitle()
                                                : c('Label').t`Subscription options`}
                                        </h2>
                                        {hasPlanCustomizer && currentPlan && (
                                            <ProtonPlanCustomizer
                                                scribeAddonEnabled={scribeEnabled.paymentsEnabled}
                                                lumoAddonEnabled={lumoAddonEnabled}
                                                loading={blockAccountSizeSelector}
                                                currency={model.currency}
                                                cycle={model.cycle}
                                                plansMap={plansMap}
                                                currentPlan={currentPlan}
                                                planIDs={optimisticPlanIDs ?? model.planIDs}
                                                onChangePlanIDs={handleOptimisticPlanIDs}
                                                latestSubscription={latestSubscription}
                                                allowedAddonTypes={allowedAddonTypes}
                                                className="subscription-container-plan-customizer"
                                            />
                                        )}
                                        <div className="mb-8">
                                            {disableCycleSelector ? (
                                                <SubscriptionCheckoutCycleItem
                                                    checkResult={checkResult}
                                                    plansMap={plansMap}
                                                    planIDs={model.planIDs}
                                                    loading={loadingCheck || initialLoading}
                                                    couponConfig={couponConfig}
                                                />
                                            ) : (
                                                <SubscriptionCycleSelector
                                                    mode="buttons"
                                                    plansMap={plansMap}
                                                    planIDs={model.planIDs}
                                                    cycle={model.cycle}
                                                    currency={model.currency}
                                                    onChangeCycle={handleChangeCycle}
                                                    faded={blockCycleSelector}
                                                    additionalCheckResults={additionalCheckResults}
                                                    loading={loadingCheck || initialLoading}
                                                    allowedCycles={computeAllowedCycles(model.planIDs)}
                                                />
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                            <h2 className="text-2xl text-bold mb-4">{c('Label').t`Payment details`}</h2>
                            <PaymentWrapper
                                {...paymentFacade}
                                noMaxWidth
                                hideFirstLabel={true}
                                hideSavedMethodsDetails={application === APPS.PROTONACCOUNTLITE}
                                onCurrencyChange={handleChangeCurrency}
                                taxCountry={taxCountry}
                                vatNumber={vatNumber}
                                subscription={subscription}
                                organization={organization}
                            />
                            <RenewalEnableNote subscription={subscription} {...checkoutModifiers} />
                        </div>
                    </div>
                    <div className="subscriptionCheckout-column bg-weak rounded">
                        <div
                            className="subscriptionCheckout-container sticky top-0"
                            data-testid="subscription-checkout"
                        >
                            <SubscriptionCheckout
                                freePlan={freePlan}
                                subscription={subscription}
                                plansMap={plansMap}
                                checkResult={checkResult}
                                vpnServers={vpnServers}
                                gift={gift}
                                submit={subscriptionCheckoutSubmit}
                                loading={loadingCheck || initialLoading}
                                currency={model.currency}
                                cycle={model.cycle}
                                planIDs={model.planIDs}
                                onChangeCurrency={handleChangeCurrency}
                                paymentFacade={paymentFacade}
                                paymentMethods={paymentFacade.methods}
                                showPlanDescription={audience !== Audience.B2B}
                                paymentNeeded={!model.paymentForbidden}
                                taxCountry={taxCountry}
                                user={user}
                                couponConfig={couponConfig}
                                trial={shouldPassIsTrial(model, false)}
                                {...checkoutModifiers}
                            />
                        </div>
                    </div>
                </div>
            )}

            {model.step === SUBSCRIPTION_STEPS.UPGRADE && (
                <PostSubscriptionModalLoadingContent title={c('Info').t`Registering your subscription…`} />
            )}
            {model.step === SUBSCRIPTION_STEPS.THANKS && (
                <SubscriptionThanks
                    planIDs={model.planIDs}
                    onClose={() => {
                        onSubscribed?.();
                    }}
                />
            )}
        </>
    );

    const footer = (() => {
        if (
            !model.initialCheckComplete ||
            (disablePlanSelection && backStep === SUBSCRIPTION_STEPS.PLAN_SELECTION) ||
            backStep === undefined
        ) {
            return undefined;
        }

        return (
            <Button
                onClick={() => {
                    setModel({ ...model, step: backStep });
                }}
            >{c('Action').t`Back`}</Button>
        );
    })();

    return (
        <>
            {renderUpsellModal && plusToPlusUpsell && (
                <PlusToPlusUpsell
                    {...upsellModal}
                    unlockPlan={plusToPlusUpsell.unlockPlan}
                    plansMap={plansMap}
                    onUpgrade={() => {
                        upsellModal.onClose();
                        check({
                            ...model,
                            planIDs: switchPlan({
                                subscription: latestSubscription,
                                newPlan: PLANS.BUNDLE,
                                organization,
                                plans,
                            }),
                            step: SUBSCRIPTION_STEPS.CHECKOUT,
                        }).catch(noop);
                    }}
                    onClose={() => {
                        upsellModal.onClose();
                    }}
                />
            )}
            {calendarDowngradeModal((props) => {
                return (
                    <CalendarDowngradeModal
                        isDowngrade={false}
                        {...props}
                        onConfirm={props.onResolve}
                        onClose={props.onReject}
                    />
                );
            })}
            {cancelSubscriptionModals}
            {render({
                onSubmit,
                title: TITLE[model.step],
                content,
                footer,
                step: model.step,
                planIDs: model.planIDs,
            })}
        </>
    );
};

const SubscriptionContainer = (props: SubscriptionContainerProps) => {
    return (
        <PaymentsContextProvider>
            <SubscriptionContainerInner {...props} />
        </PaymentsContextProvider>
    );
};

export default SubscriptionContainer;
