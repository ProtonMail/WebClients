import { FormEvent, ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { FeatureCode, useFlag } from '@proton/components/containers';
import { getShortBillingText } from '@proton/components/containers/payments/helper';
import VPNPassPromotionButton from '@proton/components/containers/payments/subscription/VPNPassPromotionButton';
import usePaymentToken from '@proton/components/containers/payments/usePaymentToken';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import {
    AmountAndCurrency,
    ExistingPayment,
    TokenPaymentMethod,
    WrappedCardPayment,
} from '@proton/components/payments/core/interface';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { WebPaymentsSubscriptionStepsTotal } from '@proton/metrics/types/web_payments_subscription_steps_total_v1.schema';
import { checkSubscription, deleteSubscription, subscribe } from '@proton/shared/lib/api/payments';
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
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import { getPlanFromCheckout, hasPlanIDs, supportAddons, switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import {
    getHasB2BPlan,
    getHasVpnB2BPlan,
    getIsB2BPlan,
    getNormalCycleFromCustomCycle,
    getPlanIDs,
    hasMigrationDiscount,
    hasNewVisionary,
    hasPassPlus,
    hasVPN,
    hasVPNPassBundle,
} from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
    Currency,
    Cycle,
    Organization,
    Plan,
    PlanIDs,
    Renew,
    SubscriptionCheckResponse,
    SubscriptionModel,
} from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';
import debounce from '@proton/utils/debounce';
import isTruthy from '@proton/utils/isTruthy';

import { Icon, Tooltip } from '../../../components';
import {
    useApi,
    useConfig,
    useEventManager,
    useFeature,
    useGetCalendars,
    useModals,
    useNotifications,
    useUser,
    useVPNServersCount,
} from '../../../hooks';
import GenericError from '../../error/GenericError';
import LossLoyaltyModal from '../LossLoyaltyModal';
import MemberDowngradeModal from '../MemberDowngradeModal';
import Payment from '../Payment';
import PaymentGiftCode from '../PaymentGiftCode';
import usePayment from '../usePayment';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import PlanCustomization from './PlanCustomization';
import { DiscountWarningModal, NewVisionaryWarningModal } from './PlanLossWarningModal';
import PlanSelection from './PlanSelection';
import SubscriptionCycleSelector, {
    SubscriptionItemView,
    getDiscountPrice,
    getMonthlySuffix,
} from './SubscriptionCycleSelector';
import SubscriptionSubmitButton from './SubscriptionSubmitButton';
import { useCancelSubscriptionFlow } from './cancelSubscription';
import { SUBSCRIPTION_STEPS } from './constants';
import { SelectedProductPlans, getCurrency, getDefaultSelectedProductPlans } from './helpers';
import SubscriptionCheckout from './modal-components/SubscriptionCheckout';
import SubscriptionThanks from './modal-components/SubscriptionThanks';
import { useCheckoutModifiers } from './useCheckoutModifiers';

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
}

const BACK: Partial<{ [key in SUBSCRIPTION_STEPS]: SUBSCRIPTION_STEPS }> = {
    [SUBSCRIPTION_STEPS.CUSTOMIZATION]: SUBSCRIPTION_STEPS.PLAN_SELECTION,
    [SUBSCRIPTION_STEPS.CHECKOUT]: SUBSCRIPTION_STEPS.CUSTOMIZATION,
};

const getCodes = ({ gift, coupon }: Model): string[] => [gift, coupon].filter(isTruthy);

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
}

const SubscriptionContainer = ({
    topRef: customTopRef,
    app,
    step: maybeStep,
    cycle: maybeCycle,
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
    const [user] = useUser();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const { cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({
        subscription,
        user,
    });
    const plansMap = toMap(plans, 'Name');
    const [vpnServers] = useVPNServersCount();
    const getCalendars = useGetCalendars();
    const calendarSharingEnabled = !!useFeature(FeatureCode.CalendarSharingEnabled).feature?.Value;
    const sentinelPassplusEnabled = !!useFlag('SentinelPassPlus');
    const createPaymentToken = usePaymentToken();
    const { APP_NAME } = useConfig();

    const [loading, withLoading] = useLoading();
    const [loadingCheck, withLoadingCheck] = useLoading();
    const [blockCycleSelector, withBlockCycleSelector] = useLoading();
    const [blockAccountSizeSelector, withBlockAccountSizeSelector] = useLoading();
    const [loadingGift, withLoadingGift] = useLoading();
    const [checkResult, setCheckResult] = useState<SubscriptionCheckResponse>();

    const [audience, setAudience] = useState(() => {
        if ((plan && getIsB2BPlan(plan)) || getHasB2BPlan(subscription)) {
            return Audience.B2B;
        }
        return defaultAudience;
    });

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

    const [selectedProductPlans, setSelectedProductPlans] = useState(
        defaultSelectedProductPlans || getDefaultSelectedProductPlans(app, planIDs)
    );

    const [model, setModel] = useState<Model>(() => {
        const step = (() => {
            // Users with VPN B2B plans must not have access to the checkout step.
            if (getHasVpnB2BPlan(subscription) && maybeStep === SUBSCRIPTION_STEPS.CHECKOUT) {
                return SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION;
            }

            return maybeStep ?? SUBSCRIPTION_STEPS.PLAN_SELECTION;
        })();

        const cycle = (() => {
            if (maybeCycle) {
                return maybeCycle;
            }

            if (disablePlanSelection) {
                return subscription.Cycle || DEFAULT_CYCLE;
            }

            /**
             * Users that are on the 15 or 30-month cycle should not default to that,
             * e.g. when clicking "explore other plans"
             * */
            return getNormalCycleFromCustomCycle(subscription.Cycle) || DEFAULT_CYCLE;
        })();

        const currency = (() => {
            if (maybeCurrency) {
                return maybeCurrency;
            }

            return getCurrency(user, subscription, plans);
        })();

        return {
            step,
            cycle,
            currency,
            coupon,
            planIDs,
            initialCheckComplete: false,
        };
    });

    const isVpnB2bPlan = !!model.planIDs[PLANS.VPN_PRO] || !!model.planIDs[PLANS.VPN_BUSINESS];

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

    const handleUnsubscribe = async () => {
        if (hasVPN(subscription) || hasVPNPassBundle(subscription)) {
            if (subscription.Renew === Renew.Disabled) {
                onUnsubscribed?.();
                return;
            }

            await cancelSubscription();
            onUnsubscribed?.();
            return;
        }

        // Start promise early
        const shouldCalendarPreventDowngradePromise = getShouldCalendarPreventSubscripitionChange({
            hasPaidMail: hasPaidMail(user),
            willHavePaidMail: false,
            api,
            getCalendars,
        });

        if (hasMigrationDiscount(subscription)) {
            await new Promise<void>((resolve, reject) => {
                createModal(<DiscountWarningModal type="downgrade" onClose={reject} onConfirm={resolve} />);
            });
        }

        if (await shouldCalendarPreventDowngradePromise) {
            await new Promise<void>((resolve, reject) => {
                createModal(<CalendarDowngradeModal isDowngrade onConfirm={resolve} onClose={reject} />);
            });
        }

        if (hasBonuses(organization)) {
            await new Promise<void>((resolve, reject) => {
                createModal(<LossLoyaltyModal organization={organization} onConfirm={resolve} onClose={reject} />);
            });
        }

        if (organization.UsedMembers > 1) {
            await new Promise<void>((resolve, reject) => {
                createModal(<MemberDowngradeModal organization={organization} onConfirm={resolve} onClose={reject} />);
            });
        }

        await api(deleteSubscription({}));
        await call();

        onUnsubscribed?.();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handlePlanWarnings = async (planIDs: PlanIDs) => {
        const newPlanName = Object.keys(planIDs).find((planName) =>
            plans.find((plan) => plan.Type === PLAN_TYPES.PLAN && plan.Name === planName)
        );
        if (hasNewVisionary(subscription) && PLANS.NEW_VISIONARY !== newPlanName) {
            await new Promise<void>((resolve, reject) => {
                createModal(
                    <NewVisionaryWarningModal
                        type={!newPlanName ? 'downgrade' : 'switch'}
                        onClose={reject}
                        onConfirm={resolve}
                    />
                );
            });
        }
    };

    const handleSubscribe = async (
        params: (TokenPaymentMethod | WrappedCardPayment | ExistingPayment) & AmountAndCurrency
    ) => {
        try {
            await handlePlanWarnings(model.planIDs);
        } catch (e) {
            return;
        }

        if (!hasPlanIDs(model.planIDs)) {
            return handleUnsubscribe();
        }

        const shouldCalendarPreventSubscriptionChangePromise = getShouldCalendarPreventSubscripitionChange({
            hasPaidMail: hasPaidMail(user),
            willHavePaidMail: willHavePaidMail(model.planIDs, plans),
            api,
            getCalendars,
        });

        if (await shouldCalendarPreventSubscriptionChangePromise) {
            return new Promise<void>((resolve, reject) => {
                const handleClose = () => {
                    onCancel?.();
                    reject();
                };
                createModal(<CalendarDowngradeModal onConfirm={resolve} onClose={handleClose} />);
            });
        }

        // When user has an error during checkout, we need to return him to the exact same step
        // Two possible cases: CHECKOUT and CHECKOUT_WITH_CUSTOMIZATION
        const checkoutStep = model.step;
        try {
            setModel({ ...model, step: SUBSCRIPTION_STEPS.UPGRADE });
            await api({
                ...subscribe(
                    {
                        Plans: model.planIDs,
                        Codes: getCodes(model),
                        Cycle: model.cycle,
                        ...params, // Contains Payment, Amount and Currency
                    },
                    app
                ),
                timeout: 60000 * 2, // 2 minutes
            });
            await call();

            void metrics.payments_subscription_total.increment({
                ...metricsProps,
                status: 'success',
            });

            if (disableThanksStep) {
                onSubscribed?.();
            } else {
                setModel({ ...model, step: SUBSCRIPTION_STEPS.THANKS });
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

            setModel({ ...model, step: checkoutStep });
            throw error;
        }
    };

    const { card, setCard, cardErrors, handleCardSubmit, method, setMethod, parameters, canPay, paypal, paypalCredit } =
        usePayment({
            api,
            amount:
                model.step === SUBSCRIPTION_STEPS.CHECKOUT ||
                model.step === SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION
                    ? amountDue // Define amount only in the payment step to generate payment tokens
                    : 0,
            currency: checkResult?.Currency || DEFAULT_CURRENCY,
            onPaypalPay(params) {
                return withLoading(handleSubscribe(params));
            },
        });
    const creditCardTopRef = useRef<HTMLDivElement>(null);
    const bitcoinLoading = method === PAYMENT_METHOD_TYPES.BITCOIN && !bitcoinValidated && awaitingBitcoinPayment;

    const check = async (newModel: Model = model, wantToApplyNewGiftCode: boolean = false): Promise<boolean> => {
        const copyNewModel = {
            ...newModel,
            initialCheckComplete: true,
        };

        if (copyNewModel.step === SUBSCRIPTION_STEPS.CUSTOMIZATION && !supportAddons(copyNewModel.planIDs)) {
            copyNewModel.step = SUBSCRIPTION_STEPS.CHECKOUT;
        }

        if (!hasPlanIDs(newModel.planIDs)) {
            setCheckResult(getFreeCheckResult(model.currency, model.cycle));
            setModel(copyNewModel);
            return true;
        }

        try {
            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();

            const result = await api<SubscriptionCheckResponse>({
                ...checkSubscription({
                    Plans: newModel.planIDs,
                    Currency: newModel.currency,
                    Cycle: newModel.cycle,
                    Codes: getCodes(newModel),
                }),
                signal: abortControllerRef.current.signal,
            });

            const { Gift = 0 } = result;
            const { Code = '' } = result.Coupon || {}; // Coupon can equal null

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

            setCheckResult(result);
            setModel(copyNewModel);
            onCheck?.({ model, newModel, type: 'success', result });
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
    }, []);

    useEffect(() => {
        // Each time the user switch between steps, scroll to the top
        if (customTopRef?.current) {
            customTopRef.current?.scrollIntoView?.();
        } else {
            topRef?.current?.scrollIntoView?.();
        }
    }, [model.step, customTopRef?.current, topRef?.current]);

    const handleCheckout = async () => {
        try {
            if (!parameters) {
                return;
            }

            const amountAndCurrency: AmountAndCurrency = { Amount: amountDue, Currency: model.currency };

            let params: TokenPaymentMethod | WrappedCardPayment | ExistingPayment = parameters;
            if (amountAndCurrency.Amount !== 0) {
                params = await createPaymentToken(parameters, { amountAndCurrency });
            }

            return await handleSubscribe({ ...params, ...amountAndCurrency });
        } catch (e) {
            const error = getSentryError(e);
            if (error) {
                const context = {
                    app,
                    step: model.step,
                    cycle: model.cycle,
                    currency: model.currency,
                    coupon: model.coupon,
                    planIDs,
                    audience,
                };
                captureMessage('Could not handle checkout', { level: 'error', extra: { error, context } });
            }
        }
    };

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

    const backStep =
        model.step === SUBSCRIPTION_STEPS.CHECKOUT && !supportAddons(model.planIDs)
            ? SUBSCRIPTION_STEPS.PLAN_SELECTION
            : BACK[model.step];
    const isFreePlanSelected = !hasPlanIDs(model.planIDs);
    const isFreeUserWithFreePlanSelected = user.isFree && isFreePlanSelected;

    const disableCycleSelector = isFreePlanSelected || maybeDisableCycleSelector || getIsCustomCycle(model.cycle);

    const handleCustomizationSubmit = () => {
        const run = async () => {
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
            const cycleChange = ![CYCLE.FIFTEEN, CYCLE.THIRTY].includes(model.cycle)
                ? { cycle: CYCLE.FIFTEEN }
                : undefined;
            newModel = {
                ...model,
                ...cycleChange,
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

        if (model.step === SUBSCRIPTION_STEPS.CUSTOMIZATION) {
            return;
        }

        if (loadingCheck || loadingGift) {
            return;
        }
        if (!handleCardSubmit()) {
            creditCardTopRef.current?.scrollIntoView();
            return;
        }
        void withLoading(handleCheckout());
    };

    const content = (
        <>
            {!customTopRef && <div ref={topRef} />}
            {model.step === SUBSCRIPTION_STEPS.NETWORK_ERROR && <GenericError />}
            {model.step === SUBSCRIPTION_STEPS.PLAN_SELECTION && (
                <PlanSelection
                    app={app}
                    loading={loadingCheck}
                    plans={plans}
                    plansMap={plansMap}
                    vpnServers={vpnServers}
                    currency={model.currency}
                    cycle={model.cycle}
                    planIDs={model.planIDs}
                    mode="modal"
                    subscription={subscription}
                    onChangePlanIDs={(planIDs) =>
                        withLoadingCheck(
                            check({
                                ...model,
                                planIDs,
                                step:
                                    !!planIDs[PLANS.VPN_PRO] || !!planIDs[PLANS.VPN_BUSINESS]
                                        ? SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION
                                        : SUBSCRIPTION_STEPS.CUSTOMIZATION,
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
                    calendarSharingEnabled={calendarSharingEnabled}
                    sentinelPassplusEnabled={sentinelPassplusEnabled}
                />
            )}
            {model.step === SUBSCRIPTION_STEPS.CUSTOMIZATION && (
                <div className="subscriptionCheckout-top-container">
                    <div className="flex-item-fluid w-full md:w-auto pr-4 md:pr-0 lg:pr-6 pt-6">
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
                        <div className="subscriptionCheckout-container sticky-top" data-testid="subscription-checkout">
                            <SubscriptionCheckout
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
                                    cycle: model.cycle,
                                    planIDs: model.planIDs,
                                    plansMap,
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
                                {...checkoutModifiers}
                            />
                        </div>
                    </div>
                </div>
            )}
            {model.step === SUBSCRIPTION_STEPS.CHECKOUT && (
                <>
                    <div className="subscriptionCheckout-top-container">
                        <div className="flex-item-fluid w-full md:w-auto pr-4 md:pr-0 lg:pr-6 pt-6">
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
                                                            checkResult,
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
                                                                className="flex flex-nowrap flex-align-items-center flex-justify-center"
                                                                fullWidth
                                                                color="weak"
                                                                shape="outline"
                                                                onClick={handleUpsellVPNPassBundle}
                                                            >
                                                                <Icon name="trash" size={14} />
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
                                                    onChangeCycle={handleChangeCycle}
                                                    disabled={loadingCheck}
                                                />
                                            </div>
                                        </>
                                    );
                                })()}
                                {/* avoid mounting/unmounting the component which re-triggers the hook */}
                                <div className={amountDue ? undefined : 'hidden'}>
                                    <Payment
                                        api={api}
                                        type="subscription"
                                        paypal={paypal}
                                        paypalCredit={paypalCredit}
                                        method={method}
                                        amount={amountDue}
                                        currency={checkResult?.Currency}
                                        coupon={couponCode}
                                        card={card}
                                        onMethod={setMethod}
                                        onCard={setCard}
                                        cardErrors={cardErrors}
                                        creditCardTopRef={creditCardTopRef}
                                        onBitcoinTokenValidated={async (data) => {
                                            setBitcoinValidated(true);
                                            await handleSubscribe({
                                                ...data,
                                                Amount: amountDue,
                                                Currency: checkResult?.Currency as Currency,
                                            });
                                        }}
                                        onAwaitingBitcoinPayment={setAwaitingBitcoinPayment}
                                    />
                                </div>
                                <div className={amountDue || !checkResult ? 'hidden' : undefined}>
                                    <h2 className="text-2xl text-bold mb-4">{c('Label').t`Payment details`}</h2>
                                    <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                                    {checkResult?.Credit && creditsRemaining ? (
                                        <div className="mb-4">{c('Info')
                                            .t`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`}</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <div className="subscriptionCheckout-column bg-weak rounded">
                            <div
                                className="subscriptionCheckout-container sticky-top"
                                data-testid="subscription-checkout"
                            >
                                <SubscriptionCheckout
                                    submit={
                                        <SubscriptionSubmitButton
                                            currency={model.currency}
                                            onDone={onSubscribed}
                                            paypal={paypal}
                                            step={model.step}
                                            loading={loading || bitcoinLoading}
                                            method={method}
                                            checkResult={checkResult}
                                            className="w-full"
                                            disabled={isFreeUserWithFreePlanSelected || !canPay}
                                        />
                                    }
                                    plansMap={plansMap}
                                    checkResult={checkResult}
                                    vpnServers={vpnServers}
                                    loading={loadingCheck}
                                    currency={model.currency}
                                    subscription={subscription}
                                    cycle={model.cycle}
                                    planIDs={model.planIDs}
                                    gift={
                                        <>
                                            {couponCode && (
                                                <div className="flex flex-align-items-center mb-1">
                                                    <Icon name="gift" className="mr-2 mb-1" />
                                                    <Tooltip title={couponDescription}>
                                                        <code>{couponCode.toUpperCase()}</code>
                                                    </Tooltip>
                                                </div>
                                            )}
                                            {couponCode !== COUPON_CODES.BLACK_FRIDAY_2023 && (
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
                                    {...checkoutModifiers}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
            {model.step === SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION && (
                <div className="subscriptionCheckout-top-container">
                    <div className="flex-item-fluid w-full md:w-auto pr-4 md:pr-0 lg:pr-6 pt-6">
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
                                        />
                                    </div>
                                </>
                            )}
                            <h2 className="text-2xl text-bold mb-4">{c('Label').t`Payment details`}</h2>
                            {/* avoid mounting/unmounting the component which re-triggers the hook */}
                            <div className={amountDue ? undefined : 'hidden'}>
                                <Payment
                                    api={api}
                                    type="subscription"
                                    paypal={paypal}
                                    paypalCredit={paypalCredit}
                                    method={method}
                                    amount={amountDue}
                                    currency={checkResult?.Currency}
                                    coupon={couponCode}
                                    card={card}
                                    onMethod={setMethod}
                                    onCard={setCard}
                                    cardErrors={cardErrors}
                                    creditCardTopRef={creditCardTopRef}
                                    onBitcoinTokenValidated={async (data) => {
                                        setBitcoinValidated(true);
                                        await handleSubscribe({
                                            ...data,
                                            Amount: amountDue,
                                            Currency: checkResult?.Currency as Currency,
                                        });
                                    }}
                                    onAwaitingBitcoinPayment={setAwaitingBitcoinPayment}
                                    hideFirstLabel={true}
                                />
                            </div>
                            <div className={amountDue || !checkResult ? 'hidden' : undefined}>
                                <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                                {checkResult?.Credit && creditsRemaining ? (
                                    <div className="mb-4">{c('Info')
                                        .t`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`}</div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <div className="subscriptionCheckout-column bg-weak rounded">
                        <div className="subscriptionCheckout-container sticky-top" data-testid="subscription-checkout">
                            <SubscriptionCheckout
                                submit={
                                    <SubscriptionSubmitButton
                                        currency={model.currency}
                                        onDone={onSubscribed}
                                        paypal={paypal}
                                        step={model.step}
                                        loading={loading || bitcoinLoading}
                                        method={method}
                                        checkResult={checkResult}
                                        className="w-full"
                                        disabled={isFreeUserWithFreePlanSelected || !canPay}
                                    />
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
                                            <div className="flex flex-align-items-center mb-1">
                                                <Icon name="gift" className="mr-2 mb-1" />
                                                <Tooltip title={couponDescription}>
                                                    <code>{couponCode.toUpperCase()}</code>
                                                </Tooltip>
                                            </div>
                                        )}
                                        {couponCode !== COUPON_CODES.BLACK_FRIDAY_2023 && (
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
                                {...checkoutModifiers}
                            />
                        </div>
                    </div>
                </div>
            )}
            {model.step === SUBSCRIPTION_STEPS.UPGRADE && (
                <SubscriptionThanks showDownloads={!isVpnB2bPlan} loading={true} method={method} />
            )}
            {model.step === SUBSCRIPTION_STEPS.THANKS && (
                <SubscriptionThanks
                    showDownloads={!isVpnB2bPlan}
                    method={method}
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
