import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { buyCredit } from 'proton-shared/lib/api/payments';
import {
    APPS,
    DEFAULT_CURRENCY,
    DEFAULT_CREDITS_AMOUNT,
    MIN_CREDIT_AMOUNT,
    PAYMENT_METHOD_TYPES,
} from 'proton-shared/lib/constants';
import { FormModal, PrimaryButton, Alert, useDebounceInput } from '../../components';
import { useNotifications, useEventManager, useConfig, useModals, useApi, useLoading } from '../../hooks';

import AmountRow from './AmountRow';
import PaymentInfo from './PaymentInfo';
import Payment from './Payment';
import usePayment from './usePayment';
import { handlePaymentToken } from './paymentTokenHelper';
import PayPalButton from './PayPalButton';

const getCurrenciesI18N = () => ({
    EUR: c('Monetary unit').t`Euro`,
    CHF: c('Monetary unit').t`Swiss franc`,
    USD: c('Monetary unit').t`Dollar`,
});

const CreditsModal = (props) => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_CREDITS_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const i18n = getCurrenciesI18N();
    const i18nCurrency = i18n[currency];

    const handleSubmit = async (params) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: debouncedAmount, Currency: currency },
            api,
            createModal,
        });
        await api(buyCredit(requestBody));
        await call();
        props.onClose();
        createNotification({ text: c('Success').t`Credits added` });
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount: debouncedAmount,
        currency,
        onPay: handleSubmit,
    });

    const submit =
        debouncedAmount >= MIN_CREDIT_AMOUNT ? (
            method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                <PayPalButton paypal={paypal} color="norm" amount={debouncedAmount}>{c('Action')
                    .t`Continue`}</PayPalButton>
            ) : (
                <PrimaryButton loading={loading} disabled={!canPay} type="submit">{c('Action')
                    .t`Top up`}</PrimaryButton>
            )
        ) : null;

    return (
        <FormModal
            className="credits-modal"
            type="small"
            onSubmit={() => withLoading(handleSubmit(parameters))}
            loading={loading}
            submit={submit}
            close={c('Action').t`Close`}
            title={c('Title').t`Add credits`}
            {...props}
        >
            <PaymentInfo method={method} />
            <Alert
                learnMore={
                    APP_NAME === APPS.PROTONVPN_SETTINGS
                        ? 'https://protonvpn.com/support/vpn-credit-proration/'
                        : 'https://protonmail.com/support/knowledge-base/credit-proration/'
                }
            >{c('Info')
                .jt`Top up your account with credits that you can use to subscribe to a new plan or renew your current plan. You get one credit for every ${i18nCurrency} spent.`}</Alert>
            <AmountRow
                method={method}
                amount={amount}
                onChangeAmount={setAmount}
                currency={currency}
                onChangeCurrency={setCurrency}
            />
            <Payment
                type="credit"
                method={method}
                amount={debouncedAmount}
                currency={currency}
                card={card}
                onMethod={setMethod}
                onCard={setCard}
                errors={errors}
                paypal={paypal}
                paypalCredit={paypalCredit}
                noMaxWidth
            />
        </FormModal>
    );
};

CreditsModal.propTypes = {
    onClose: PropTypes.func,
};

export default CreditsModal;
