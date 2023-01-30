import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { checkSubscription, deleteSubscription, subscribe } from '@proton/shared/lib/api/payments';
import { getShouldCalendarPreventSubscripitionChange, willHavePaidMail } from '@proton/shared/lib/calendar/plans';
import { APP_NAMES, DEFAULT_CURRENCY, DEFAULT_CYCLE, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getCheckout, getIsCustomCycle, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import { hasPlanIDs, supportAddons } from '@proton/shared/lib/helpers/planIDs';
import { getPlanIDs, hasMigrationDiscount, hasNewVisionary } from '@proton/shared/lib/helpers/subscription';
import {
    Audience,
    Currency,
    Cycle,
    PlanIDs,
    PlansMap,
    SubscriptionCheckResponse,
    SubscriptionModel,
} from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { hasPaidMail } from '@proton/shared/lib/user/helpers';
import isTruthy from '@proton/utils/isTruthy';

import {
    Icon,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Tooltip,
} from '../../../components';
import { classnames } from '../../../helpers';
import {
    useApi,
    useEventManager,
    useGetCalendars,
    useLoading,
    useModals,
    useNotifications,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
    useVPNServersCount,
} from '../../../hooks';
import GenericError from '../../error/GenericError';
import LossLoyaltyModal from '../LossLoyaltyModal';
import MemberDowngradeModal from '../MemberDowngradeModal';
import Payment from '../Payment';
import PaymentGiftCode from '../PaymentGiftCode';
import { handlePaymentToken } from '../paymentTokenHelper';
import usePayment from '../usePayment';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import PlanCustomization from './PlanCustomization';
import { DiscountWarningModal, NewVisionaryWarningModal } from './PlanLossWarningModal';
import PlanSelection from './PlanSelection';
import SubscriptionCycleSelector from './SubscriptionCycleSelector';
import SubscriptionSubmitButton from './SubscriptionSubmitButton';
import { SUBSCRIPTION_STEPS, subscriptionModalClassName } from './constants';
import { getDefaultSelectedProductPlans } from './helpers';
import SubscriptionCheckout from './modal-components/SubscriptionCheckout';
import SubscriptionThanks from './modal-components/SubscriptionThanks';

import './SubscriptionModal.scss';

export interface Props extends Pick<ModalProps<'div'>, 'open' | 'onClose' | 'onExit'> {
    app: APP_NAMES;
    step?: SUBSCRIPTION_STEPS;
    cycle?: Cycle;
    currency?: Currency;
    planIDs?: PlanIDs;
    coupon?: string | null;
    disablePlanSelection?: boolean;
    disableThanksStep?: boolean;
    defaultAudience?: Audience;
    disableCycleSelector?: boolean;
    defaultSelectedProductPlans: ReturnType<typeof getDefaultSelectedProductPlans>;
    onSuccess?: () => void;
}

export interface Model {
    step: SUBSCRIPTION_STEPS;
    planIDs: PlanIDs;
    currency: Currency;
    cycle: Cycle;
    coupon?: string | null;
    gift?: string;
}

const BACK: Partial<{ [key in SUBSCRIPTION_STEPS]: SUBSCRIPTION_STEPS }> = {
    [SUBSCRIPTION_STEPS.CUSTOMIZATION]: SUBSCRIPTION_STEPS.PLAN_SELECTION,
    [SUBSCRIPTION_STEPS.CHECKOUT]: SUBSCRIPTION_STEPS.CUSTOMIZATION,
};

const getCodes = ({ gift, coupon }: Model) => [gift, coupon].filter(isTruthy);

export const useProration = (
    model: Model,
    subscription: SubscriptionModel,
    plansMap: PlansMap,
    checkResult?: SubscriptionCheckResponse
) => {
    const showProration = useMemo(() => {
        const checkout = getCheckout({
            planIDs: getPlanIDs(subscription),
            plansMap,
            checkResult,
        });
        const activePlan = checkout.planName as string;

        const selectedPlans = Object.keys(model.planIDs);

        const userBuysTheSamePlan = selectedPlans.includes(activePlan);

        if (!checkResult || !userBuysTheSamePlan || checkResult.Proration === undefined) {
            return true;
        }

        return checkResult.Proration !== 0;
    }, [subscription, model, checkResult]);

    return {
        showProration,
    };
};

const SubscriptionModal = ({
    app,
    step = SUBSCRIPTION_STEPS.PLAN_SELECTION,
    cycle = DEFAULT_CYCLE,
    currency = DEFAULT_CURRENCY,
    coupon,
    planIDs = {},
    onClose,
    onSuccess,
    disablePlanSelection,
    disableCycleSelector: maybeDisableCycleSelector,
    disableThanksStep,
    defaultAudience = Audience.B2C,
    defaultSelectedProductPlans,
    ...rest
}: Props) => {
    const TITLE = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: c('Title').t`Network error`,
        [SUBSCRIPTION_STEPS.PLAN_SELECTION]: c('Title').t`Select a plan`,
        [SUBSCRIPTION_STEPS.CUSTOMIZATION]: c('Title').t`Customize your plan`,
        [SUBSCRIPTION_STEPS.CHECKOUT]: c('new_plans: title').t`Review subscription and pay`,
        [SUBSCRIPTION_STEPS.UPGRADE]: '',
        [SUBSCRIPTION_STEPS.THANKS]: '',
    };

    const topRef = useRef<HTMLDivElement>(null);
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [plans = []] = usePlans();
    const plansMap = toMap(plans, 'Name') as PlansMap;
    const [vpnServers] = useVPNServersCount();
    const [organization] = useOrganization();
    const getCalendars = useGetCalendars();

    const [loading, withLoading] = useLoading();
    const [loadingCheck, withLoadingCheck] = useLoading();
    const [loadingGift, withLoadingGift] = useLoading();
    const [checkResult, setCheckResult] = useState<SubscriptionCheckResponse>();
    const [audience, setAudience] = useState(defaultAudience);
    const [selectedProductPlans, setSelectedProductPlans] = useState(defaultSelectedProductPlans);
    const [model, setModel] = useState<Model>({
        step,
        cycle,
        currency,
        coupon,
        planIDs,
    });

    const { showProration } = useProration(model, subscription, plansMap, checkResult);

    const amountDue = checkResult?.AmountDue || 0;
    const couponCode = checkResult?.Coupon?.Code;
    const couponDescription = checkResult?.Coupon?.Description;
    const creditsRemaining = (user.Credit + (checkResult?.Credit ?? 0)) / 100;

    const subscriptionCouponCode = subscription?.CouponCode;
    const latestValidCouponCodeRef = useRef('');

    const handleUnsubscribe = async () => {
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
                const handleClose = () => {
                    onClose?.();
                    reject();
                };
                createModal(<CalendarDowngradeModal isDowngrade onConfirm={resolve} onClose={handleClose} />);
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

        await api(deleteSubscription());
        await call();
        onSuccess?.();
        onClose?.();
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

    const handleSubscribe = async (params = {}) => {
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
                    onClose?.();
                    reject();
                };
                createModal(<CalendarDowngradeModal onConfirm={resolve} onClose={handleClose} />);
            });
        }

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
            if (disableThanksStep) {
                onSuccess?.();
                onClose?.();
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
            setModel({ ...model, step: SUBSCRIPTION_STEPS.CHECKOUT });
            throw error;
        }
    };

    const { card, setCard, cardErrors, handleCardSubmit, method, setMethod, parameters, canPay, paypal, paypalCredit } =
        usePayment({
            amount: model.step === SUBSCRIPTION_STEPS.CHECKOUT ? amountDue : 0, // Define amount only in the payment step to generate payment tokens
            currency: checkResult?.Currency || DEFAULT_CURRENCY,
            onPay(params) {
                return withLoading(handleSubscribe(params));
            },
        });
    const creditCardTopRef = useRef<HTMLDivElement>(null);

    const check = async (newModel: Model = model, wantToApplyNewGiftCode: boolean = false): Promise<void> => {
        const copyNewModel = { ...newModel };

        if (copyNewModel.step === SUBSCRIPTION_STEPS.CUSTOMIZATION && !supportAddons(copyNewModel.planIDs)) {
            copyNewModel.step = SUBSCRIPTION_STEPS.CHECKOUT;
        }

        if (!hasPlanIDs(newModel.planIDs)) {
            setCheckResult(getFreeCheckResult(model.currency, model.cycle));
            setModel(copyNewModel);
            return;
        }

        try {
            const result = await api<SubscriptionCheckResponse>(
                checkSubscription({
                    Plans: newModel.planIDs,
                    Currency: newModel.currency,
                    Cycle: newModel.cycle,
                    Codes: getCodes(newModel),
                })
            );

            const { Gift = 0 } = result;
            const { Code = '' } = result.Coupon || {}; // Coupon can equal null

            if (wantToApplyNewGiftCode && newModel.gift?.toLowerCase() !== Code.toLowerCase() && !Gift) {
                createNotification({ text: c('Error').t`Invalid code`, type: 'error' });
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
        } catch (error: any) {
            if (error.name === 'OfflineError') {
                setModel({ ...model, step: SUBSCRIPTION_STEPS.NETWORK_ERROR });
            }
        }
    };

    const handleCheckout = async () => {
        const params = await handlePaymentToken({
            params: {
                Amount: amountDue,
                Currency: model.currency,
                ...parameters,
            },
            createModal,
            api,
        });

        return handleSubscribe(params);
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
        withLoadingCheck(check({ ...model, currency }));
    };

    const handleChangeCycle = (cycle: Cycle) => {
        if (loadingCheck || cycle === model.cycle) {
            return;
        }
        withLoadingCheck(check({ ...model, cycle }));
    };

    useEffect(() => {
        // Trigger once to initialise the check values
        void withLoadingCheck(check());
    }, []);

    const backStep =
        model.step === SUBSCRIPTION_STEPS.CHECKOUT && !supportAddons(model.planIDs)
            ? SUBSCRIPTION_STEPS.PLAN_SELECTION
            : BACK[model.step];
    const isFreePlanSelected = !hasPlanIDs(model.planIDs);
    const isFreeUserWithFreePlanSelected = user.isFree && isFreePlanSelected;

    const disableCycleSelector = isFreePlanSelected || maybeDisableCycleSelector || getIsCustomCycle(model.cycle);

    useEffect(() => {
        // Each time the user switch between steps, it takes the user to the top of the modal
        topRef.current?.scrollIntoView();
    }, [model.step]);

    return (
        <ModalTwo
            className={classnames([
                subscriptionModalClassName,
                [
                    SUBSCRIPTION_STEPS.PLAN_SELECTION,
                    SUBSCRIPTION_STEPS.CUSTOMIZATION,
                    SUBSCRIPTION_STEPS.CHECKOUT,
                ].includes(model.step) && 'subscription-modal--fixed-height',
                [SUBSCRIPTION_STEPS.PLAN_SELECTION].includes(model.step) && 'subscription-modal--large-width',
                [SUBSCRIPTION_STEPS.CUSTOMIZATION, SUBSCRIPTION_STEPS.CHECKOUT].includes(model.step) &&
                    'subscription-modal--medium-width',
            ])}
            onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (loadingCheck || loadingGift) {
                    return;
                }
                if (!handleCardSubmit()) {
                    creditCardTopRef.current?.scrollIntoView();
                    return;
                }
                withLoading(handleCheckout());
            }}
            onClose={onClose}
            {...rest}
            as="form"
            size="large"
        >
            <ModalTwoHeader title={TITLE[model.step]} />
            <ModalTwoContent>
                <div ref={topRef} />
                {model.step === SUBSCRIPTION_STEPS.NETWORK_ERROR && <GenericError />}
                {model.step === SUBSCRIPTION_STEPS.PLAN_SELECTION && (
                    <PlanSelection
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
                            withLoadingCheck(check({ ...model, planIDs, step: SUBSCRIPTION_STEPS.CUSTOMIZATION }))
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
                        <div className="flex-item-fluid on-mobile-w100 pr2 on-tablet-landscape-pr1 on-mobile-pr0 pt2">
                            <div className="max-w50e">
                                <PlanCustomization
                                    loading={loadingCheck}
                                    currency={model.currency}
                                    cycle={model.cycle}
                                    plansMap={plansMap}
                                    planIDs={model.planIDs}
                                    organization={organization}
                                    onChangePlanIDs={(planIDs) => setModel({ ...model, planIDs })}
                                />
                            </div>
                        </div>
                        <div className="subscriptionCheckout-column bg-weak on-mobile-w100 rounded">
                            <div className="subscriptionCheckout-container sticky-top">
                                <SubscriptionCheckout
                                    submit={
                                        <Button
                                            color="norm"
                                            loading={loading}
                                            onClick={() => {
                                                const run = async () => {
                                                    await check();
                                                    return setModel((old) => ({
                                                        ...old,
                                                        step: SUBSCRIPTION_STEPS.CHECKOUT,
                                                    }));
                                                };
                                                withLoading(run());
                                            }}
                                            fullWidth
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
                                    onChangeCurrency={handleChangeCurrency}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {model.step === SUBSCRIPTION_STEPS.CHECKOUT && (
                    <div className="subscriptionCheckout-top-container">
                        <div className="flex-item-fluid on-mobile-w100 pr2 on-tablet-landscape-pr1 on-mobile-pr0 pt2">
                            <div className="mlauto mrauto max-w37e subscriptionCheckout-options ">
                                {!disableCycleSelector && (
                                    <>
                                        <h2 className="text-2xl text-bold mb1">{c('Label').t`Subscription options`}</h2>
                                        <div className="mb2">
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
                                )}
                                {/* avoid mounting/unmounting the component which re-triggers the hook */}
                                <div className={amountDue ? undefined : 'hidden'}>
                                    <Payment
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
                                    />
                                </div>
                                <div className={amountDue || !checkResult ? 'hidden' : undefined}>
                                    <h2 className="text-2xl text-bold mb1">{c('Label').t`Payment details`}</h2>
                                    <div className="mb1">{c('Info').t`No payment is required at this time.`}</div>
                                    {checkResult?.Credit && creditsRemaining ? (
                                        <div className="mb1">{c('Info')
                                            .t`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`}</div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <div className="subscriptionCheckout-column bg-weak on-mobile-w100 rounded">
                            <div className="subscriptionCheckout-container sticky-top">
                                <SubscriptionCheckout
                                    submit={
                                        <SubscriptionSubmitButton
                                            currency={model.currency}
                                            onClose={onClose}
                                            paypal={paypal}
                                            step={model.step}
                                            loading={loading}
                                            method={method}
                                            checkResult={checkResult}
                                            className="w100"
                                            disabled={isFreeUserWithFreePlanSelected || !canPay}
                                        />
                                    }
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
                                                <div className="flex flex-align-items-center mb0-25">
                                                    <Icon name="gift" className="mr0-5 mb0-25" />
                                                    <Tooltip title={couponDescription}>
                                                        <code>{couponCode.toUpperCase()}</code>
                                                    </Tooltip>
                                                </div>
                                            )}
                                            <PaymentGiftCode
                                                key={
                                                    /* Reset the toggle state when a coupon code gets applied */
                                                    couponCode
                                                }
                                                giftCode={model.gift}
                                                onApply={handleGift}
                                                loading={loadingGift}
                                            />
                                        </>
                                    }
                                    onChangeCurrency={handleChangeCurrency}
                                    showProration={showProration}
                                    nextSubscriptionStart={subscription.PeriodEnd}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {model.step === SUBSCRIPTION_STEPS.UPGRADE && <SubscriptionThanks loading={true} method={method} />}
                {model.step === SUBSCRIPTION_STEPS.THANKS && (
                    <SubscriptionThanks
                        method={method}
                        onClose={() => {
                            onSuccess?.();
                            onClose?.();
                        }}
                    />
                )}
            </ModalTwoContent>
            {(disablePlanSelection && backStep === SUBSCRIPTION_STEPS.PLAN_SELECTION) ||
            backStep === undefined ? null : (
                <ModalTwoFooter>
                    <Button
                        onClick={() => {
                            setModel({ ...model, step: backStep });
                        }}
                    >{c('Action').t`Back`}</Button>
                </ModalTwoFooter>
            )}
        </ModalTwo>
    );
};

export default SubscriptionModal;
