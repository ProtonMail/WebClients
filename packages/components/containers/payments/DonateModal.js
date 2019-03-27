import React, { useState } from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import {
    Label,
    Modal,
    ContentModal,
    FooterModal,
    ResetButton,
    PrimaryButton,
    useNotifications,
    useApiWithoutResult
} from 'react-components';
import { DEFAULT_CURRENCY, DEFAULT_DONATION_AMOUNT } from 'proton-shared/lib/constants';

import PaymentSelector from './PaymentSelector';
import Payment from './Payment';
import usePayment from './usePayment';

const DonateModal = ({ show, onClose }) => {
    const { method, setMethod, parameters, setParameters, canPay, setCardValidity } = usePayment(handleSubmit);
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult();
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
        <Modal type="small" show={show} onClose={onClose} title={c('Title').t`Donate`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Label>{c('Label').t`Amount`}</Label>
                <PaymentSelector
                    amount={amount}
                    onChangeAmount={setAmount}
                    currency={currency}
                    onChangeCurrency={setCurrency}
                />
                <Payment
                    type="donation"
                    method={method}
                    amount={amount}
                    currency={currency}
                    onParameters={setParameters}
                    onMethod={setMethod}
                    onValidCard={setCardValidity}
                />
                <FooterModal>
                    <ResetButton>{c('Action').t`Cancel`}</ResetButton>
                    {canPay ? (
                        <PrimaryButton type="submit" loading={loading}>{c('Action').t`Donate`}</PrimaryButton>
                    ) : null}
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

DonateModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default DonateModal;
