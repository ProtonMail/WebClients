import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE, CYCLE, CURRENCIES, PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { checkSubscription, subscribe, deleteSubscription } from 'proton-shared/lib/api/payments';
import { hasBonuses } from 'proton-shared/lib/helpers/organization';
import { clearPlanIDs, getPlanIDs } from 'proton-shared/lib/helpers/subscription';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { Alert, FormModal } from '../../../components';
import {
    usePlans,
    useApi,
    useLoading,
    useVPNCountries,
    useEventManager,
    useUser,
    useNotifications,
    useOrganization,
    useSubscription,
    useModals,
} from '../../../hooks';

import { classnames } from '../../../helpers';
import LossLoyaltyModal from '../LossLoyaltyModal';
import GenericError from '../../error/GenericError';
import usePayment from '../usePayment';
import Payment from '../Payment';

import { SUBSCRIPTION_STEPS } from './constants';
import NewSubscriptionSubmitButton from './NewSubscriptionSubmitButton';
import SubscriptionCustomization from './SubscriptionCustomization';
import SubscriptionUpgrade from './SubscriptionUpgrade';
import SubscriptionThanks from './SubscriptionThanks';
import SubscriptionCheckout from './SubscriptionCheckout';
import NewSubscriptionModalFooter from './NewSubscriptionModalFooter';
import PaymentGiftCode from '../PaymentGiftCode';

import './NewSubscriptionModal.scss';
import { handlePaymentToken } from '../paymentTokenHelper';

const hasPlans = (planIDs = {}) => Object.keys(clearPlanIDs(planIDs)).length;

/** @type any */
const NewSubscriptionModal = ({
    expanded = false,
    step: initialStep = SUBSCRIPTION_STEPS.CUSTOMIZATION,
    cycle = DEFAULT_CYCLE,
    currency = DEFAULT_CURRENCY,
    coupon,
    planIDs = {},
    onClose,
    ...rest
}) => {
    const TITLE = {
        [SUBSCRIPTION_STEPS.NETWORK_ERROR]: c('Title').t`Network error`,
        [SUBSCRIPTION_STEPS.CUSTOMIZATION]: c('Title').t`Plan customization`,
        [SUBSCRIPTION_STEPS.PAYMENT]: c('Title').t`Checkout`,
        [SUBSCRIPTION_STEPS.UPGRADE]: <div className="aligncenter">{c('Title').t`Processing...`}</div>,
        [SUBSCRIPTION_STEPS.THANKS]: <div className="aligncenter">{c('Title').t`Thank you!`}</div>,
    };

    const api = useApi();
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [vpnCountries, loadingVpnCountries] = useVPNCountries();
    const [plans, loadingPlans] = usePlans();
    const [organization, loadingOrganization] = useOrganization();
    const [loading, withLoading] = useLoading();
    const [loadingCheck, withLoadingCheck] = useLoading();
    const [checkResult, setCheckResult] = useState({});
    const { Credit = 0 } = checkResult;
    const { Code: couponCode } = checkResult.Coupon || {}; // Coupon can be null
    const creditsRemaining = (user.Credit + Credit) / 100;
    const [model, setModel] = useState({
        cycle,
        currency,
        coupon,
        planIDs,
    });
    const [step, setStep] = useState(initialStep);

    const TOTAL_ZERO = {
        Amount: 0,
        AmountDue: 0,
        CouponDiscount: 0,
        Currency: model.currency,
        Cycle: model.cycle,
        Proration: 0,
        Gift: 0,
        Credit: 0,
    };

    const getCodes = ({ gift, coupon }) => [gift, coupon].filter(isTruthy);

    const handleUnsubscribe = async () => {
        if (hasBonuses(organization)) {
            await new Promise((resolve, reject) => {
                createModal(<LossLoyaltyModal organization={organization} onConfirm={resolve} onClose={reject} />);
            });
        }
        await api(deleteSubscription());
        await call();
        onClose();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handleSubscribe = async (params = {}) => {
        if (!hasPlans(model.planIDs)) {
            return handleUnsubscribe();
        }

        try {
            setStep(SUBSCRIPTION_STEPS.UPGRADE);
            await api(
                subscribe({
                    PlanIDs: clearPlanIDs(model.planIDs),
                    Codes: getCodes(model),
                    Cycle: model.cycle,
                    ...params, // Contains Payment, Amount and Currency
                })
            );
            await call();
            setStep(SUBSCRIPTION_STEPS.THANKS);
        } catch (error) {
            const { Code = 0 } = error.data || {};

            if (Code === API_CUSTOM_ERROR_CODES.PAYMENTS_SUBSCRIPTION_AMOUNT_MISMATCH) {
                await check(); // eslint-disable-line @typescript-eslint/no-use-before-define
                createNotification({ text: c('Error').t`Checkout expired, please try again.`, type: 'error' });
            }
            setStep(SUBSCRIPTION_STEPS.PAYMENT);
            throw error;
        }
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount: step === SUBSCRIPTION_STEPS.PAYMENT ? checkResult.AmountDue : 0, // Define amount only in the payment step to generate payment tokens
        currency: checkResult.Currency,
        onPay(params) {
            return withLoading(handleSubscribe(params));
        },
    });

    const check = async (newModel = model, wantToApplyNewGiftCode = false) => {
        if (!hasPlans(newModel.planIDs)) {
            setCheckResult(TOTAL_ZERO);
            return;
        }

        try {
            const result = await api(
                checkSubscription({
                    PlanIDs: clearPlanIDs(newModel.planIDs),
                    Currency: newModel.currency,
                    Cycle: newModel.cycle,
                    Codes: getCodes(newModel),
                })
            );

            const { Gift = 0 } = result;
            const { Code = '' } = result.Coupon || {}; // Coupon can equal null
            const copyNewModel = { ...newModel };

            if (wantToApplyNewGiftCode && newModel.gift !== Code && !Gift) {
                createNotification({ text: c('Error').t`Invalid code`, type: 'error' });
            }

            copyNewModel.coupon = Code;

            if (!Gift) {
                delete copyNewModel.gift;
            }

            setModel(copyNewModel);
            setCheckResult(result);
        } catch (error) {
            if (error.name === 'OfflineError') {
                setStep(SUBSCRIPTION_STEPS.NETWORK_ERROR);
            }
            if (step === SUBSCRIPTION_STEPS.CUSTOMIZATION) {
                if (newModel.gift && newModel.gift !== model.gift) {
                    return check({ ...model });
                }
                return check({
                    ...model,
                    planIDs: getPlanIDs(subscription),
                });
            }
        }
    };

    const handleCheckout = async () => {
        if (step === SUBSCRIPTION_STEPS.CUSTOMIZATION) {
            return setStep(SUBSCRIPTION_STEPS.PAYMENT);
        }

        const params = await handlePaymentToken({
            params: {
                Amount: checkResult.AmountDue,
                Currency: model.currency,
                ...parameters,
            },
            createModal,
            api,
        });

        return handleSubscribe(params);
    };

    const handleClose = (e) => {
        if (step === SUBSCRIPTION_STEPS.PAYMENT) {
            setStep(SUBSCRIPTION_STEPS.CUSTOMIZATION);
            return;
        }

        onClose(e);
    };

    const handleGift = (gift = '') => {
        if (!gift) {
            const withoutGift = { ...model };
            delete withoutGift.gift;
            return withLoadingCheck(check(withoutGift));
        }
        withLoadingCheck(check({ ...model, gift }, true));
    };

    useEffect(() => {
        withLoadingCheck(check());
    }, [model.cycle, model.currency, model.planIDs]);

    return (
        <FormModal
            hasClose={step === SUBSCRIPTION_STEPS.CUSTOMIZATION}
            footer={
                [SUBSCRIPTION_STEPS.UPGRADE, SUBSCRIPTION_STEPS.THANKS].includes(step) ? null : (
                    <NewSubscriptionModalFooter
                        onClose={handleClose}
                        submit={
                            <NewSubscriptionSubmitButton
                                onClose={onClose}
                                canPay={canPay}
                                paypal={paypal}
                                step={step}
                                loading={loadingCheck || loading}
                                method={method}
                                checkResult={checkResult}
                                className="flex-item-noshrink"
                            />
                        }
                        plans={plans}
                        step={step}
                        model={model}
                        method={method}
                    />
                )
            }
            className={classnames([
                'subscription-modal',
                [SUBSCRIPTION_STEPS.CUSTOMIZATION, SUBSCRIPTION_STEPS.PAYMENT].includes(step) && 'pm-modal--full',
                user.isFree && 'is-free-user',
            ])}
            title={TITLE[step]}
            loading={loading || loadingPlans || loadingVpnCountries || loadingOrganization || loadingSubscription}
            onSubmit={() => withLoading(handleCheckout())}
            onClose={handleClose}
            {...rest}
        >
            {step === SUBSCRIPTION_STEPS.NETWORK_ERROR && <GenericError />}
            {step === SUBSCRIPTION_STEPS.CUSTOMIZATION && (
                <div className="flex flex-spacebetween onmobile-flex-column">
                    <div className="w75 onmobile-w100 pr4 ontablet-landscape-pr1 onmobile-pr0">
                        <SubscriptionCustomization
                            organization={organization}
                            vpnCountries={vpnCountries}
                            loading={loadingCheck}
                            plans={plans}
                            expanded={expanded}
                            model={model}
                            setModel={setModel}
                        />
                    </div>
                    <div className="w25 onmobile-w100">
                        <div className="subscriptionCheckout-container">
                            <SubscriptionCheckout
                                submit={
                                    <NewSubscriptionSubmitButton
                                        onClose={onClose}
                                        canPay={canPay}
                                        paypal={paypal}
                                        step={step}
                                        loading={loadingCheck || loading}
                                        method={method}
                                        checkResult={checkResult}
                                        className="w100"
                                    />
                                }
                                plans={plans}
                                checkResult={checkResult}
                                loading={loadingCheck}
                                onCheckout={() => withLoading(handleCheckout())}
                                model={model}
                                setModel={setModel}
                            />
                            <PaymentGiftCode gift={model.gift} onApply={handleGift} loading={loadingCheck} />
                        </div>
                    </div>
                </div>
            )}
            {step === SUBSCRIPTION_STEPS.PAYMENT && (
                <div className="flex flex-spacebetween onmobile-flex-column">
                    <div className="w75 onmobile-w100 ontablet-landscape-pr1 pr4 onmobile-pr0">
                        <h3>{c('Title').t`Payment method`}</h3>
                        {checkResult.AmountDue ? (
                            <>
                                <Alert>{c('Info')
                                    .t`You can use any of your saved payment method or add a new one. Please note that depending on the total amount due, some payment options may not be available.`}</Alert>
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
                                    errors={errors}
                                />
                                {[PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method) ? (
                                    <Alert type="warning">{c('Warning')
                                        .t`Please note that by choosing this payment method, your account cannot be upgraded immediately. We will update your account once the payment is cleared.`}</Alert>
                                ) : null}
                            </>
                        ) : (
                            <>
                                <Alert>{c('Info').t`No payment is required at this time.`}</Alert>
                                {Credit && creditsRemaining ? (
                                    <Alert>{c('Info')
                                        .t`Please note that upon clicking the Confirm button, your account will have ${creditsRemaining} credits remaining.`}</Alert>
                                ) : null}
                            </>
                        )}
                    </div>
                    <div className="w25 onmobile-w100">
                        <SubscriptionCheckout
                            method={method}
                            submit={
                                <NewSubscriptionSubmitButton
                                    onClose={onClose}
                                    canPay={canPay}
                                    paypal={paypal}
                                    step={step}
                                    loading={loadingCheck || loading}
                                    method={method}
                                    checkResult={checkResult}
                                    className="w100"
                                />
                            }
                            plans={plans}
                            checkResult={checkResult}
                            loading={loadingCheck}
                            onCheckout={() => withLoading(handleCheckout())}
                            model={model}
                            setModel={setModel}
                        />
                        {checkResult.Amount ? (
                            <PaymentGiftCode gift={model.gift} onApply={handleGift} loading={loadingCheck} />
                        ) : null}
                    </div>
                </div>
            )}
            {step === SUBSCRIPTION_STEPS.UPGRADE && (
                <div className="aligncenter">
                    <SubscriptionUpgrade />
                </div>
            )}
            {step === SUBSCRIPTION_STEPS.THANKS && <SubscriptionThanks method={method} onClose={onClose} />}
        </FormModal>
    );
};

NewSubscriptionModal.propTypes = {
    expanded: PropTypes.bool,
    step: PropTypes.oneOf([
        SUBSCRIPTION_STEPS.CUSTOMIZATION,
        SUBSCRIPTION_STEPS.PAYMENT,
        SUBSCRIPTION_STEPS.UPGRADE,
        SUBSCRIPTION_STEPS.THANKS,
    ]),
    cycle: PropTypes.oneOf([CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]),
    currency: PropTypes.oneOf(CURRENCIES),
    coupon: PropTypes.string,
    planIDs: PropTypes.object,
    onClose: PropTypes.func,
};

export default NewSubscriptionModal;
