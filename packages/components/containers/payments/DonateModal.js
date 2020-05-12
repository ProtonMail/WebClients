import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    FormModal,
    Price,
    Alert,
    PrimaryButton,
    useNotifications,
    useApi,
    useLoading,
    useModals
} from 'react-components';
import { donate } from 'proton-shared/lib/api/payments';
import {
    DEFAULT_CURRENCY,
    DEFAULT_DONATION_AMOUNT,
    PAYMENT_METHOD_TYPES,
    MIN_DONATION_AMOUNT
} from 'proton-shared/lib/constants';

import './DonateModal.scss';
import PaymentInfo from './PaymentInfo';
import AmountRow from './AmountRow';
import Payment from './Payment';
import usePayment from './usePayment';
import PayPalButton from './PayPalButton';
import { handlePaymentToken } from './paymentTokenHelper';

const DonateModal = ({ ...rest }) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_DONATION_AMOUNT);
    const { createModal } = useModals();
    const minAmount = (
        <Price key="min" currency={currency}>
            {MIN_DONATION_AMOUNT}
        </Price>
    );

    const handleSubmit = async (params) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: amount, Currency: currency },
            api,
            createModal
        });
        await api(donate(requestBody));
        rest.onClose();
        createNotification({
            text: c('Success')
                .t`Your support is essential to keeping Proton running. Thank you for supporting internet privacy!`
        });
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount,
        currency,
        onPay: handleSubmit
    });

    const submit =
        amount >= MIN_DONATION_AMOUNT ? (
            method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                <PayPalButton paypal={paypal} className="pm-button--primary" amount={amount}>{c('Action')
                    .t`Continue`}</PayPalButton>
            ) : (
                <PrimaryButton loading={loading} disabled={!canPay} type="submit">{c('Action')
                    .t`Donate`}</PrimaryButton>
            )
        ) : null;

    return (
        <FormModal
            className="donate-modal"
            onSubmit={() => withLoading(handleSubmit(parameters))}
            loading={loading}
            title={c('Title').t`Make a donation`}
            submit={submit}
            {...rest}
        >
            <PaymentInfo method={method} />
            <AmountRow
                type="donation"
                method={method}
                amount={amount}
                onChangeAmount={setAmount}
                currency={currency}
                onChangeCurrency={setCurrency}
            />
            {amount >= MIN_DONATION_AMOUNT ? (
                <Payment
                    type="donation"
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
            ) : (
                <Alert type="error">{c('Error').jt`Amount below minimum: ${minAmount}`}</Alert>
            )}
        </FormModal>
    );
};

DonateModal.propTypes = {
    onClose: PropTypes.func
};

export default DonateModal;
