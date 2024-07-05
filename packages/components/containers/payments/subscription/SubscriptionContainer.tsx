import { FormEvent, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useAssistantFeatureEnabled from '@proton/components/containers/llm/useAssistantFeatureEnabled';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { WebPaymentsSubscriptionStepsTotal } from '@proton/metrics/types/web_payments_subscription_steps_total_v1.schema';
import { getPaymentsVersion } from '@proton/shared/lib/api/payments';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { getShouldCalendarPreventSubscripitionChange, willHavePaidMail } from '@proton/shared/lib/calendar/plans';
import {
    APPS,
    COUPON_CODES,
    CYCLE,
    DEFAULT_CURRENCY,
    DEFAULT_CYCLE,
    PLANS,
    PLAN_TYPES,
    isFreeSubscription,
} from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getIsCustomCycle, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import {
    AddonGuard,
    getPlanFromPlanIDs,
    hasPlanIDs,
    hasScribeAddon,
    switchPlan,
} from '@proton/shared/lib/helpers/planIDs';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import {
    getHas2023OfferCoupon,
    getHasSomeVpnPlan,
    getIsB2BAudienceFromPlan,
    getIsB2BAudienceFromSubscription,
    getIsVpnPlan,
    getNormalCycleFromCustomCycle,
    getPlanIDs,
    getPlanNameFromIDs,
    hasVisionary,
} from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
    ChargebeeEnabled,
    Currency,
    Cycle,
    FreePlanDefault,
    Organization,
    Plan,
    PlanIDs,
    PriceType,
    SubscriptionCheckResponse,
    SubscriptionModel,
} from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { usePaymentFacade } from '../../../../components/payments/client-extensions';
import { useChargebeeContext } from '../../../../components/payments/client-extensions/useChargebeeContext';
import { usePollEvents } from '../../../../components/payments/client-extensions/usePollEvents';
import {
    BillingAddress,
    CheckWithAutomaticOptions,
    PAYMENT_METHOD_TYPES,
    isOnSessionMigration,
} from '../../../../components/payments/core';
import { Operations, OperationsSubscriptionData } from '../../../../components/payments/react-extensions';
import { PaymentProcessorHook, PaymentProcessorType } from '../../../../components/payments/react-extensions/interface';
import { usePaymentsApi } from '../../../../components/payments/react-extensions/usePaymentsApi';
import { Icon, Tooltip } from '../../../components';
import { useModalTwoPromise } from '../../../components/modalTwo/useModalTwo';
import {
    useApi,
    useConfig,
    useEventManager,
    useGetCalendars,
    useHandler,
    useNotifications,
    useUser,
    useVPNServersCount,
} from '../../../hooks';
import GenericError from '../../error/GenericError';
import { isSubscriptionUnchanged } from '../../payments/helper';
import InclusiveVatText from '../InclusiveVatText';
import PaymentGiftCode from '../PaymentGiftCode';
import PaymentWrapper from '../PaymentWrapper';
import { DEFAULT_TAX_BILLING_ADDRESS } from '../TaxCountrySelector';
import { ProtonPlanCustomizer } from '../planCustomizer/ProtonPlanCustomizer';
import { getHasPlanCustomizer } from '../planCustomizer/helpers';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import { NoPaymentRequiredNote } from './NoPaymentRequiredNote';
import { VisionaryWarningModal, VisionaryWarningModalOwnProps } from './PlanLossWarningModal';
import PlanSelection from './PlanSelection';
import { RenewalEnableNote } from './RenewalEnableNote';
import SubscriptionCycleSelector, { SubscriptionCheckoutCycleItem } from './SubscriptionCycleSelector';
import SubscriptionSubmitButton from './SubscriptionSubmitButton';
import { useCancelSubscriptionFlow } from './cancelSubscription';
import { SUBSCRIPTION_STEPS } from './constants';
import {
    SelectedProductPlans,
    exclude24Months,
    getAutoCoupon,
    getCurrency,
    getDefaultSelectedProductPlans,
} from './helpers';
import { getInitialCheckoutStep } from './helpers/initialCheckoutStep';
import SubscriptionCheckout from './modal-components/SubscriptionCheckout';
import SubscriptionThanks from './modal-components/SubscriptionThanks';
import { useCheckoutModifiers } from './useCheckoutModifiers';
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
    coupon?: string | null;
    gift?: string;
    initialCheckComplete: boolean;
    taxBillingAddress: BillingAddress;
    noPaymentNeeded: boolean;
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
    render: (renderProps: RenderProps) => ReactNode;
    subscription: SubscriptionModel;
    organization: Organization;
    plans: Plan[];
    freePlan: FreePlanDefault;
    mode?: 'upsell-modal';
    upsellRef?: string;
    parent?: string;
    withB2CAddons?: boolean;
    /**
     * If none specified, then shows all addons
     */
    allowedAddonTypes?: AddonGuard[];
}

// that's temporary solution to avoid merge conflicts with Mail B2B plans.
// Proper solution should be done by changing getAllowedCycles() in SubscriptionCycleSelector
function capCycle(showB2CAddons: boolean, cycle: CYCLE): CYCLE;
function capCycle(showB2CAddons: boolean, cycle: CYCLE | undefined): CYCLE | undefined;
function capCycle(showB2CAddons: boolean, cycle?: CYCLE): CYCLE | undefined {
    return showB2CAddons ? Math.min(cycle ?? Number.POSITIVE_INFINITY, CYCLE.YEARLY) : cycle;
}

const SubscriptionContainer = ({
    topRef: customTopRef,
    upsellRef,
    app,
    step: maybeStep,
    cycle: maybeCycle,
    minimumCycle,
    maximumCycle,
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
    render,
    subscription,
    organization,
    plans,
    freePlan,
    mode,
    parent,
    withB2CAddons,
    allowedAddonTypes,
}: SubscriptionContainerProps) => {
    const TITLE = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: c('Title').t`Network error`,
        [SUBSCRIPTION_STEPS.PLAN_SELECTION]: c('Title').t`Select a plan`,
        [SUBSCRIPTION_STEPS.CHECKOUT]: c('new_plans: title').t`Review subscription and pay`,
        [SUBSCRIPTION_STEPS.UPGRADE]: '',
        [SUBSCRIPTION_STEPS.THANKS]: '',
    };

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
    const { call } = useEventManager();
    const pollEventsMultipleTimes = usePollEvents();
    const [visionaryWarningModal, showVisionaryWarningModal] = useModalTwoPromise<VisionaryWarningModalOwnProps>();
    const [calendarDowngradeModal, showCalendarDowngradeModal] = useModalTwoPromise();
    const { createNotification } = useNotifications();
    const plansMap = toMap(plans, 'Name');
    const { cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({ app });
    const [vpnServers] = useVPNServersCount();
    const getCalendars = useGetCalendars();
    const { APP_NAME } = useConfig();

    const [loading, withLoading] = useLoading();
    const [loadingCheck, withLoadingCheck] = useLoading();
    const [blockCycleSelector, withBlockCycleSelector] = useLoading();
    const [blockAccountSizeSelector, withBlockAccountSizeSelector] = useLoading();
    const [loadingGift, withLoadingGift] = useLoading();
    const [checkResult, setCheckResult] = useState<SubscriptionCheckResponse>();
    const chargebeeContext = useChargebeeContext();
    const scribeEnabled = useAssistantFeatureEnabled();

    const [audience, setAudience] = useState(() => {
        if ((plan && getIsB2BAudienceFromPlan(plan)) || getIsB2BAudienceFromSubscription(subscription)) {
            return Audience.B2B;
        }
        return defaultAudience;
    });

    const { reportSubscriptionModalInitialization, reportSubscriptionModalPayment } = useSubscriptionModalTelemetry();

    const latestSubscription = subscription.UpcomingSubscription ?? subscription;

    const planIDs = useMemo(() => {
        const subscriptionPlanIDs = getPlanIDs(latestSubscription);

        if (plan) {
            return switchPlan({
                planIDs: subscriptionPlanIDs,
                planID: plansMap[plan].Name,
                organization,
                plans,
            });
        }

        return maybePlanIDs || subscriptionPlanIDs;
    }, [subscription, plansMap, organization, plans, maybePlanIDs]);

    const coupon = maybeCoupon || subscription.CouponCode || undefined;

    const showB2CAddons = withB2CAddons || hasScribeAddon(subscription);

    const [model, setModel] = useState<Model>(() => {
        const step = getInitialCheckoutStep(planIDs, maybeStep);

        let cycle = (() => {
            if (step === SUBSCRIPTION_STEPS.PLAN_SELECTION) {
                if (app === APPS.PROTONPASS) {
                    return CYCLE.YEARLY;
                }
                if (maybeCycle) {
                    return maybeCycle;
                }
                return CYCLE.TWO_YEARS;
            }

            if (maybeCycle) {
                return maybeCycle;
            }

            if (isFreeSubscription(subscription)) {
                return DEFAULT_CYCLE;
            }

            /**
             * Users that are on the 15 or 30-month cycle should not default to that,
             * e.g. when clicking "explore other plans".
             * The condition also includes the cycle of upcoming subscription. The upcoming cycle must be
             * longer than the current cycle, according to the backend logic. That's why it takes precedence and the
             * frontend also considers it to be longer.
             * */
            const cycle =
                getNormalCycleFromCustomCycle(subscription.UpcomingSubscription?.Cycle) ??
                getNormalCycleFromCustomCycle(subscription?.Cycle) ??
                DEFAULT_CYCLE;

            return cycle;
        })();

        cycle = Math.max(
            capCycle(showB2CAddons, cycle),
            subscription?.Cycle ?? Number.NEGATIVE_INFINITY,
            subscription?.UpcomingSubscription?.Cycle ?? Number.NEGATIVE_INFINITY
        );

        const currency = (() => {
            if (maybeCurrency) {
                return maybeCurrency;
            }

            return getCurrency(user, subscription, plans);
        })();

        const model: Model = {
            step,
            cycle,
            currency,
            coupon,
            planIDs,
            initialCheckComplete: false,
            taxBillingAddress: DEFAULT_TAX_BILLING_ADDRESS,
            noPaymentNeeded: false,
        };

        return model;
    });

    const [selectedProductPlans, setSelectedProductPlans] = useState(
        defaultSelectedProductPlans ||
            getDefaultSelectedProductPlans({
                appName: app,
                planIDs,
                plansMap,
                cycle: subscription?.Cycle,
            })
    );

    const defaultCycles = exclude24Months(model.planIDs, subscription, [
        PLANS.VPN_PRO,
        PLANS.VPN_BUSINESS,
        PLANS.PASS_PRO,
        PLANS.PASS_BUSINESS,
        PLANS.MAIL_PRO,
        PLANS.MAIL_BUSINESS,
        PLANS.BUNDLE_PRO,
        PLANS.BUNDLE_PRO_2024,
    ]);

    const isVpnB2bPlan = !!model.planIDs[PLANS.VPN_PRO] || !!model.planIDs[PLANS.VPN_BUSINESS];

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

    const checkoutModifiers = useCheckoutModifiers(model, subscription, plansMap, checkResult);

    const amountDue = checkResult?.AmountDue || 0;
    const couponCode = checkResult?.Coupon?.Code;
    const couponDescription = checkResult?.Coupon?.Description;
    const creditsRemaining = (user.Credit + (checkResult?.Credit ?? 0)) / 100;

    const subscriptionCouponCode = subscription?.CouponCode;
    const latestValidCouponCodeRef = useRef('');

    const giftCodeRef = useRef<HTMLInputElement>(null);

    const abortControllerRef = useRef<AbortController>();

    const amount = model.step === SUBSCRIPTION_STEPS.CHECKOUT ? amountDue : 0;

    const currency = checkResult?.Currency || DEFAULT_CURRENCY;

    const handlePlanWarnings = async (planIDs: PlanIDs) => {
        const newPlanName = Object.keys(planIDs).find((planName) =>
            plans.find((plan) => plan.Type === PLAN_TYPES.PLAN && plan.Name === planName)
        );
        if (hasVisionary(subscription) && PLANS.VISIONARY !== newPlanName) {
            await showVisionaryWarningModal({ type: !newPlanName ? 'downgrade' : 'switch' });
        }
    };

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

    const handleSubscribe = async (
        operations: Operations,
        { operationsSubscriptionData, paymentProcessorType }: SubscriptionContext
    ) => {
        if (!hasPlanIDs(operationsSubscriptionData.Plans)) {
            const result = await cancelSubscription();
            if (result?.status === 'kept') {
                return;
            }
            onUnsubscribed?.();
            return;
        }

        try {
            await handlePlanWarnings(operationsSubscriptionData.Plans);
        } catch (e) {
            return;
        }

        const shouldCalendarPreventSubscriptionChangePromise = getShouldCalendarPreventSubscripitionChange({
            hasPaidMail: hasPaidMail(user),
            willHavePaidMail: willHavePaidMail(operationsSubscriptionData.Plans, plans),
            api,
            getCalendars,
        });

        if (await shouldCalendarPreventSubscriptionChangePromise) {
            return showCalendarDowngradeModal();
        }

        // When user has an error during checkout, we need to return him to the exact same step
        const checkoutStep = model.step;
        try {
            setModel((model) => ({ ...model, step: SUBSCRIPTION_STEPS.UPGRADE }));
            try {
                await operations.subscribe({
                    Codes: getCodesForSubscription(),
                    Plans: model.planIDs,
                    Cycle: model.cycle,
                    product: app,
                    taxBillingAddress: model.taxBillingAddress,
                });

                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                paymentFacade.telemetry.reportPaymentSuccess(paymentProcessorType);
                if (parent === 'subscription-modal') {
                    void reportSubscriptionModalPayment({
                        cycle: model.cycle,
                        currency: model.currency,
                        plan: getPlanNameFromIDs(model.planIDs) || 'n/a',
                    });
                }
            } catch (error) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                paymentFacade.telemetry.reportPaymentFailure(paymentProcessorType);
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
    };

    const paymentFacade = usePaymentFacade({
        checkResult,
        amount,
        currency,
        selectedPlanName: getPlanFromPlanIDs(plansMap, model.planIDs)?.Name,
        billingAddress: model.taxBillingAddress,
        billingPlatform: subscription?.BillingPlatform,
        chargebeeUserExists: user.ChargebeeUserExists,
        onChargeable: (operations, { sourceType, paymentProcessorType }) => {
            const context: SubscriptionContext = {
                operationsSubscriptionData: {
                    Plans: model.planIDs,
                    Cycle: model.cycle,
                    product: app,
                    Codes: getCodesForSubscription(),
                    taxBillingAddress: model.taxBillingAddress,
                },
                paymentProcessorType,
            };

            const promise = withLoading(handleSubscribe(operations, context));
            if (
                sourceType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD ||
                sourceType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
            ) {
                promise.then(() => pollEventsMultipleTimes()).catch(noop);
            }

            return promise.catch(noop);
        },
        flow: 'subscription',
        user,
    });

    const check = async (
        newModel: Model = model,
        wantToApplyNewGiftCode: boolean = false,
        selectedMethod?: string
    ): Promise<boolean> => {
        const copyNewModel = {
            ...newModel,
            initialCheckComplete: true,
            noPaymentNeeded: false,
        };

        if (!hasPlanIDs(newModel.planIDs)) {
            setCheckResult(getFreeCheckResult(model.currency, model.cycle));
            setModel(copyNewModel);
            return true;
        }

        const dontQueryCheck = copyNewModel.step === SUBSCRIPTION_STEPS.PLAN_SELECTION;

        if (dontQueryCheck) {
            setCheckResult({
                ...getOptimisticCheckResult({
                    plansMap,
                    cycle: copyNewModel.cycle,
                    planIDs: copyNewModel.planIDs,
                }),
                Currency: copyNewModel.currency,
                PeriodEnd: 0,
            });
            setModel(copyNewModel);
            return true;
        }

        const isInhouseForcedUser =
            chargebeeContext.enableChargebeeRef.current === ChargebeeEnabled.INHOUSE_FORCED ||
            isOnSessionMigration(user.ChargebeeUser, subscription?.BillingPlatform);

        if (
            isSubscriptionUnchanged(latestSubscription, copyNewModel.planIDs, copyNewModel.cycle) &&
            !isInhouseForcedUser
        ) {
            setCheckResult({
                ...getOptimisticCheckResult({
                    plansMap,
                    cycle: copyNewModel.cycle,
                    planIDs: copyNewModel.planIDs,
                }),
                Currency: copyNewModel.currency,
                PeriodEnd: 0,
                AmountDue: 0,
            });
            setModel({
                ...copyNewModel,
                noPaymentNeeded: true,
            });
            return true;
        }

        try {
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();

            const coupon = getAutoCoupon({ coupon: newModel.coupon, planIDs: newModel.planIDs, cycle: newModel.cycle });

            let options: CheckWithAutomaticOptions | undefined;
            if (
                // the first check handle the onMethod callback because the
                // component is not rerendered and didn't update paymentFacade by that time yet.
                // the second check handles the case when the component was already rerendered
                (selectedMethod === PAYMENT_METHOD_TYPES.BITCOIN ||
                    paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.BITCOIN) &&
                isOnSessionMigration(user.ChargebeeUser, subscription.BillingPlatform)
            ) {
                options = {
                    forcedVersion: 'v4',
                    reason: 'bitcoin-on-session',
                };
            }

            // PAY-1822. To put it simply, this code removes all the previously applied coupons or gift codes
            // if user re-enters the same coupon code as in the currently active subscription.
            // We must do it because of backend limitations. The backend won't recognize the currently active
            // subscription coupon if there is any other valid coupon in the request payload.
            const codesArgument =
                !!subscriptionCouponCode && newModel.gift === subscriptionCouponCode
                    ? { coupon: subscriptionCouponCode }
                    : { gift: newModel.gift, coupon };

            const Codes = getCodes(codesArgument);

            const checkResult = await paymentsApi.checkWithAutomaticVersion(
                {
                    Codes,
                    Plans: newModel.planIDs,
                    Currency: newModel.currency,
                    Cycle: newModel.cycle,
                    BillingAddress: {
                        CountryCode: newModel.taxBillingAddress.CountryCode,
                        State: newModel.taxBillingAddress.State,
                    },
                },
                abortControllerRef.current.signal,
                options
            );

            const { Gift = 0 } = checkResult;
            const { Code = '' } = checkResult.Coupon || {}; // Coupon can equal null

            if (wantToApplyNewGiftCode && newModel.gift?.toLowerCase() !== Code.toLowerCase() && !Gift) {
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
            onCheck?.({ model, newModel, type: 'success', result: checkResult });
        } catch (error: any) {
            if (error.name === 'OfflineError') {
                setModel({ ...model, step: SUBSCRIPTION_STEPS.NETWORK_ERROR });
            }
            onCheck?.({ model, newModel, type: 'error', error });
            return false;
        }

        return true;
    };

    useEffect(() => {
        if (!model.initialCheckComplete) {
            return;
        }

        void metrics.payments_subscription_steps_total.increment(metricsProps);
    }, [model.step, model.initialCheckComplete]);

    useEffect(() => {
        // Trigger once to initialise the check values
        void withLoadingCheck(check());
        if (parent === 'subscription-modal') {
            // Send telemetry event: initialization
            void reportSubscriptionModalInitialization({
                step: maybeStep,
                plan: plan,
                cycle: model.cycle,
                currency: model.currency,
                upsellRef,
            });
        }
    }, []);

    useEffect(() => {
        // Each time the user switch between steps, scroll to the top
        if (customTopRef?.current) {
            customTopRef.current?.scrollIntoView?.();
        } else {
            topRef?.current?.scrollIntoView?.();
        }
    }, [model.step, customTopRef?.current, topRef?.current]);

    const process = async (processor?: PaymentProcessorHook) =>
        withLoading(async () => {
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
                });
                await processor.processPaymentToken();
            } catch (e) {
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
        void withLoadingCheck(checkPromise);
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
        void withLoadingGift(check({ ...model, gift }, true));
    };

    const handleChangeCurrency = (currency: Currency) => {
        if (loadingCheck || currency === model.currency) {
            return;
        }
        void withLoadingCheck(check({ ...model, currency }));
    };

    const handleBillingAddressChange = (billingAddress: BillingAddress) => {
        void withLoadingCheck(check({ ...model, taxBillingAddress: billingAddress }));
    };

    const backStep = BACK[model.step];
    const isFreePlanSelected = !hasPlanIDs(model.planIDs);
    const isFreeUserWithFreePlanSelected = user.isFree && isFreePlanSelected;

    const disableCycleSelector = isFreePlanSelected || maybeDisableCycleSelector || getIsCustomCycle(model.cycle);

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (model.noPaymentNeeded) {
            onCancel?.();
            return;
        }

        if (loadingCheck || loadingGift) {
            return;
        }

        void withLoading(process(paymentFacade.selectedProcessor));
    };

    const hasSomeVpnPlan =
        getHasSomeVpnPlan(subscription) || getIsVpnPlan(getPlanFromPlanIDs(plansMap, model.planIDs)?.Name);

    const modeType = mode ? mode : 'modal';
    const showFreePlan = modeType === 'upsell-modal' ? false : undefined;

    const hasPaymentMethod = !!paymentFacade.methods.savedMethods?.length;

    const subscriptionCheckoutSubmit = (
        <>
            <SubscriptionSubmitButton
                currency={model.currency}
                onDone={onSubscribed}
                paypal={paymentFacade.paypal}
                step={model.step}
                loading={
                    loading ||
                    paymentFacade.bitcoinInhouse.bitcoinLoading ||
                    paymentFacade.bitcoinChargebee.bitcoinLoading
                }
                paymentMethodValue={paymentFacade.selectedMethodValue}
                checkResult={checkResult}
                className="w-full"
                disabled={isFreeUserWithFreePlanSelected}
                chargebeePaypal={paymentFacade.chargebeePaypal}
                iframeHandles={paymentFacade.iframeHandles}
                noPaymentNeeded={model.noPaymentNeeded}
                subscription={subscription}
                hasPaymentMethod={hasPaymentMethod}
            />
            {paymentFacade.showInclusiveTax && (
                <InclusiveVatText
                    tax={checkResult?.Taxes?.[0]}
                    currency={currency}
                    className="text-sm color-weak text-center mt-1"
                />
            )}
        </>
    );

    const gift = (
        <>
            {couponCode && (
                <div className="flex items-center mb-1">
                    <Icon name="gift" className="mr-2 mb-1" />
                    <Tooltip title={couponDescription}>
                        <code>{couponCode.toUpperCase()}</code>
                    </Tooltip>
                </div>
            )}
            {!getHas2023OfferCoupon(couponCode) && (
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

    const subscriptionCheckoutProps = {
        freePlan,
        subscription,
        plansMap,
        checkResult,
        vpnServers,
        gift,
        submit: subscriptionCheckoutSubmit,
        loading: loadingCheck,
        currency: model.currency,
        cycle: model.cycle,
        planIDs: model.planIDs,
        onChangeCurrency: handleChangeCurrency,
        showTaxCountry: paymentFacade.showTaxCountry,
        statusExtended: paymentFacade.statusExtended,
        onBillingAddressChange: handleBillingAddressChange,
        ...checkoutModifiers,
    };

    const { currentPlan, hasPlanCustomizer } = getHasPlanCustomizer({ plansMap, planIDs: model.planIDs });

    const [optimisticPlanIDs, setOptimisticPlanIDs] = useState<PlanIDs | null>(null);
    const optimisticPlanIDsRef = useRef<any | undefined>();

    const handleChangePlanIDs = useHandler(
        (planIDs: PlanIDs, id: any) => {
            const newModel = { ...model, planIDs };
            setModel(newModel);
            const checkPromise = check(newModel);
            void withLoadingCheck(checkPromise);
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
                    plansMap={plansMap}
                    vpnServers={vpnServers}
                    currency={model.currency}
                    cycle={model.cycle}
                    maximumCycle={maximumCycle}
                    minimumCycle={minimumCycle}
                    planIDs={model.planIDs}
                    mode={modeType}
                    hasFreePlan={showFreePlan}
                    subscription={subscription}
                    onChangePlanIDs={(planIDs, cycle) =>
                        withLoadingCheck(
                            check({
                                ...model,
                                planIDs,
                                cycle,
                                step: SUBSCRIPTION_STEPS.CHECKOUT,
                            })
                        )
                    }
                    onChangeCycle={handleChangeCycle}
                    onChangeCurrency={handleChangeCurrency}
                    onChangeAudience={setAudience}
                    audience={audience}
                    selectedProductPlans={selectedProductPlans}
                    onChangeSelectedProductPlans={setSelectedProductPlans}
                    organization={organization}
                />
            )}

            {model.step === SUBSCRIPTION_STEPS.CHECKOUT && (
                <div className="subscriptionCheckout-top-container">
                    <div className="flex-1 w-full md:w-auto pr-4 md:pr-0 lg:pr-6 pt-6">
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
                                            {c('Label').t`Subscription options`}
                                        </h2>
                                        {hasPlanCustomizer && currentPlan && (
                                            <>
                                                <ProtonPlanCustomizer
                                                    scribeEnabled={
                                                        scribeEnabled.paymentsEnabled && !scribeEnabled.killSwitch
                                                    }
                                                    loading={blockAccountSizeSelector}
                                                    currency={model.currency}
                                                    cycle={model.cycle}
                                                    plansMap={plansMap}
                                                    currentPlan={currentPlan}
                                                    planIDs={optimisticPlanIDs ?? model.planIDs}
                                                    organization={organization}
                                                    onChangePlanIDs={handleOptimisticPlanIDs}
                                                    forceHideDescriptions
                                                    showUsersTooltip={false}
                                                    latestSubscription={latestSubscription}
                                                    allowedAddonTypes={allowedAddonTypes}
                                                    className="mb-8"
                                                />
                                            </>
                                        )}
                                        <div className="mb-8">
                                            {disableCycleSelector ? (
                                                <SubscriptionCheckoutCycleItem
                                                    checkResult={checkResult}
                                                    plansMap={plansMap}
                                                    planIDs={model.planIDs}
                                                    loading={loadingCheck}
                                                />
                                            ) : (
                                                <SubscriptionCycleSelector
                                                    mode="buttons"
                                                    plansMap={plansMap}
                                                    planIDs={model.planIDs}
                                                    cycle={model.cycle}
                                                    currency={model.currency}
                                                    priceType={
                                                        model.planIDs[PLANS.VPN2024] &&
                                                        [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(model.cycle) &&
                                                        couponCode !== COUPON_CODES.VPN_INTRO_2024 &&
                                                        model.initialCheckComplete
                                                            ? PriceType.default
                                                            : undefined
                                                    }
                                                    onChangeCycle={handleChangeCycle}
                                                    disabled={loadingCheck}
                                                    minimumCycle={minimumCycle}
                                                    maximumCycle={maximumCycle}
                                                    subscription={subscription}
                                                    defaultCycles={defaultCycles}
                                                    faded={blockCycleSelector}
                                                />
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                            <h2 className="text-2xl text-bold mb-4">{c('Label').t`Payment details`}</h2>
                            {/* avoid mounting/unmounting the component which re-triggers the hook */}
                            <div className={amountDue ? undefined : 'hidden'}>
                                <PaymentWrapper
                                    {...paymentFacade}
                                    onPaypalCreditClick={() => process(paymentFacade.paypalCredit)}
                                    noMaxWidth
                                    hideFirstLabel={true}
                                    hideSavedMethodsDetails={application === APPS.PROTONACCOUNTLITE}
                                    hasSomeVpnPlan={hasSomeVpnPlan}
                                    onMethod={(value) => {
                                        if (
                                            value === PAYMENT_METHOD_TYPES.BITCOIN &&
                                            isOnSessionMigration(user.ChargebeeUser, subscription.BillingPlatform)
                                        ) {
                                            void withLoadingCheck(check(model, false, value));
                                        }
                                    }}
                                />
                            </div>
                            <NoPaymentRequiredNote
                                amountDue={amountDue}
                                checkResult={checkResult}
                                creditsRemaining={creditsRemaining}
                                subscription={subscription}
                                hasPaymentMethod={hasPaymentMethod}
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
                                {...subscriptionCheckoutProps}
                                showDiscount={!hasPlanCustomizer}
                                enableDetailedAddons={!!hasPlanCustomizer}
                                showPlanDescription={!hasPlanCustomizer}
                            />
                        </div>
                    </div>
                </div>
            )}

            {model.step === SUBSCRIPTION_STEPS.UPGRADE && (
                <SubscriptionThanks
                    showDownloads={!isVpnB2bPlan}
                    loading={true}
                    paymentMethodType={paymentFacade.selectedMethodType}
                />
            )}
            {model.step === SUBSCRIPTION_STEPS.THANKS && (
                <SubscriptionThanks
                    showDownloads={!isVpnB2bPlan}
                    paymentMethodType={paymentFacade.selectedMethodType}
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
            {visionaryWarningModal((props) => {
                return <VisionaryWarningModal {...props} onConfirm={props.onResolve} onClose={props.onReject} />;
            })}
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
            })}
        </>
    );
};

export default SubscriptionContainer;
