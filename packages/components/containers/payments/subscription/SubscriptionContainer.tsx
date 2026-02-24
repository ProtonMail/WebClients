import type { FormEvent, ReactNode, RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import isEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import PlusToPlusUpsell from '@proton/components/containers/payments/subscription/PlusToPlusUpsell';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useHandler } from '@proton/components/hooks/useHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useVPNServersCount from '@proton/components/hooks/useVPNServersCount';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import type { TelemetryPaymentFlow } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import {
    InvalidZipCodeError,
    TaxExemptionNotSupportedError,
} from '@proton/components/payments/react-extensions/errors';
import { useLoading } from '@proton/hooks';
import { IcGift } from '@proton/icons/icons/IcGift';
import metrics, { observeApiError } from '@proton/metrics';
import type { WebPaymentsSubscriptionStepsTotal } from '@proton/metrics/types/web_payments_subscription_steps_total_v1.schema';
import {
    type AddonGuard,
    Audience,
    type BillingAddress,
    type CheckSubscriptionData,
    type Currency,
    type Cycle,
    DisplayablePaymentError,
    type FreePlanDefault,
    type FreeSubscription,
    type FullPlansMap,
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
    type SubscriptionCheckForbiddenReason,
    type SubscriptionEstimation,
    SubscriptionMode,
    captureWrongPlanIDs,
    captureWrongPlanName,
    getBillingAddressFromPaymentStatus,
    getCheckoutModifiers,
    getFreeCheckResult,
    getHas2025OfferCoupon,
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
    hasPlanIDs,
    isFreeSubscription,
    isSubscriptionCheckForbidden,
    isSubscriptionCheckForbiddenWithReason,
    shouldPassIsTrial as shouldPassIsTrialPayments,
    switchPlan,
} from '@proton/payments';
import { getIsCustomCycle, getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { computeOptimisticSubscriptionMode } from '@proton/payments/core/optimisticSubscriptionMode';
import { InvalidChargebeeCardDataError } from '@proton/payments/core/payment-processors/chargebeeCardPayment';
import { getAutoCoupon } from '@proton/payments/core/subscription/helpers';
import type { SubscriptionModificationStepTelemetry } from '@proton/payments/telemetry/helpers';
import type { EstimationChangePayload } from '@proton/payments/telemetry/shared-checkout-telemetry';
import type { SubscriptionModificationChangeAudienceTelemetry } from '@proton/payments/telemetry/subscription-container';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { useSubscriptionModificationChangeStepTelemetry } from '@proton/payments/telemetry/useSubscriptionModificationChangeStepTelemetry';
import { PaymentsContextProvider, useTaxCountry, useVatNumber } from '@proton/payments/ui';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/plans';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Organization, RequireOnly, UserModel } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { usePaymentFacade } from '../../../../components/payments/client-extensions';
import { usePollEvents } from '../../../../components/payments/client-extensions/usePollEvents';
import type { Operations, OperationsSubscriptionData } from '../../../../components/payments/react-extensions';
import { usePaymentsApi } from '../../../../components/payments/react-extensions/usePaymentsApi';
import { useModalTwoPromise } from '../../../components/modalTwo/useModalTwo';
import GenericError from '../../error/GenericError';
import { changeDefaultPaymentMethodBeforePayment } from '../DefaultPaymentMethodMessage';
import PaymentGiftCode from '../PaymentGiftCode';
import PaymentWrapper from '../PaymentWrapper';
import { ProtonPlanCustomizer, forceAddonsMinMaxConstraints } from '../planCustomizer/ProtonPlanCustomizer';
import { getHasPlanCustomizer } from '../planCustomizer/helpers';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import PlanSelection from './PlanSelection';
import { RenewalEnableNote } from './RenewalEnableNote';
import { useVisionaryDowngradeWarningModal } from './VisionaryDowngradeWarningModal';
import { useCancelSubscriptionFlow } from './cancelSubscription/useCancelSubscriptionFlow';
import { SubscriptionConfirmButton } from './confirm-button/SubscriptionConfirmButton';
import { SUBSCRIPTION_STEPS } from './constants';
import { isCSCoupon } from './coupon-config/helpers';
import { getStaticCouponConfig, useCouponConfig } from './coupon-config/useCouponConfig';
import SubscriptionCheckoutCycleItem from './cycle-selector/SubscriptionCheckoutCycleItem';
import SubscriptionCycleSelector from './cycle-selector/SubscriptionCycleSelector';
import { type SelectedProductPlans, getDefaultSelectedProductPlans } from './helpers';
import { getAllowedCycles } from './helpers/getAllowedCycles';
import { getInitialCycle } from './helpers/getInitialCycle';
import { getInitialCheckoutStep } from './helpers/initialCheckoutStep';
import SubscriptionCheckout from './modal-components/SubscriptionCheckout';
import SubscriptionThanks from './modal-components/SubscriptionThanks';
import { canShowGiftCodeInput } from './modal-components/helpers/canShowGiftCodeInput';
import { showLumoAddonCustomizer } from './modal-components/helpers/showLumoAddonCustomizer';
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
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
    zipCodeValid: boolean;
}

const BACK: Partial<{ [key in SUBSCRIPTION_STEPS]: SUBSCRIPTION_STEPS }> = {
    [SUBSCRIPTION_STEPS.CHECKOUT]: SUBSCRIPTION_STEPS.PLAN_SELECTION,
};

const getCodes = ({ gift, coupon }: Pick<Model, 'gift' | 'coupon'>): string[] => [gift, coupon].filter(isTruthy);

/**
 * There is a problem with closures. If we use the regular useState for the preferred currency and then create
 *
 * `const plansMap = getPlansMap(plans, preferredCurrency);`
 *
 * then when currency changes we'll get the old plansMap and the optimisticCheckResult will be computed with the
 * old plansMap. That leads to situations when we have wrong price points for a given currency.
 *
 * Refs is a usual workaround to get the latest value of the variable, ignorring all the business with closures.
 *
 */
const usePlansMapRef = ({
    user,
    subscription,
    plans,
    maybeCurrency,
    paymentStatus,
    plan,
}: {
    user: UserModel;
    subscription: Subscription | FreeSubscription;
    plans: Plan[];
    maybeCurrency?: Currency;
    paymentStatus: PaymentStatus;
    plan?: PLANS;
}) => {
    const [, rerender] = useState({});

    const { getPreferredCurrency } = useCurrencies();

    const preferredCurrencyRef = useRef<Currency>(
        getPreferredCurrency({
            user,
            subscription,
            plans,
            paramCurrency: maybeCurrency,
            paymentStatus,
            paramPlanName: plan,
        })
    );

    const plansMapRef = useRef<FullPlansMap>(getPlansMap(plans, preferredCurrencyRef.current));

    return {
        plansMapRef,
        setPreferredCurrency: (currency: Currency) => {
            preferredCurrencyRef.current = currency;
            plansMapRef.current = getPlansMap(plans, currency);
            rerender({});
        },
        preferredCurrencyRef,
    };
};

interface RenderProps {
    title: string;
    content: ReactNode;
    footer?: ReactNode;
    onSubmit: (e: FormEvent) => void;
    step: SUBSCRIPTION_STEPS;
    planIDs: PlanIDs;
    model: Model;
    onModelUpdate: (updatedModel: Model) => void;
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
            | { model: Model; newModel: Model; type: 'success'; result: SubscriptionEstimation }
    ) => void;
    metrics: {
        source: Source;
    };
    telemetryFlow?: TelemetryPaymentFlow;
    render: (renderProps: RenderProps) => ReactNode;
    subscription: Subscription | FreeSubscription;
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
    showShortPlan?: boolean;
    // Skip plan transition check if they are handled externally
    skipPlanTransitionChecks?: boolean;
}

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
    showShortPlan,
    skipPlanTransitionChecks,
}: SubscriptionContainerProps) => {
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
    const eventManager = useEventManager();
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
    const [additionalCheckResults, setAdditionalCheckResults] = useState<SubscriptionEstimation[]>();
    const scribeEnabled = useAssistantFeatureEnabled();
    const [upsellModal, setUpsellModal, renderUpsellModal] = useModalState();
    const [plusToPlusUpsell, setPlusToPlusUpsell] = useState<{ unlockPlan: Plan | undefined } | null>(null);

    const {
        showVisionaryDowngradeWarning,
        hideVisionaryDowngradeWarning,
        visionaryDowngradeModal,
        renderVisionaryDowngradeWarningText,
    } = useVisionaryDowngradeWarningModal({ subscription });

    const { reportSubscriptionModalInitialization, reportSubscriptionModalPayment } = useSubscriptionModalTelemetry();

    const latestSubscription = subscription.UpcomingSubscription ?? subscription;

    const { plansMapRef, setPreferredCurrency, preferredCurrencyRef } = usePlansMapRef({
        user,
        subscription,
        plans,
        maybeCurrency,
        paymentStatus,
        plan,
    });

    const creditCardDetailsRef = useRef<HTMLDivElement>(null);

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

        const planIDs = maybePlanIDs || subscriptionPlanIDs;

        return (
            forceAddonsMinMaxConstraints({
                selectedPlanIDs: planIDs,
                plansMap: plansMapRef.current,
                currency: preferredCurrencyRef.current,
                subscription,
            }) ?? planIDs
        );
    }, [subscription, organization, plans, maybePlanIDs]);

    const [model, setModel] = useState<Model>(() => {
        const step = getInitialCheckoutStep(planIDs, maybeStep);

        const currency = getPlanCurrencyFromPlanIDs(plansMapRef.current, planIDs) ?? preferredCurrencyRef.current;

        const cycle = getInitialCycle({
            cycleParam: maybeCycle,
            subscription,
            planIDs,
            plansMap: plansMapRef.current,
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
            taxBillingAddress: getBillingAddressFromPaymentStatus(paymentStatus),
            paymentForbiddenReason: { forbidden: false },
            zipCodeValid: true,
        };

        return model;
    });

    const telemetryContext = 'subscription-modification' as const;

    const getCommonTelemetryPayload = (): {
        userCurrency: Currency;
        subscription: Subscription | FreeSubscription;
        selectedCycle: Cycle;
        selectedPlanIDs: PlanIDs;
        selectedCurrency: Currency;
        selectedCoupon: string | null | undefined;
        selectedStep: SubscriptionModificationStepTelemetry;
        build: APP_NAMES;
        product: ProductParam;
        context: typeof telemetryContext;
    } => {
        return {
            userCurrency: user.Currency,
            subscription,
            selectedCycle: model.cycle,
            selectedPlanIDs: model.planIDs,
            selectedCurrency: model.currency,
            selectedCoupon: model.coupon,
            selectedStep: model.step === SUBSCRIPTION_STEPS.PLAN_SELECTION ? 'plan_selection' : 'checkout',
            build: APP_NAME,
            product: app,
            context: telemetryContext,
        };
    };

    const [audience, setAudienceInner] = useState(() => {
        if ((plan && getIsB2BAudienceFromPlan(plan)) || getIsB2BAudienceFromSubscription(subscription)) {
            return Audience.B2B;
        }
        return defaultAudience;
    });

    const setAudience = (newAudience: Audience) => {
        const audienceTelemetry: SubscriptionModificationChangeAudienceTelemetry = (
            {
                [Audience.B2C]: 'b2c',
                [Audience.B2B]: 'b2b',
                [Audience.FAMILY]: 'family',
            } satisfies Record<Audience, SubscriptionModificationChangeAudienceTelemetry>
        )[newAudience];

        checkoutTelemetry.subscriptionContainer.reportAudienceChange({
            audience: audienceTelemetry,
            ...getCommonTelemetryPayload(),
        });
        setAudienceInner(newAudience);
    };

    const [checkResult, setCheckResult] = useState<SubscriptionEstimation>(
        getFreeCheckResult(model.currency, model.cycle)
    );

    const couponConfig = useCouponConfig({ checkResult, planIDs: model.planIDs, plansMap: plansMapRef.current });
    const lumoAddonEnabled = showLumoAddonCustomizer({
        subscription,
        couponConfig,
        initialCoupon: maybeCoupon,
        planIDs: model.planIDs,
        cycle: model.cycle,
    });

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
        { operationsSubscriptionData, paymentMethodValue, paymentProcessorType }: SubscriptionContext
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
            eventManager.stop();
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
            await eventManager.call();

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
        } finally {
            eventManager.start();
        }
    };

    type SubscriptionContext = {
        operationsSubscriptionData: OperationsSubscriptionData;
        paymentProcessorType: PaymentProcessorType;
        paymentMethodValue: PaymentMethodType;
        paymentMethodType: PlainPaymentMethodType;
    };

    const selectedPlanCurrency = checkResult.Currency;
    const selectedPlanName = getPlanFromPlanIDs(plansMapRef.current, model.planIDs)?.Name;

    const paymentFacade = usePaymentFacade({
        checkResult,
        amount,
        currency: selectedPlanCurrency,
        selectedPlanName,
        billingAddress: model.taxBillingAddress,
        paymentStatus,
        onChargeable: (operations, { paymentProcessorType, source, sourceType }) => {
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
                paymentMethodType: sourceType,
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
        product: app,
        telemetryContext,
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
            plansMap: plansMapRef.current,
            allowDowncycling: true,
            cycleParam: maybeCycle,
            app,
            couponConfig,
        });

    /**
     * Runs subscriptionCheck for all allowed cycles, if coupon is present. That allows to display the discount for
     * all cycles at once, so it's easier for the user to compare the prices and decide what cycle is the best for them.
     */
    const runAdditionalChecks = async (
        newModel: Model,
        checkPayload: CheckSubscriptionData,
        checkResult: SubscriptionEstimation,
        signal: AbortSignal
    ) => {
        setAdditionalCheckResults([]);

        const allAllowedCycles = computeAllowedCycles(newModel.planIDs);

        const additionalCycles = allAllowedCycles
            // skip the cycle that was just checked
            .filter((cycle) => cycle !== checkResult.Cycle)

            // skip cycles of the currently active subscription, because the backend doesn't allows to check them
            .filter((cycle) => !isSubscriptionCheckForbidden(subscription, newModel.planIDs, cycle));

        const additionalCyclesHaveCustomBilling = additionalCycles.some((cycle) => {
            const optimisticSubscriptionMode = computeOptimisticSubscriptionMode(
                {
                    planIDs: checkPayload.Plans,
                    cycle,
                    currency: checkPayload.Currency,
                    plansMap: plansMapRef.current,
                },
                subscription
            );

            return optimisticSubscriptionMode === SubscriptionMode.CustomBillings;
        });

        const currentCycleHasCustomBilling = checkResult.SubscriptionMode === SubscriptionMode.CustomBillings;

        const hasForbiddenCheck = allAllowedCycles.some((cycle) =>
            isSubscriptionCheckForbidden(subscription, newModel.planIDs, cycle)
        );

        const additionalPayloads = additionalCycles.map((Cycle) => {
            const autoCoupon = getAutoCoupon({
                planIDs: newModel.planIDs,
                cycle: Cycle,
                currency: newModel.currency,
            });

            const uniqueCodes = [...new Set([...(checkPayload.Codes ?? []), autoCoupon].filter(isTruthy))];

            const payload: CheckSubscriptionData = {
                ...checkPayload,
                Cycle,
                Codes: uniqueCodes,
            };

            return payload;
        });

        const noCoupons = additionalPayloads.every((payload) => !payload.Codes || payload.Codes.length === 0);

        // In case if we have Custom Billing for the main check, then for other cycles the subscription mode will be
        // different (most likely, regular proration). Mix of custom billings and proration with coupons is practically
        // guranteed to cause incosistent UI, so it's better to just skip the additional checks.
        //
        // Additionally, if the current set of cycles has forbidden checks then it means that the user already has a
        // subscription and they just opened the subscription modification view but didn't make any changes in the
        // number of addons yet. When they add an addon, then custom billing will show up, and the UI might get
        // incosistent again. For that reason we are avoiding additional checks in this case, and simply display the
        // full pricing.
        //
        // And of course if don't have any coupon codes, we don't need to run additional checks.
        if (currentCycleHasCustomBilling || additionalCyclesHaveCustomBilling || hasForbiddenCheck || noCoupons) {
            return;
        }

        paymentsApi.cacheMultiCheck(checkPayload, checkResult);

        const additionalChecks = await paymentsApi.multiCheck(additionalPayloads, {
            signal,
            cached: true,
            silence: true,
            optimisticFallback: true,
            plansMap: plansMapRef.current,
        });

        setAdditionalCheckResults([...additionalChecks, checkResult]);
    };

    const shouldPassIsTrial = (newModel: Model, downgradeIsTrial: boolean) => {
        const newPlanIDs = newModel.planIDs;
        const newCycle = newModel.cycle;

        return shouldPassIsTrialPayments({
            plansMap: plansMapRef.current,
            newPlanIDs,
            newCycle,
            downgradeIsTrial,
            subscription,
            organization,
        });
    };

    const switchCycle = (preferredCycle: Cycle, selectedPlanIDs: PlanIDs, currency: Currency) => {
        const allowedCycles = getAllowedCycles({
            subscription,
            planIDs: selectedPlanIDs,
            plansMap: plansMapRef.current,
            currency,
        });

        return allowedCycles.includes(preferredCycle) ? preferredCycle : allowedCycles[0];
    };

    const normalizeModelBeforeCheck = async (newModel: Model) => {
        if (!skipPlanTransitionChecks) {
            const planTransitionForbidden = getIsPlanTransitionForbidden({
                subscription,
                plansMap: plansMapRef.current,
                planIDs: newModel.planIDs,
            });
            if (planTransitionForbidden?.type === 'lumo-plus') {
                newModel.planIDs = planTransitionForbidden.newPlanIDs;
                // since we are switching the plan, it's the same as switching the cycle manually, so we need to make sure
                // that the cycle is allowed
                newModel.cycle = switchCycle(
                    subscription?.Cycle ?? newModel.cycle,
                    newModel.planIDs,
                    newModel.currency
                );
            }

            if (planTransitionForbidden?.type === 'plus-to-plus') {
                setPlusToPlusUpsell({
                    unlockPlan: planTransitionForbidden.newPlanName
                        ? plansMapRef.current[planTransitionForbidden.newPlanName]
                        : undefined,
                });
                setUpsellModal(true);
                // In case this transition is disallowed, reset the plan IDs to the plan IDs of the current subscription
                newModel.planIDs = getPlanIDs(latestSubscription);

                // since we are switching the plan, it's the same as switching the cycle manually, so we need to make sure
                // that the cycle is allowed
                newModel.cycle = switchCycle(newModel.cycle, newModel.planIDs, newModel.currency);

                // Also, reset the step to the previous step (so that it doesn't change from plan selection -> checkout)
                newModel.step = model.step;
                // Continue here with the rest of the steps so that we actually perform the rest of the call correctly (but just with reset plan ids)
            }

            if (planTransitionForbidden?.type === 'visionary-downgrade') {
                try {
                    // Throws an error in case if user rejects the change
                    await showVisionaryDowngradeWarning();
                } catch {
                    onCancel?.();
                    return;
                }
            } else {
                hideVisionaryDowngradeWarning();
            }
        }
        newModel.planIDs =
            forceAddonsMinMaxConstraints({
                selectedPlanIDs: newModel.planIDs,
                plansMap: plansMapRef.current,
                currency: newModel.currency,
                subscription,
            }) ?? newModel.planIDs;
    };

    const reportChangeTelemetry = ({ action, ...overrides }: RequireOnly<EstimationChangePayload, 'action'>) => {
        const nonEmptyOverrides = Object.fromEntries(
            Object.entries(overrides).filter(([_, value]) => value !== undefined)
        );
        const payload: EstimationChangePayload = {
            action,
            ...getCommonTelemetryPayload(),
            paymentMethodType: paymentFacade.selectedMethodType,
            paymentMethodValue: paymentFacade.selectedMethodValue,
            ...nonEmptyOverrides,
        };

        checkoutTelemetry.reportSubscriptionEstimationChange(payload);
    };

    const reportPlanIDsIfChanged = (newlySelectedPlanIDs: PlanIDs) => {
        const currentlySelectedPlanIDs = model.planIDs;
        if (isEqual(newlySelectedPlanIDs, currentlySelectedPlanIDs)) {
            return;
        }

        const currentlySelectedPlanName = getPlanNameFromIDs(currentlySelectedPlanIDs);
        const newlySelectedPlanName = getPlanNameFromIDs(newlySelectedPlanIDs);
        const action = currentlySelectedPlanName === newlySelectedPlanName ? 'addon_changed' : 'plan_changed';
        reportChangeTelemetry({ action, selectedPlanIDs: newlySelectedPlanIDs });
    };

    const check = async (
        newModel: Model = model,
        wantToApplyNewGiftCode: boolean = false,
        selectedMethod?: PlainPaymentMethodType
    ): Promise<SubscriptionEstimation | undefined> => {
        const copyNewModel: Model = {
            ...newModel,
            initialCheckComplete: true,
            paymentForbiddenReason: { forbidden: false },
            zipCodeValid: true,
        };

        if (!hasPlanIDs(copyNewModel.planIDs)) {
            setCheckResult(getFreeCheckResult(model.currency, model.cycle));
            setModel(copyNewModel);
            return;
        }

        await normalizeModelBeforeCheck(copyNewModel);
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

        const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(
            subscription,
            copyNewModel.planIDs,
            copyNewModel.cycle
        );
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

        const run = async () => {
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
                    ValidateZipCode: true,
                };

                const checkResult = await paymentsApi.checkSubscription(checkPayload, {
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

                if (error instanceof TaxExemptionNotSupportedError) {
                    createNotification({ text: error.message, type: 'error' });
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

        checkoutTelemetry.reportInitialization(getCommonTelemetryPayload());
    }, []);

    useSubscriptionModificationChangeStepTelemetry({
        step: (() => {
            switch (model.step) {
                case SUBSCRIPTION_STEPS.PLAN_SELECTION:
                    return 'plan_selection';
                case SUBSCRIPTION_STEPS.CHECKOUT:
                    return 'checkout';
                default:
                    return null;
            }
        })(),
        app,
    });

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
                } else if (e instanceof InvalidChargebeeCardDataError) {
                    creditCardDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

        reportChangeTelemetry({ action: 'cycle_changed', selectedCycle: cycle });

        const checkPromise = check({ ...model, cycle });
        void withBlockAccountSizeSelector(checkPromise);
    };

    const handleGift = (gift = '') => {
        if (loadingCheck) {
            return;
        }

        reportChangeTelemetry({ action: 'coupon_changed', selectedCoupon: gift });

        if (!gift) {
            const withoutGift = { ...model };
            delete withoutGift.gift;
            return withLoadingGift(check(withoutGift));
        }

        const uppercaseCoupon = gift.trim().toUpperCase();
        const staticCouponConfig = getStaticCouponConfig(uppercaseCoupon);
        if (
            (getHas2025OfferCoupon(uppercaseCoupon) && !isCSCoupon(uppercaseCoupon)) ||
            staticCouponConfig?.blockManualEntryOfCoupon
        ) {
            createNotification({ text: c('Error').t`Invalid code`, type: 'error' });
            return;
        }
        void withLoadingGift(check({ ...model, gift }, true));
    };

    const handleChangeCurrency = (currency: Currency, context?: { paymentMethodType: PlainPaymentMethodType }) => {
        if (loadingCheck || currency === preferredCurrencyRef.current) {
            return;
        }
        setPreferredCurrency(currency);

        const planCurrency = getPlanCurrencyFromPlanIDs(getPlansMap(plans, currency), model.planIDs) ?? currency;

        reportChangeTelemetry({ action: 'currency_changed', selectedCurrency: currency });

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
        previousValidZipCode: model.taxBillingAddress.ZipCode,
        telemetryContext,
        paymentsApi,
    });

    const vatNumber = useVatNumber({
        selectedPlanName,
        taxCountry,
        onVatUpdated: () => check(),
    });

    const backStep = BACK[model.step];
    const isFreeUserWithFreePlanSelected = user.isFree && isFreePlanSelected;

    const onSubmit = (e?: FormEvent) => {
        e?.preventDefault();

        if (model.paymentForbiddenReason.forbidden) {
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
        <SubscriptionConfirmButton
            currency={model.currency}
            onDone={onSubscribed}
            loading={
                subscribing ||
                paymentFacade.bitcoinInhouse.bitcoinLoading ||
                paymentFacade.bitcoinChargebee.bitcoinLoading
            }
            checkResult={checkResult}
            className="w-full"
            disabled={isFreeUserWithFreePlanSelected}
            paymentForbiddenReason={model.paymentForbiddenReason}
            subscription={subscription}
            hasPaymentMethod={hasPaymentMethod}
            taxCountry={taxCountry}
            paymentFacade={paymentFacade}
            couponConfig={couponConfig}
            showVisionaryWarning={renderVisionaryDowngradeWarningText}
            onSubmit={onSubmit}
            app={app}
        />
    );

    const gift = canShowGiftCodeInput({
        paymentForbiddenReason: model.paymentForbiddenReason,
        couponConfig,
        checkResult,
    }) ? (
        <>
            {couponCode && (
                <div className="flex items-center mb-1">
                    <IcGift className="mr-2 mb-1" />
                    <Tooltip title={couponDescription}>
                        <code>{couponCode.toUpperCase()}</code>
                    </Tooltip>
                </div>
            )}
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
        </>
    ) : null;

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
                    currency={preferredCurrencyRef.current}
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
                    showShortPlan={showShortPlan}
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
                                        {getHasPlanCustomizer(model.planIDs) && (
                                            <ProtonPlanCustomizer
                                                scribeAddonEnabled={scribeEnabled.paymentsEnabled}
                                                lumoAddonEnabled={lumoAddonEnabled}
                                                loading={blockAccountSizeSelector}
                                                currency={model.currency}
                                                cycle={model.cycle}
                                                plansMap={plansMapRef.current}
                                                selectedPlanIDs={optimisticPlanIDs ?? model.planIDs}
                                                onChangePlanIDs={handleOptimisticPlanIDs}
                                                latestSubscription={latestSubscription}
                                                allowedAddonTypes={allowedAddonTypes}
                                                className="subscription-container-plan-customizer"
                                                telemetryContext={telemetryContext}
                                            />
                                        )}
                                        <div className="mb-8">
                                            {disableCycleSelector ? (
                                                <SubscriptionCheckoutCycleItem
                                                    checkResult={checkResult}
                                                    plansMap={plansMapRef.current}
                                                    planIDs={model.planIDs}
                                                    loading={loadingCheck || initialLoading}
                                                    couponConfig={couponConfig}
                                                />
                                            ) : (
                                                <SubscriptionCycleSelector
                                                    mode="buttons"
                                                    plansMap={plansMapRef.current}
                                                    planIDs={model.planIDs}
                                                    cycle={model.cycle}
                                                    currency={model.currency}
                                                    onChangeCycle={handleChangeCycle}
                                                    faded={blockCycleSelector}
                                                    additionalCheckResults={additionalCheckResults}
                                                    loading={loadingCheck || initialLoading}
                                                    allowedCycles={computeAllowedCycles(model.planIDs)}
                                                    checkResult={checkResult}
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
                                showTaxCountry={paymentFacade.showTaxCountry && !model.paymentForbiddenReason.forbidden}
                                creditCardDetailsRef={creditCardDetailsRef}
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
                                plansMap={plansMapRef.current}
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
                                paymentForbiddenReason={model.paymentForbiddenReason}
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
                    plansMap={plansMapRef.current}
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
            {visionaryDowngradeModal}
            {calendarDowngradeModal(({ onResolve, onReject, ...modalProps }) => {
                return (
                    <CalendarDowngradeModal
                        {...modalProps}
                        isDowngrade={false}
                        onConfirm={onResolve}
                        onClose={onReject}
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
                model,
                onModelUpdate: (updatedModel: Model) => setModel(updatedModel),
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
