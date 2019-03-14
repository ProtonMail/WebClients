import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Modal,
    ContentModal,
    FooterModal,
    ResetButton,
    PrimaryButton,
    Row,
    Label,
    Price,
    useApiWithoutResult,
    useApiResult
} from 'react-components';
import { checkInvoice, payInvoice } from 'proton-shared/lib/api/payments';

import PaymentPanel from '../payments/PaymentPanel';
import PaymentMethodsSelect from '../paymentMethods/PaymentMethodsSelect';
import toDetails from '../payments/toDetails';

const PAYMENT_TYPE = 'invoice';

const PayInvoiceModal = ({ show, invoice, onClose, fetchInvoices }) => {
    const [method, setMethod] = useState('');
    const [isCardValid, setCardValidity] = useState(false);
    const { request, loading: loadingPay } = useApiWithoutResult(payInvoice);
    const { result = {}, loading: loadingCheck } = useApiResult(() => checkInvoice(invoice.ID), []);
    const { AmountDue, Amount, Currency } = result;
    const [parameters, setParameters] = useState({});

    const handleChangeMethod = (newMethod) => {
        if (!['card', 'paypal', 'cash', 'bitcoin'].includes(newMethod)) {
            setParameters({ PaymentMethodID: newMethod });
        }

        setMethod(newMethod);
    };

    const handleSubmit = async () => {
        await request(invoice.ID, { Amount: AmountDue, Currency, ...parameters });
        fetchInvoices();
    };

    const handleCard = ({ card, isValid }) => {
        setCardValidity(isValid);
        setParameters({ Payment: { Type: 'card', Details: toDetails(card) } });
    };

    const handlePayPal = (Details) => {
        setParameters({ Payment: { Type: 'paypal', Details } });
        handleSubmit();
    };

    const canPay = () => {
        if (['paypal', 'bitcoin', 'cash'].includes(method)) {
            return false;
        }

        if (method === 'card' && !isCardValid) {
            return false;
        }

        return true;
    };

    const getContent = () => (
        <>
            <Row>
                <Label>{c('Label').t`Amount`}</Label>
                <Price className="pm-label" currency={Currency}>
                    {Amount}
                </Price>
            </Row>
            <Row>
                <Label>{c('Label').t`Amount due`}</Label>
                <Price className="pm-label" currency={Currency}>
                    {AmountDue}
                </Price>
            </Row>
            <Row>
                <Label>{c('Label').t`Select payment method`}</Label>
                <PaymentMethodsSelect
                    method={method}
                    amount={AmountDue}
                    type={PAYMENT_TYPE}
                    onChange={handleChangeMethod}
                />
            </Row>
            <PaymentPanel
                amount={AmountDue}
                currency={Currency}
                onCard={handleCard}
                onPayPal={handlePayPal}
                type={PAYMENT_TYPE}
                method={method}
            />
        </>
    );

    return (
        <Modal modalClassName="pm-modal--smaller" show={show} onClose={onClose} title={c('Title').t`Pay invoice`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                {loadingCheck ? null : getContent()}
                <FooterModal>
                    <ResetButton>{c('Action').t`Close`}</ResetButton>
                    {canPay() ? (
                        <PrimaryButton type="submit" loading={loadingPay}>{c('Action').t`Pay`}</PrimaryButton>
                    ) : null}
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

PayInvoiceModal.propTypes = {
    invoice: PropTypes.object.isRequired,
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    fetchInvoices: PropTypes.func.isRequired
};

export default PayInvoiceModal;
