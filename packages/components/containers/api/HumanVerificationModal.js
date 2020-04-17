import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    FormModal,
    Alert,
    Row,
    Label,
    PrimaryButton,
    Payment,
    PaymentInfo,
    usePayment,
    useNotifications,
    useApi,
    PaymentSelector,
    useLoading
} from 'react-components';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import {
    DEFAULT_CURRENCY,
    DEFAULT_DONATION_AMOUNT,
    MIN_DONATION_AMOUNT,
    PAYMENT_METHOD_TYPES,
    MAX_PAYPAL_AMOUNT
} from 'proton-shared/lib/constants';
import { verifyPayment } from 'proton-shared/lib/api/payments';
import { c } from 'ttag';

import Captcha from './Captcha';
import HumanVerificationLabel from './HumanVerificationLabel';
import CodeVerification from './CodeVerification';
import RequestInvite from './RequestInvite';
import PayPalButton from '../payments/PayPalButton';

import './HumanVerificationModal.scss';

const getLabel = (method) =>
    ({
        captcha: c('Human verification method').t`CAPTCHA`,
        payment: c('Human verification method').t`Donation`,
        sms: c('Human verification method').t`SMS`,
        email: c('Human verification method').t`Email`,
        invite: c('Human verification method').t`Manual verification`
    }[method]);

const PREFERED_ORDER = {
    captcha: 0,
    email: 1,
    sms: 2,
    payment: 3,
    invite: 4
};

const orderMethods = (methods = []) => {
    const mapped = methods.map((item, index) => ({ index, item }));
    mapped.sort((a, b) => {
        if (PREFERED_ORDER[a.item] > PREFERED_ORDER[b.item]) {
            return 1;
        }
        if (PREFERED_ORDER[a.item] < PREFERED_ORDER[b.item]) {
            return -1;
        }
        return 0;
    });
    return mapped.map(({ index }) => methods[index]);
};

const HumanVerificationModal = ({ token, methods = [], onSuccess, onVerify, ...rest }) => {
    const title = c('Title').t`Human verification`;
    const [method, setMethod] = useState();
    const orderedMethods = orderMethods(methods).filter((m) =>
        ['captcha', 'sms', 'email', 'invite', 'payment'].includes(m)
    );
    const { createNotification } = useNotifications();
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_DONATION_AMOUNT);

    const handleSubmit = async (token) => {
        try {
            await onVerify({ token, tokenType: method });
            createNotification({ text: c('Success').t`Verification successful` });
            rest.onClose();
            onSuccess();
        } catch (error) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                createNotification({ text: c('Error').t`Invalid verification code`, type: 'error' });
            }

            throw error;
        }
    };

    const handleSubmitPayment = async (parameters) => {
        const data = await api(
            verifyPayment({
                ...parameters,
                Currency: currency,
                Amount: amount
            })
        );
        handleSubmit(data);
    };

    const {
        card,
        setCard,
        errors,
        method: paymentMethod,
        setMethod: setPaymentMethod,
        parameters,
        canPay,
        paypal,
        paypalCredit
    } = usePayment({
        amount,
        currency,
        onPay(params) {
            return withLoading(handleSubmitPayment(params));
        }
    });

    useEffect(() => {
        if (orderedMethods.length) {
            setMethod(orderedMethods[0]);
        }
    }, []);

    const submit =
        amount >= MIN_DONATION_AMOUNT && method === 'payment' ? (
            paymentMethod === PAYMENT_METHOD_TYPES.PAYPAL ? (
                <PayPalButton paypal={paypal} className="pm-button--primary" amount={amount}>{c('Action')
                    .t`Continue`}</PayPalButton>
            ) : canPay ? (
                <PrimaryButton type="submit">{c('Action').t`Donate`}</PrimaryButton>
            ) : null
        ) : null;

    return (
        <FormModal
            className="human-verification-modal pm-modal--heightAuto"
            hasClose={false}
            title={title}
            loading={loading}
            onSubmit={() => {
                if (method !== 'payment') {
                    return;
                }
                if (paymentMethod === PAYMENT_METHOD_TYPES.PAYPAL) {
                    return;
                }
                return withLoading(handleSubmitPayment(parameters));
            }}
            footer={submit}
            {...rest}
        >
            <Alert type="warning">{c('Info').t`For security reasons, please verify that you are not a robot.`}</Alert>
            {orderedMethods.length ? (
                <Row>
                    <Label>
                        {orderedMethods.map((m) => {
                            return (
                                <HumanVerificationLabel
                                    value={m}
                                    key={m}
                                    methods={orderedMethods}
                                    method={method}
                                    onChange={setMethod}
                                >
                                    {getLabel(m)}
                                </HumanVerificationLabel>
                            );
                        })}
                    </Label>
                    <div className="w100">
                        {method === 'captcha' ? (
                            <div className="w33r">
                                <Captcha token={token} onSubmit={handleSubmit} />
                            </div>
                        ) : null}
                        {method === 'email' ? <CodeVerification onSubmit={handleSubmit} method="email" /> : null}
                        {method === 'sms' ? <CodeVerification onSubmit={handleSubmit} method="sms" /> : null}
                        {method === 'payment' ? (
                            <>
                                <PaymentInfo method={method} />
                                <label className="mb0-5 bl">{c('Label').t`Select an amount`}</label>
                                <PaymentSelector
                                    amount={amount}
                                    onChangeAmount={setAmount}
                                    currency={currency}
                                    onChangeCurrency={setCurrency}
                                    maxAmount={MAX_PAYPAL_AMOUNT}
                                />
                            </>
                        ) : null}
                        {method === 'invite' ? <RequestInvite /> : null}
                    </div>
                </Row>
            ) : null}
            {method === 'payment' ? (
                <Payment
                    type="human-verification"
                    method={paymentMethod}
                    amount={amount}
                    currency={currency}
                    card={card}
                    onMethod={setPaymentMethod}
                    onCard={setCard}
                    errors={errors}
                    paypal={paypal}
                    paypalCredit={paypalCredit}
                />
            ) : null}
        </FormModal>
    );
};

HumanVerificationModal.propTypes = {
    token: PropTypes.string,
    methods: PropTypes.arrayOf(PropTypes.oneOf(['captcha', 'sms', 'email', 'invite', 'payment', 'coupon'])).isRequired,
    onSuccess: PropTypes.func.isRequired,
    onVerify: PropTypes.func.isRequired
};

export default HumanVerificationModal;
