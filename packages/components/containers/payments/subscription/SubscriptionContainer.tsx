import { FormEvent, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getShortBillingText, isSubscriptionUnchanged } from '@proton/components/containers/payments/helper';
import VPNPassPromotionButton from '@proton/components/containers/payments/subscription/VPNPassPromotionButton';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { usePollEvents } from '@proton/components/payments/client-extensions/usePollEvents';
import { BillingAddress, PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import { Operations, OperationsSubscriptionData } from '@proton/components/payments/react-extensions';
import { PaymentProcessorHook, PaymentProcessorType } from '@proton/components/payments/react-extensions/interface';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { WebPaymentsSubscriptionStepsTotal } from '@proton/metrics/types/web_payments_subscription_steps_total_v1.schema';
import { subscribe as apiSubscribe, getPaymentsVersion } from '@proton/shared/lib/api/payments';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { getShouldCalendarPreventSubscripitionChange, willHavePaidMail } from '@proton/shared/lib/calendar/plans';
import {
    APPS,
    COUPON_CODES,
    CYCLE,
    DEFAULT_CURRENCY,
    DEFAULT_CYCLE,
    PASS_APP_NAME,
    PLANS,
    PLAN_TYPES,
    isFreeSubscription,
} from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { canUpsellToVPNPassBundle } from '@proton/shared/lib/helpers/blackfriday';
import { getCheckout, getIsCustomCycle, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import {
    getPlanFromCheckout,
    getPlanFromPlanIDs,
    hasPlanIDs,
    supportAddons,
    switchPlan,
} from '@proton/shared/lib/helpers/planIDs';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import {
    getHas2023OfferCoupon,
    getHasSomeVpnPlan,
    getHasVpnB2BPlan,
    getIsB2BAudienceFromPlan,
    getIsB2BAudienceFromSubscription,
    getIsVpnPlan,
    getNormalCycleFromCustomCycle,
    getPlanIDs,
    getPlanNameFromIDs,
    hasNewVisionary,
    hasPassPlus,
} from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
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
import debounce from '@proton/utils/debounce';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { Icon, Tooltip } from '../../../components';
import {
    useApi,
    useConfig,
    useEventManager,
    useGetCalendars,
    useNotifications,
    useUser,
    useVPNServersCount,
} from '../../../hooks';
import GenericError from '../../error/GenericError';
import InclusiveVatText from '../InclusiveVatText';
import PaymentGiftCode from '../PaymentGiftCode';
import PaymentWrapper from '../PaymentWrapper';
import { DEFAULT_TAX_BILLING_ADDRESS } from '../TaxCountrySelector';
import { ValidatedBitcoinToken, isValidatedBitcoinToken } from '../useBitcoin';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import { NoPaymentRequiredNote } from './NoPaymentRequiredNote';
import PlanCustomization from './PlanCustomization';
import { NewVisionaryWarningModal, NewVisionaryWarningModalOwnProps } from './PlanLossWarningModal';
import PlanSelection from './PlanSelection';
import SubscriptionCycleSelector, {
    SubscriptionItemView,
    getDiscountPrice,
    getMonthlySuffix,
} from './SubscriptionCycleSelector';
import SubscriptionSubmitButton from './SubscriptionSubmitButton';
import { useCancelSubscriptionFlow } from './cancelSubscription';
import { SUBSCRIPTION_STEPS } from './constants';
import { SelectedProductPlans, getAutoCoupon, getCurrency, getDefaultSelectedProductPlans } from './helpers';
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
    [SUBSCRIPTION_STEPS.CUSTOMIZATION]: SUBSCRIPTION_STEPS.PLAN_SELECTION,
    [SUBSCRIPTION_STEPS.CHECKOUT]: SUBSCRIPTION_STEPS.CUSTOMIZATION,
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
}: SubscriptionContainerProps) => {
    const TITLE = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: c('Title').t`Network error`,
        [SUBSCRIPTION_STEPS.PLAN_SELECTION]: c('Title').t`Select a plan`,
        [SUBSCRIPTION_STEPS.CUSTOMIZATION]: c('Title').t`Customize your plan`,
        [SUBSCRIPTION_STEPS.CHECKOUT]: c('new_plans: title').t`Review subscription and pay`,
        [SUBSCRIPTION_STEPS.UPGRADE]: '',
        [SUBSCRIPTION_STEPS.THANKS]: '',
        [SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION]: c('new_plans: title').t`Review subscription and pay`,
    };

    const metricStepMap: Record<SUBSCRIPTION_STEPS, MetricsStep> = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: 'network-error',
        [SUBSCRIPTION_STEPS.PLAN_SELECTION]: 'plan-selection',
        [SUBSCRIPTION_STEPS.CUSTOMIZATION]: 'customization',
        [SUBSCRIPTION_STEPS.CHECKOUT]: 'checkout',
        [SUBSCRIPTION_STEPS.UPGRADE]: 'upgrade',
        [SUBSCRIPTION_STEPS.THANKS]: 'thanks',
        [SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION]: 'checkout-with-customization',
    };

    const topRef = useRef<HTMLDivElement>(null);
    const api = useApi();
    const { paymentsApi } = usePaymentsApi(api);
    const [user] = useUser();
    const { call } = useEventManager();
    const pollEventsMultipleTimes = usePollEvents();
    const [visionaryWarningModal, showNewVisionaryWarningModal] =
        useModalTwoPromise<NewVisionaryWarningModalOwnProps>();
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

    const [audience, setAudience] = useState(() => {
        if ((plan && getIsB2BAudienceFromPlan(plan)) || getIsB2BAudienceFromSubscription(subscription)) {
            return Audience.B2B;
        }
        return defaultAudience;
    });

    const { reportSubscriptionModalInitialization, reportSubscriptionModalPayment } = useSubscriptionModalTelemetry();

    const planIDs = useMemo(() => {
        const subscriptionPlanIDs = getPlanIDs(subscription);

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

    const [model, setModel] = useState<Model>(() => {
        const step = (() => {
            // Users with VPN B2B plans must not have access to the checkout step.
            if (getHasVpnB2BPlan(subscription) && maybeStep === SUBSCRIPTION_STEPS.CHECKOUT) {
                return SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION;
            }

            return maybeStep ?? SUBSCRIPTION_STEPS.PLAN_SELECTION;
        })();

        const cycle = (() => {
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

    const isVpnB2bPlan = !!model.planIDs[PLANS.VPN_PRO] || !!model.planIDs[PLANS.VPN_BUSINESS];

    const isPassB2bPlan = !!model.planIDs[PLANS.PASS_PRO] || !!model.planIDs[PLANS.PASS_BUSINESS];
    const defaultCycles = isPassB2bPlan ? [CYCLE.YEARLY, CYCLE.MONTHLY] : undefined;
    const [bitcoinValidated, setBitcoinValidated] = useState(false);
    const [awaitingBitcoinPayment, setAwaitingBitcoinPayment] = useState(false);

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

    const amount =
        model.step === SUBSCRIPTION_STEPS.CHECKOUT || model.step === SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION
            ? amountDue
            : 0;
    const currency = checkResult?.Currency || DEFAULT_CURRENCY;

    const handlePlanWarnings = async (planIDs: PlanIDs) => {
        const newPlanName = Object.keys(planIDs).find((planName) =>
            plans.find((plan) => plan.Type === PLAN_TYPES.PLAN && plan.Name === planName)
        );
        if (hasNewVisionary(subscription) && PLANS.NEW_VISIONARY !== newPlanName) {
            await showNewVisionaryWarningModal({ type: !newPlanName ? 'downgrade' : 'switch' });
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

    const processSubscription = async (operationsOrValidToken: Operations | ValidatedBitcoinToken) => {
        const Codes = getCodesForSubscription();

        if (isValidatedBitcoinToken(operationsOrValidToken)) {
            await api(
                apiSubscribe(
                    {
                        Codes,
                        Plans: model.planIDs,
                        Cycle: model.cycle,
                        Currency: currency,
                        Amount: amount,
                        Payment: operationsOrValidToken.Payment,
                        BillingAddress: model.taxBillingAddress,
                    },
                    app,
                    'v4'
                )
            );
        } else {
            await operationsOrValidToken.subscribe({
                Codes,
                Plans: model.planIDs,
                Cycle: model.cycle,
                product: app,
                taxBillingAddress: model.taxBillingAddress,
            });
        }
    };

    const handleSubscribe = async (
        operationsOrValidToken: Operations | ValidatedBitcoinToken,
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
        // Two possible cases: CHECKOUT and CHECKOUT_WITH_CUSTOMIZATION
        const checkoutStep = model.step;
        try {
            setModel((model) => ({ ...model, step: SUBSCRIPTION_STEPS.UPGRADE }));
            try {
                await processSubscription(operationsOrValidToken);

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
    });

    const bitcoinLoading =
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.BITCOIN &&
        !bitcoinValidated &&
        awaitingBitcoinPayment;

    const check = async (newModel: Model = model, wantToApplyNewGiftCode: boolean = false): Promise<boolean> => {
        const isInitialCheck = !newModel.initialCheckComplete;
        const copyNewModel = {
            ...newModel,
            initialCheckComplete: true,
            noPaymentNeeded: false,
        };

        if (copyNewModel.step === SUBSCRIPTION_STEPS.CUSTOMIZATION && !supportAddons(copyNewModel.planIDs)) {
            copyNewModel.step = SUBSCRIPTION_STEPS.CHECKOUT;
        }

        if (!hasPlanIDs(newModel.planIDs)) {
            setCheckResult(getFreeCheckResult(model.currency, model.cycle));
            setModel(copyNewModel);
            return true;
        }

        const dontQueryCheck =
            copyNewModel.step === SUBSCRIPTION_STEPS.PLAN_SELECTION ||
            (copyNewModel.step === SUBSCRIPTION_STEPS.CUSTOMIZATION && isInitialCheck);

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

        if (isSubscriptionUnchanged(subscription, copyNewModel.planIDs, copyNewModel.currency, copyNewModel.cycle)) {
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

            const checkResult = await paymentsApi.checkWithAutomaticVersion(
                {
                    Plans: newModel.planIDs,
                    Currency: newModel.currency,
                    Cycle: newModel.cycle,
                    Codes: getCodes({ gift: newModel.gift, coupon }),
                    BillingAddress: {
                        CountryCode: newModel.taxBillingAddress.CountryCode,
                        State: newModel.taxBillingAddress.State,
                    },
                },
                abortControllerRef.current.signal
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

    const backStep =
        model.step === SUBSCRIPTION_STEPS.CHECKOUT && !supportAddons(model.planIDs)
            ? SUBSCRIPTION_STEPS.PLAN_SELECTION
            : BACK[model.step];
    const isFreePlanSelected = !hasPlanIDs(model.planIDs);
    const isFreeUserWithFreePlanSelected = user.isFree && isFreePlanSelected;

    const disableCycleSelector = isFreePlanSelected || maybeDisableCycleSelector || getIsCustomCycle(model.cycle);

    const handleCustomizationSubmit = () => {
        const run = async () => {
            const samePlan = isSubscriptionUnchanged(subscription, model.planIDs, model.currency);
            if (samePlan) {
                createNotification({ text: c('Info').t`No changes made to the current subscription`, type: 'info' });
                return;
            }

            let isSuccess = await check();

            if (isSuccess) {
                setModel((old) => ({
                    ...old,
                    step: SUBSCRIPTION_STEPS.CHECKOUT,
                }));
            }
        };
        void withLoading(run());
    };

    const handleUpsellVPNPassBundle = () => {
        if (loadingCheck) {
            return;
        }

        let newModel: Model;
        if (model.planIDs[PLANS.VPN]) {
            newModel = {
                ...model,
                planIDs: {
                    [PLANS.VPN_PASS_BUNDLE]: 1,
                },
            };
        } else {
            newModel = {
                ...model,
                planIDs: {
                    [PLANS.VPN]: 1,
                },
            };
        }
        setModel(newModel);
        const checkPromise = check(newModel);
        void withLoadingCheck(checkPromise);
        void withBlockCycleSelector(checkPromise);
    };

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (model.noPaymentNeeded) {
            onCancel?.();
            return;
        }

        if (model.step === SUBSCRIPTION_STEPS.CUSTOMIZATION) {
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
                    onChangePlanIDs={(planIDs) =>
                        withLoadingCheck(
                            check({
                                ...model,
                                planIDs,
                                step: (() => {
                                    if (!!planIDs[PLANS.VPN_PRO] || !!planIDs[PLANS.VPN_BUSINESS]) {
                                        return SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION;
                                    }

                                    if (!!planIDs[PLANS.PASS_PRO] || !!planIDs[PLANS.PASS_BUSINESS]) {
                                        return SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION;
                                    }

                                    return SUBSCRIPTION_STEPS.CUSTOMIZATION;
                                })(),
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
            {model.step === SUBSCRIPTION_STEPS.CUSTOMIZATION && (
                <div className="subscriptionCheckout-top-container">
                    <div className="flex-1 w-full md:w-auto pr-4 md:pr-0 lg:pr-6 pt-6">
                        <div className="max-w-custom" style={{ '--max-w-custom': '50em' }}>
                            <PlanCustomization
                                loading={loadingCheck}
                                currency={model.currency}
                                cycle={model.cycle}
                                plansMap={plansMap}
                                planIDs={model.planIDs}
                                organization={organization}
                                onChangePlanIDs={(planIDs) => setModel({ ...model, planIDs })}
                                currentSubscription={subscription}
                                className="pb-7 mb-8"
                            />
                        </div>
                    </div>
                    <div className="subscriptionCheckout-column bg-weak rounded">
                        <div
                            className="subscriptionCheckout-container sticky top-0"
                            data-testid="subscription-checkout"
                        >
                            <SubscriptionCheckout
                                freePlan={freePlan}
                                submit={
                                    <Button
                                        color="norm"
                                        loading={loading}
                                        onClick={handleCustomizationSubmit}
                                        fullWidth
                                        data-testid="continue-to-review"
                                    >
                                        {c('new_plans: action').t`Continue to review`}
                                    </Button>
                                }
                                checkResult={getOptimisticCheckResult({
                                    plansMap,
                                    cycle: model.cycle,
                                    planIDs: model.planIDs,
                                })}
                                plansMap={plansMap}
                                vpnServers={vpnServers}
                                isOptimistic={true}
                                loading={loadingCheck}
                                currency={model.currency}
                                cycle={model.cycle}
                                planIDs={model.planIDs}
                                subscription={subscription}
                                onChangeCurrency={handleChangeCurrency}
                                statusExtended={paymentFacade.statusExtended}
                                {...checkoutModifiers}
                            />
                        </div>
                    </div>
                </div>
            )}
            {model.step === SUBSCRIPTION_STEPS.CHECKOUT && (
                <>
                    <div className="subscriptionCheckout-top-container">
                        <div className="flex-1 w-full md:w-auto pr-4 md:pr-0 lg:pr-6 pt-6">
                            <div
                                className="mx-auto max-w-custom subscriptionCheckout-options"
                                style={{ '--max-w-custom': '37em' }}
                            >
                                {(() => {
                                    if (isFreePlanSelected) {
                                        return null;
                                    }
                                    if (disableCycleSelector) {
                                        return (
                                            <>
                                                <h2 className="text-2xl text-bold mb-4">{c('Label').t`New plan`}</h2>
                                                <div className="mb-8">
                                                    {(() => {
                                                        const plan = getPlanFromCheckout(model.planIDs, plansMap);
                                                        const result = getCheckout({
                                                            planIDs: model.planIDs,
                                                            plansMap,
                                                            checkResult: checkResult,
                                                        });
                                                        return (
                                                            <SubscriptionItemView
                                                                title={plan?.Title}
                                                                bottomLeft={getShortBillingText(model.cycle)}
                                                                topRight={getSimplePriceString(
                                                                    model.currency,
                                                                    result.withDiscountPerMonth,
                                                                    getMonthlySuffix(model.planIDs)
                                                                )}
                                                                bottomRight={getDiscountPrice(
                                                                    result.discountPerCycle,
                                                                    model.currency
                                                                )}
                                                                loading={loadingCheck}
                                                            />
                                                        );
                                                    })()}
                                                    {canUpsellToVPNPassBundle(
                                                        model.planIDs,
                                                        model.cycle,
                                                        couponCode
                                                    ) && (
                                                        <VPNPassPromotionButton
                                                            onClick={handleUpsellVPNPassBundle}
                                                            currency={model.currency}
                                                            cycle={model.cycle}
                                                        />
                                                    )}
                                                    {model.planIDs[PLANS.VPN_PASS_BUNDLE] &&
                                                        !hasPassPlus(subscription) && (
                                                            <Button
                                                                className="flex flex-nowrap items-center justify-center"
                                                                fullWidth
                                                                color="weak"
                                                                shape="outline"
                                                                onClick={handleUpsellVPNPassBundle}
                                                            >
                                                                <Icon name="trash" size={3.5} />
                                                                <span className="ml-2">
                                                                    {c('bf2023: Action').t`Remove ${PASS_APP_NAME}`}
                                                                </span>
                                                            </Button>
                                                        )}
                                                </div>
                                            </>
                                        );
                                    }
                                    return (
                                        <>
                                            <h2 className="text-2xl text-bold mb-4">
                                                {c('Label').t`Subscription options`}
                                            </h2>
                                            <div className="mb-8">
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
                                                />
                                            </div>
                                        </>
                                    );
                                })()}
                                {/* avoid mounting/unmounting the component which re-triggers the hook */}
                                <div className={amountDue ? undefined : 'hidden'}>
                                    <PaymentWrapper
                                        {...paymentFacade}
                                        onPaypalCreditClick={() => process(paymentFacade.paypalCredit)}
                                        noMaxWidth
                                        onBitcoinTokenValidated={async (data) => {
                                            setBitcoinValidated(true);
                                            await handleSubscribe(data, {
                                                operationsSubscriptionData: {
                                                    Plans: model.planIDs,
                                                    Cycle: model.cycle,
                                                    product: app,
                                                    taxBillingAddress: model.taxBillingAddress,
                                                },
                                                paymentProcessorType: 'bitcoin',
                                            }).catch(noop);
                                        }}
                                        onAwaitingBitcoinPayment={setAwaitingBitcoinPayment}
                                        hideSavedMethodsDetails={application === APPS.PROTONACCOUNTLITE}
                                        hasSomeVpnPlan={hasSomeVpnPlan}
                                    />
                                </div>
                                <NoPaymentRequiredNote
                                    amountDue={amountDue}
                                    checkResult={checkResult}
                                    creditsRemaining={creditsRemaining}
                                    subscription={subscription}
                                    hasPaymentMethod={hasPaymentMethod}
                                />
                            </div>
                        </div>
                        <div className="subscriptionCheckout-column bg-weak rounded">
                            <div
                                className="subscriptionCheckout-container sticky top-0"
                                data-testid="subscription-checkout"
                            >
                                <SubscriptionCheckout
                                    freePlan={freePlan}
                                    submit={
                                        <>
                                            <SubscriptionSubmitButton
                                                currency={model.currency}
                                                onDone={onSubscribed}
                                                paypal={paymentFacade.paypal}
                                                step={model.step}
                                                loading={loading || bitcoinLoading}
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
                                    }
                                    plansMap={plansMap}
                                    checkResult={checkResult}
                                    vpnServers={vpnServers}
                                    loading={loadingCheck}
                                    currency={model.currency}
                                    subscription={subscription}
                                    cycle={model.cycle}
                                    planIDs={model.planIDs}
                                    gift={(() => {
                                        return (
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
                                    })()}
                                    onChangeCurrency={handleChangeCurrency}
                                    nextSubscriptionStart={subscription.PeriodEnd}
                                    showTaxCountry={paymentFacade.showTaxCountry}
                                    onBillingAddressChange={handleBillingAddressChange}
                                    statusExtended={paymentFacade.statusExtended}
                                    {...checkoutModifiers}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
            {model.step === SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION && (
                <div className="subscriptionCheckout-top-container">
                    <div className="flex-1 w-full md:w-auto pr-4 md:pr-0 lg:pr-6 pt-6">
                        <h2 className="text-2xl text-bold mb-6">{c('Label').t`Organization size`}</h2>
                        <PlanCustomization
                            loading={blockAccountSizeSelector}
                            currency={model.currency}
                            cycle={model.cycle}
                            plansMap={plansMap}
                            planIDs={model.planIDs}
                            organization={organization}
                            onChangePlanIDs={debounce((planIDs) => {
                                const newModel = { ...model, planIDs };
                                setModel(newModel);
                                const checkPromise = check(newModel);
                                void withLoadingCheck(checkPromise);
                                void withBlockCycleSelector(checkPromise);
                            }, 300)}
                            forceHideDescriptions
                            showUsersTooltip={false}
                            currentSubscription={subscription}
                            className="mb-8"
                        />
                        <div
                            className="mx-auto max-w-custom subscriptionCheckout-options"
                            style={{ '--max-w-custom': '37em' }}
                        >
                            {!disableCycleSelector && (
                                <>
                                    <h2 className="text-2xl text-bold mb-6">{c('Label').t`Select your plan`}</h2>
                                    <div className="mb-8">
                                        <SubscriptionCycleSelector
                                            mode="buttons"
                                            plansMap={plansMap}
                                            planIDs={model.planIDs}
                                            cycle={model.cycle}
                                            currency={model.currency}
                                            onChangeCycle={handleChangeCycle}
                                            disabled={loadingCheck}
                                            faded={blockCycleSelector}
                                            minimumCycle={minimumCycle}
                                            subscription={subscription}
                                            defaultCycles={defaultCycles}
                                        />
                                    </div>
                                </>
                            )}
                            <h2 className="text-2xl text-bold mb-4">{c('Label').t`Payment details`}</h2>
                            {/* avoid mounting/unmounting the component which re-triggers the hook */}
                            <div className={amountDue ? undefined : 'hidden'}>
                                <PaymentWrapper
                                    {...paymentFacade}
                                    onPaypalCreditClick={() => process(paymentFacade.paypalCredit)}
                                    noMaxWidth
                                    onBitcoinTokenValidated={async (data) => {
                                        setBitcoinValidated(true);
                                        await handleSubscribe(data, {
                                            operationsSubscriptionData: {
                                                Plans: model.planIDs,
                                                Cycle: model.cycle,
                                                product: app,
                                                taxBillingAddress: model.taxBillingAddress,
                                            },
                                            paymentProcessorType: 'bitcoin',
                                        }).catch(noop);
                                    }}
                                    onAwaitingBitcoinPayment={setAwaitingBitcoinPayment}
                                    hideFirstLabel={true}
                                    hideSavedMethodsDetails={application === APPS.PROTONACCOUNTLITE}
                                    hasSomeVpnPlan={hasSomeVpnPlan}
                                />
                            </div>
                            <NoPaymentRequiredNote
                                amountDue={amountDue}
                                checkResult={checkResult}
                                creditsRemaining={creditsRemaining}
                                subscription={subscription}
                                hasPaymentMethod={hasPaymentMethod}
                            />
                        </div>
                    </div>
                    <div className="subscriptionCheckout-column bg-weak rounded">
                        <div
                            className="subscriptionCheckout-container sticky top-0"
                            data-testid="subscription-checkout"
                        >
                            <SubscriptionCheckout
                                freePlan={freePlan}
                                submit={
                                    <>
                                        <SubscriptionSubmitButton
                                            currency={model.currency}
                                            onDone={onSubscribed}
                                            paypal={paymentFacade.paypal}
                                            step={model.step}
                                            loading={loading || bitcoinLoading}
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
                                }
                                subscription={subscription}
                                plansMap={plansMap}
                                checkResult={checkResult}
                                vpnServers={vpnServers}
                                loading={loadingCheck}
                                currency={model.currency}
                                cycle={model.cycle}
                                planIDs={model.planIDs}
                                gift={
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
                                }
                                onChangeCurrency={handleChangeCurrency}
                                nextSubscriptionStart={subscription.PeriodEnd}
                                showDiscount={false}
                                enableDetailedAddons={true}
                                showPlanDescription={false}
                                showTaxCountry={paymentFacade.showTaxCountry}
                                statusExtended={paymentFacade.statusExtended}
                                onBillingAddressChange={handleBillingAddressChange}
                                {...checkoutModifiers}
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
        if ((disablePlanSelection && backStep === SUBSCRIPTION_STEPS.PLAN_SELECTION) || backStep === undefined) {
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
                return <NewVisionaryWarningModal {...props} onConfirm={props.onResolve} onClose={props.onReject} />;
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
