import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { donate } from '@proton/shared/lib/api/payments';
import {
    DEFAULT_CURRENCY,
    DEFAULT_DONATION_AMOUNT,
    PAYMENT_METHOD_TYPES,
    MIN_DONATION_AMOUNT,
} from '@proton/shared/lib/constants';
import { FormModal, PrimaryButton, useDebounceInput } from '../../components';
import { useNotifications, useApi, useLoading, useModals } from '../../hooks';

import './DonateModal.scss';
import PaymentInfo from './PaymentInfo';
import AmountRow from './AmountRow';
import Payment from './Payment';
import usePayment from './usePayment';
import StyledPayPalButton from './StyledPayPalButton';
import { handlePaymentToken } from './paymentTokenHelper';

const DonateModal = ({ ...rest }) => {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_DONATION_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const { createModal } = useModals();

    const handleSubmit = async (params) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: debouncedAmount, Currency: currency },
            api,
            createModal,
        });
        await api(donate(requestBody));
        rest.onClose();
        createNotification({
            text: c('Success')
                .t`Your support is essential to keeping Proton running. Thank you for supporting internet privacy!`,
        });
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount: debouncedAmount,
        currency,
        onPay: handleSubmit,
    });

    const submit =
        debouncedAmount >= MIN_DONATION_AMOUNT ? (
            method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                <StyledPayPalButton paypal={paypal} amount={debouncedAmount} />
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
                method={method}
                amount={amount}
                onChangeAmount={setAmount}
                currency={currency}
                onChangeCurrency={setCurrency}
            />
            <Payment
                type="donation"
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

DonateModal.propTypes = {
    onClose: PropTypes.func,
};

export default DonateModal;
