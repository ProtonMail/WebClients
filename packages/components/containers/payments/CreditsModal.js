import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Label,
    FormModal,
    Row,
    Field,
    Alert,
    useNotifications,
    useEventManager,
    useConfig,
    useModals,
    useApi,
    useLoading
} from 'react-components';
import { buyCredit } from 'proton-shared/lib/api/payments';
import {
    DEFAULT_CURRENCY,
    DEFAULT_CREDITS_AMOUNT,
    CLIENT_TYPES,
    MIN_CREDIT_AMOUNT,
    PAYMENT_METHOD_TYPES
} from 'proton-shared/lib/constants';

import PaymentSelector from './PaymentSelector';
import Payment from './Payment';
import usePayment from './usePayment';
import { handlePaymentToken } from './paymentTokenHelper';
import PayPalButton from './PayPalButton';

const getCurrenciesI18N = () => ({
    EUR: c('Monetary unit').t`Euro`,
    CHF: c('Monetary unit').t`Swiss franc`,
    USD: c('Monetary unit').t`Dollar`
});

const { VPN } = CLIENT_TYPES;

const CreditsModal = (props) => {
    const api = useApi();
    const { CLIENT_TYPE } = useConfig();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_CREDITS_AMOUNT);
    const i18n = getCurrenciesI18N();
    const i18nCurrency = i18n[currency];

    const handleSubmit = async (params) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: amount, Currency: currency },
            api,
            createModal
        });
        await api(buyCredit(requestBody));
        await call();
        props.onClose();
        createNotification({ text: c('Success').t`Credits added` });
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount,
        currency,
        onPay: handleSubmit
    });
    const submit =
        amount >= MIN_CREDIT_AMOUNT ? (
            method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                <PayPalButton paypal={paypal} className="pm-button--primary" amount={amount}>{c('Action')
                    .t`Continue`}</PayPalButton>
            ) : canPay ? (
                c('Action').t`Top up`
            ) : null
        ) : null;

    return (
        <FormModal
            type="small"
            onSubmit={() => withLoading(handleSubmit(parameters))}
            loading={loading}
            submit={submit}
            close={c('Action').t`Close`}
            title={c('Title').t`Add credits`}
            {...props}
        >
            <Alert>{c('Info').t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</Alert>
            <Alert
                learnMore={
                    CLIENT_TYPE === VPN
                        ? 'https://protonvpn.com/support/vpn-credit-proration/'
                        : 'https://protonmail.com/support/knowledge-base/credit-proration/'
                }
            >{c('Info')
                .jt`Top up your account with credits that you can use to subscribe to a new plan or renew your current plan. You get one credit for every ${i18nCurrency} spent.`}</Alert>
            <Row>
                <Label>{c('Label').t`Amount`}</Label>
                <Field>
                    <PaymentSelector
                        amount={amount}
                        onChangeAmount={setAmount}
                        currency={currency}
                        onChangeCurrency={setCurrency}
                    />
                </Field>
            </Row>
            <Payment
                type="credit"
                method={method}
                amount={amount}
                currency={currency}
                card={card}
                onMethod={setMethod}
                onCard={setCard}
                errors={errors}
                paypal={paypal}
                paypalCredit={paypalCredit}
            />
        </FormModal>
    );
};

CreditsModal.propTypes = {
    onClose: PropTypes.func
};

export default CreditsModal;
