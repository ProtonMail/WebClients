import { getCalendars } from '@proton/shared/lib/models/calendarsModel';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { c } from 'ttag';
import { APPS, DEFAULT_CURRENCY, DEFAULT_CYCLE, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { checkSubscription, deleteSubscription, subscribe } from '@proton/shared/lib/api/payments';
import { getPublicLinks } from '@proton/shared/lib/api/calendars';
import { hasBonuses } from '@proton/shared/lib/helpers/organization';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Currency, Cycle, PlanIDs, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { Calendar, CalendarUrlsResponse } from '@proton/shared/lib/interfaces/calendar';
import { MAX_CALENDARS_PER_FREE_USER } from '@proton/shared/lib/calendar/constants';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
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
    useVPNCountriesCount,
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
import SubscriptionCheckout from './SubscriptionCheckout';
import './SubscriptionModal.scss';
import { handlePaymentToken } from '../paymentTokenHelper';
import PlanCustomization from './PlanCustomization';
import CalendarDowngradeModal from './CalendarDowngradeModal';
import MemberDowngradeModal from '../MemberDowngradeModal';

interface Props extends Pick<ModalProps<'div'>, 'open' | 'onClose' | 'onExit'> {
    step?: SUBSCRIPTION_STEPS;
    cycle?: Cycle;
    currency?: Currency;
    planIDs?: PlanIDs;
    coupon?: string | null;
    disableBackButton?: boolean;
}

interface Model {
    step: SUBSCRIPTION_STEPS;
    service: PLAN_SERVICES;
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

const SubscriptionModal = ({
    step = SUBSCRIPTION_STEPS.PLAN_SELECTION,
    cycle = DEFAULT_CYCLE,
    currency = DEFAULT_CURRENCY,
    coupon,
    planIDs = {},
    onClose,
    disableBackButton,
    ...rest
}: Props) => {
    const TITLE = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: c('Title').t`Network error`,
        [SUBSCRIPTION_STEPS.PLAN_SELECTION]: c('Title').t`Select a plan`,
        [SUBSCRIPTION_STEPS.CUSTOMIZATION]: c('Title').t`Customize your plan`,
        [SUBSCRIPTION_STEPS.CHECKOUT]: c('Title').t`Checkout`,
        [SUBSCRIPTION_STEPS.UPGRADE]: '',
        [SUBSCRIPTION_STEPS.THANKS]: '',
    };

    const topRef = useRef<HTMLDivElement>(null);
    const api = useApi();
    const { APP_NAME } = useConfig();
    const app = getAppFromPathnameSafe(window.location.pathname);
    const isVpnApp = APP_NAME === APPS.PROTONVPN_SETTINGS || app === APPS.PROTONVPN_SETTINGS;
    const [user] = useUser();
    const [vpnCountries] = useVPNCountriesCount();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [subscription] = useSubscription();
    const [plans = []] = usePlans();
    const [organization] = useOrganization();
    const [loading, withLoading] = useLoading();
    const [loadingCheck, withLoadingCheck] = useLoading();
    const [checkResult, setCheckResult] = useState<SubscriptionCheckResponse>();
    const { Code: couponCode } = checkResult?.Coupon || {}; // Coupon can be null
    const creditsRemaining = (user.Credit + (checkResult?.Credit ?? 0)) / 100;
    const currentService = isVpnApp ? PLAN_SERVICES.VPN : PLAN_SERVICES.MAIL;
    const [model, setModel] = useState<Model>({
        service: currentService,
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
                createModal(<CalendarDowngradeModal onSubmit={resolve} onClose={handleClose} />);
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
                    PlanIDs: model.planIDs,
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

        if (!hasPlanIDs(newModel.planIDs)) {
            setCheckResult(getFreeCheckResult(model.currency, model.cycle));
            setModel(copyNewModel);
            return;
        }

        try {
            const result = await api<SubscriptionCheckResponse>(
                checkSubscription({
                    PlanIDs: newModel.planIDs,
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

            setModel(copyNewModel);
            setCheckResult(result);
        } catch (error: any) {
            if (error.name === 'OfflineError') {
                setModel({ ...model, step: SUBSCRIPTION_STEPS.NETWORK_ERROR });
            }
        }
    };

    const handleCheckout = async () => {
        if (model.step === SUBSCRIPTION_STEPS.CUSTOMIZATION) {
            return setModel({ ...model, step: SUBSCRIPTION_STEPS.CHECKOUT });
        }

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

    useEffect(() => {
        void withLoadingCheck(check());
    }, [model.cycle, model.currency]);

    const backStep = BACK[model.step];
    const isFreeUserWithFreePlanSelected = user.isFree && !Object.keys(model.planIDs).length;

    const submitButton = (
        <SubscriptionSubmitButton
            onClose={onClose}
            canPay={canPay}
            paypal={paypal}
            step={model.step}
            loading={loadingCheck || loading}
            method={method}
            checkResult={checkResult}
            className="w100"
            disabled={isFreeUserWithFreePlanSelected || !checkResult}
        />
    );

    const subscriptionCheckout = (
        <div className="subscriptionCheckout-column on-mobile-w100 ml2 on-mobile-ml0">
            <div className="subscriptionCheckout-container bg-weak rounded">
                <SubscriptionCheckout
                    submit={submitButton}
                    plans={plans}
                    service={currentService}
                    checkResult={checkResult}
                    loading={loadingCheck}
                    currency={model.currency}
                    cycle={model.cycle}
                    planIDs={model.planIDs}
                    gift={model.gift}
                    coupon={model.coupon}
                    onChangeCurrency={(currency) => setModel({ ...model, currency })}
                    onChangeCycle={(cycle) => setModel({ ...model, cycle })}
                    onChangeGift={handleGift}
                />
            </div>
        </div>
    );

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
                        organization={organization}
                        subscription={subscription}
                        vpnCountries={vpnCountries}
                        service={model.service}
                        onChangePlanIDs={(planIDs) =>
                            withLoadingCheck(check({ ...model, planIDs, step: SUBSCRIPTION_STEPS.CUSTOMIZATION }))
                        }
                        onChangeCurrency={(currency) => setModel({ ...model, currency })}
                        onChangeCycle={(cycle) => setModel({ ...model, cycle })}
                    />
                )}
                {model.step === SUBSCRIPTION_STEPS.CUSTOMIZATION && (
                    <div className="flex flex-no-min-children on-mobile-flex-column">
                        <div className="flex-item-fluid on-mobile-w100 on-tablet-landscape-pr1 on-mobile-pr0 pt2">
                            <div className="max-w50e">
                                <PlanCustomization
                                    plans={plans}
                                    loading={loadingCheck}
                                    currency={model.currency}
                                    cycle={model.cycle}
                                    planIDs={model.planIDs}
                                    subscription={subscription}
                                    organization={organization}
                                    service={currentService}
                                    onChangePlanIDs={(planIDs) => withLoadingCheck(check({ ...model, planIDs }))}
                                    onChangeCycle={(cycle) => setModel({ ...model, cycle })}
                                />
                            </div>
                        </div>
                        {subscriptionCheckout}
                    </div>
                )}
                {model.step === SUBSCRIPTION_STEPS.CHECKOUT && (
                    <div className="flex-no-min-children on-mobile-flex-column">
                        <div className="flex-item-fluid on-mobile-w100 on-tablet-landscape-pr1 on-mobile-pr0 pt2">
                            <div className="mlauto mrauto max-w37e on-mobile-max-w100  ">
                                {checkResult?.AmountDue ? (
                                    <>
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
                                    </>
                                ) : (
                                    <>
                                        <div className="mb1">{c('Info').t`No payment is required at this time.`}</div>
                                        {checkResult?.Credit && creditsRemaining ? (
                                            <div className="mb1">{c('Info')
                                                .t`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`}</div>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        </div>
                        {subscriptionCheckout}
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
