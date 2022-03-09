import { getCalendars } from '@proton/shared/lib/models/calendarsModel';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import { APP_NAMES, APPS, DEFAULT_CURRENCY, DEFAULT_CYCLE, PLANS } from '@proton/shared/lib/constants';
import { checkSubscription, deleteSubscription, subscribe } from '@proton/shared/lib/api/payments';
import { getPublicLinks } from '@proton/shared/lib/api/calendars';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import { hasPlanIDs, supportAddons } from '@proton/shared/lib/helpers/planIDs';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Audience, Currency, Cycle, PlanIDs, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { Calendar, CalendarUrlsResponse } from '@proton/shared/lib/interfaces/calendar';
import { MAX_CALENDARS_PER_FREE_USER } from '@proton/shared/lib/calendar/constants';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { unary } from '@proton/shared/lib/helpers/function';
import { getIsPersonalCalendar } from '@proton/shared/lib/calendar/subscribe/helpers';

import { Button, ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '../../../components';
import {
    useApi,
    useConfig,
    useEventManager,
    useLoading,
    useModals,
    useNotifications,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
} from '../../../hooks';
import { classnames } from '../../../helpers';
import LossLoyaltyModal from '../LossLoyaltyModal';
import GenericError from '../../error/GenericError';
import usePayment from '../usePayment';
import Payment from '../Payment';
import PlanSelection from './PlanSelection';
import { SUBSCRIPTION_STEPS } from './constants';
import SubscriptionSubmitButton from './SubscriptionSubmitButton';
import SubscriptionUpgrade from './SubscriptionUpgrade';
import SubscriptionThanks from './SubscriptionThanks';
import SubscriptionCheckout, { SubscriptionCheckoutLocal } from './SubscriptionCheckout';
import './SubscriptionModal.scss';
import { handlePaymentToken } from '../paymentTokenHelper';
import PlanCustomization from './PlanCustomization';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import SubscriptionCycleSelector from './SubscriptionCycleSelector';
import MemberDowngradeModal from '../MemberDowngradeModal';

interface Props extends Pick<ModalProps<'div'>, 'open' | 'onClose' | 'onExit'> {
    step?: SUBSCRIPTION_STEPS;
    cycle?: Cycle;
    currency?: Currency;
    planIDs?: PlanIDs;
    coupon?: string | null;
    disableBackButton?: boolean;
    defaultAudience?: Audience;
}

interface Model {
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

export const getDefaultSelectedProductPlans = (appName: APP_NAMES, planIDs: PlanIDs) => {
    const defaultB2CPlan = appName === APPS.PROTONVPN_SETTINGS ? PLANS.VPN : PLANS.MAIL;
    const matchingB2CPlan = [PLANS.MAIL, PLANS.VPN, PLANS.DRIVE].find((x) => planIDs[x]);
    const matchingB2BPlan = [PLANS.MAIL_PRO, PLANS.DRIVE_PRO].find((x) => planIDs[x]);
    const defaultB2BPlan = PLANS.MAIL_PRO;
    return {
        [Audience.B2C]: matchingB2CPlan || defaultB2CPlan,
        [Audience.B2B]: matchingB2BPlan || defaultB2BPlan,
    };
};

const SubscriptionModal = ({
    step = SUBSCRIPTION_STEPS.PLAN_SELECTION,
    cycle = DEFAULT_CYCLE,
    currency = DEFAULT_CURRENCY,
    coupon,
    planIDs = {},
    onClose,
    disableBackButton,
    defaultAudience = Audience.B2C,
    ...rest
}: Props) => {
    const TITLE = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: c('Title').t`Network error`,
        [SUBSCRIPTION_STEPS.PLAN_SELECTION]: c('Title').t`Select a plan`,
        [SUBSCRIPTION_STEPS.CUSTOMIZATION]: c('Title').t`Customize your plan`,
        [SUBSCRIPTION_STEPS.CHECKOUT]: c('Title').t`Select a billing cycle and pay`,
        [SUBSCRIPTION_STEPS.UPGRADE]: '',
        [SUBSCRIPTION_STEPS.THANKS]: '',
    };

    const topRef = useRef<HTMLDivElement>(null);
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { APP_NAME } = useConfig();
    const { createNotification } = useNotifications();
    const [plans = []] = usePlans();
    const [organization] = useOrganization();
    const [loading, withLoading] = useLoading();
    const [loadingCheck, withLoadingCheck] = useLoading();
    const [checkResult, setCheckResult] = useState<SubscriptionCheckResponse>();
    const { Code: couponCode } = checkResult?.Coupon || {}; // Coupon can be null
    const creditsRemaining = (user.Credit + (checkResult?.Credit ?? 0)) / 100;
    const [audience, setAudience] = useState(defaultAudience);
    const [selectedProductPlans, setSelectedProductPlans] = useState(() => {
        return getDefaultSelectedProductPlans(APP_NAME, planIDs);
    });
    const [model, setModel] = useState<Model>({
        step,
        cycle,
        currency,
        coupon,
        planIDs,
    });

    const getCodes = ({ gift, coupon }: Model) => [gift, coupon].filter(isTruthy);

    const handleUnsubscribe = async () => {
        const calendars: Calendar[] = await getCalendars(api);
        const personalCalendars = calendars.filter(unary(getIsPersonalCalendar));
        const hasLinks = !!(
            await Promise.all(
                personalCalendars.map((calendar) => api<CalendarUrlsResponse>(getPublicLinks(calendar.ID)))
            )
        ).flatMap(({ CalendarUrls }) => CalendarUrls).length;

        if (personalCalendars.length > MAX_CALENDARS_PER_FREE_USER || hasLinks) {
            await new Promise<void>((resolve, reject) => {
                const handleClose = () => {
                    onClose?.();
                    reject();
                };
                createModal(<CalendarDowngradeModal onConfirm={resolve} onClose={handleClose} />);
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
        onClose?.();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handleSubscribe = async (params = {}) => {
        if (!hasPlanIDs(model.planIDs)) {
            return handleUnsubscribe();
        }

        try {
            setModel({ ...model, step: SUBSCRIPTION_STEPS.UPGRADE });
            await api(
                subscribe({
                    Plans: model.planIDs,
                    Codes: getCodes(model),
                    Cycle: model.cycle,
                    ...params, // Contains Payment, Amount and Currency
                })
            );
            await call();
            setModel({ ...model, step: SUBSCRIPTION_STEPS.THANKS });
        } catch (error: any) {
            const { Code = 0 } = error.data || {};

            if (Code === API_CUSTOM_ERROR_CODES.PAYMENTS_SUBSCRIPTION_AMOUNT_MISMATCH) {
                await check(); // eslint-disable-line @typescript-eslint/no-use-before-define
                createNotification({ text: c('Error').t`Checkout expired, please try again`, type: 'error' });
            }
            setModel({ ...model, step: SUBSCRIPTION_STEPS.CHECKOUT });
            throw error;
        }
    };

    const { card, setCard, cardErrors, handleCardSubmit, method, setMethod, parameters, canPay, paypal, paypalCredit } =
        usePayment({
            amount: model.step === SUBSCRIPTION_STEPS.CHECKOUT ? checkResult?.AmountDue || 0 : 0, // Define amount only in the payment step to generate payment tokens
            currency: checkResult?.Currency || DEFAULT_CURRENCY,
            onPay(params) {
                return withLoading(handleSubscribe(params));
            },
        });

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

            copyNewModel.coupon = Code;

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
                Amount: checkResult?.AmountDue || 0,
                Currency: model.currency,
                ...parameters,
            },
            createModal,
            api,
        });

        return handleSubscribe(params);
    };

    const handleGift = (gift = '') => {
        if (!gift) {
            const withoutGift = { ...model };
            delete withoutGift.gift;
            return withLoadingCheck(check(withoutGift));
        }
        void withLoadingCheck(check({ ...model, gift }, true));
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

    useEffect(() => {
        // Each time the user switch between steps, it takes the user to the top of the modal
        topRef.current?.scrollIntoView();
    }, [model.step]);

    return (
        <ModalTwo
            className={classnames([
                'subscription-modal',
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
                if (!handleCardSubmit()) {
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
                    />
                )}
                {model.step === SUBSCRIPTION_STEPS.CUSTOMIZATION && (
                    <div className="flex-no-min-children on-mobile-flex-column">
                        <div className="flex-item-fluid on-mobile-w100 on-tablet-landscape-pr1 on-mobile-pr0 pt2">
                            <div className="ax-w50e">
                                <PlanCustomization
                                    plans={plans}
                                    loading={loadingCheck}
                                    currency={model.currency}
                                    cycle={model.cycle}
                                    planIDs={model.planIDs}
                                    organization={organization}
                                    onChangePlanIDs={(planIDs) => setModel({ ...model, planIDs })}
                                />
                            </div>
                        </div>
                        <div className="subscriptionCheckout-column bg-weak on-mobile-w100 rounded">
                            <div className="subscriptionCheckout-container">
                                <SubscriptionCheckoutLocal
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
                                            {c('Action').t`Continue`}
                                        </Button>
                                    }
                                    plans={plans}
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
                    <div className="flex-no-min-children on-mobile-flex-column">
                        <div className="flex-item-fluid on-mobile-w100 on-tablet-landscape-pr1 on-mobile-pr0 pt2">
                            <div className="mlauto mrauto max-w37e on-mobile-max-w100  ">
                                {!isFreePlanSelected && (
                                    <>
                                        <h2 className="text-2xl text-bold mb1">{c('Label').t`Billing cycle`}</h2>
                                        <div className="mb2">
                                            <SubscriptionCycleSelector
                                                plans={plans}
                                                planIDs={model.planIDs}
                                                cycle={model.cycle}
                                                currency={model.currency}
                                                onChangeCycle={handleChangeCycle}
                                                disabled={loadingCheck}
                                            />
                                        </div>
                                    </>
                                )}
                                {checkResult?.AmountDue ? (
                                    <Payment
                                        type="subscription"
                                        paypal={paypal}
                                        paypalCredit={paypalCredit}
                                        method={method}
                                        amount={checkResult.AmountDue}
                                        currency={checkResult.Currency}
                                        coupon={couponCode}
                                        card={card}
                                        onMethod={setMethod}
                                        onCard={setCard}
                                        cardErrors={cardErrors}
                                    />
                                ) : (
                                    <>
                                        <h2 className="text-2xl text-bold mb1">{c('Label').t`Payment details`}</h2>
                                        <div className="mb1">{c('Info').t`No payment is required at this time.`}</div>
                                        {checkResult?.Credit && creditsRemaining ? (
                                            <div className="mb1">{c('Info')
                                                .t`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`}</div>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="subscriptionCheckout-column bg-weak on-mobile-w100 rounded">
                            <div className="subscriptionCheckout-container">
                                <SubscriptionCheckout
                                    submit={
                                        <SubscriptionSubmitButton
                                            onClose={onClose}
                                            canPay={canPay}
                                            paypal={paypal}
                                            step={model.step}
                                            loading={loadingCheck || loading}
                                            method={method}
                                            checkResult={checkResult}
                                            className="w100"
                                            disabled={isFreeUserWithFreePlanSelected}
                                        />
                                    }
                                    plans={plans}
                                    checkResult={checkResult}
                                    loading={loadingCheck}
                                    currency={model.currency}
                                    cycle={model.cycle}
                                    planIDs={model.planIDs}
                                    gift={model.gift}
                                    coupon={model.coupon}
                                    onChangeCurrency={handleChangeCurrency}
                                    onChangeGift={handleGift}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {model.step === SUBSCRIPTION_STEPS.UPGRADE && (
                    <div className="text-center">
                        <SubscriptionUpgrade />
                    </div>
                )}
                {model.step === SUBSCRIPTION_STEPS.THANKS && <SubscriptionThanks method={method} onClose={onClose} />}
            </ModalTwoContent>
            {disableBackButton || backStep === undefined ? null : (
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
