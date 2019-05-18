import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Label, FormModal, Row, Field, Alert, useNotifications, useApiWithoutResult } from 'react-components';
import { donate } from 'proton-shared/lib/api/payments';
import { DEFAULT_CURRENCY, DEFAULT_DONATION_AMOUNT } from 'proton-shared/lib/constants';

import PaymentSelector from './PaymentSelector';
import Payment from './Payment';
import usePayment from './usePayment';

const DonateModal = ({ onClose, ...rest }) => {
    const { method, setMethod, parameters, setParameters, canPay, setCardValidity } = usePayment(handleSubmit);
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(donate);
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_DONATION_AMOUNT);

    const handleSubmit = async () => {
        await request({ Amount: amount, Currency: currency, ...parameters });
        onClose();
        createNotification({
            text: c('Success')
                .t`Your support is essential to keeping ProtonMail running. Thank you for supporting internet privacy!`
        });
    };

    return (
        <FormModal
            small
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loading}
            close={c('Action').t`Cancel`}
            title={c('Title').t`Make a donation`}
            submit={canPay && c('Action').t`Donate`}
            {...rest}
        >
            <Alert>{c('Info').t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</Alert>
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
                type="donation"
                method={method}
                amount={amount}
                currency={currency}
                onParameters={setParameters}
                onMethod={setMethod}
                onValidCard={setCardValidity}
            />
        </FormModal>
    );
};

DonateModal.propTypes = {
    onClose: PropTypes.func,
    onSubmit: PropTypes.func.isRequired
};

export default DonateModal;
