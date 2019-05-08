import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Modal,
    ContentModal,
    FooterModal,
    ResetButton,
    PrimaryButton,
    Row,
    Field,
    Label,
    Price,
    useApiWithoutResult,
    useApiResult
} from 'react-components';
import { checkInvoice, payInvoice } from 'proton-shared/lib/api/payments';

import Payment from '../payments/Payment';
import usePayment from '../payments/usePayment';

const PayInvoiceModal = ({ invoice, onClose, fetchInvoices }) => {
    const { request, loading: loadingPay } = useApiWithoutResult(payInvoice);
    const { result = {}, loading: loadingCheck } = useApiResult(() => checkInvoice(invoice.ID), []);
    const { AmountDue, Amount, Currency } = result;
    const { method, setMethod, parameters, setParameters, canPay, setCardValidity } = usePayment(handleSubmit);

    const handleSubmit = async () => {
        await request(invoice.ID, { Amount: AmountDue, Currency, ...parameters });
        fetchInvoices();
        onClose();
    };

    return (
        <Modal type="small" onClose={onClose} title={c('Title').t`Pay invoice`}>
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                {loadingCheck ? null : (
                    <>
                        <Row>
                            <Label>{c('Label').t`Amount`}</Label>
                            <Field>
                                <Price className="pm-label" currency={Currency}>
                                    {Amount}
                                </Price>
                            </Field>
                        </Row>
                        <Row>
                            <Label>{c('Label').t`Amount due`}</Label>
                            <Field>
                                <Price className="pm-label" currency={Currency}>
                                    {AmountDue}
                                </Price>
                            </Field>
                        </Row>
                        <Payment
                            type="invoice"
                            method={method}
                            amount={AmountDue}
                            currency={Currency}
                            onParameters={setParameters}
                            onMethod={setMethod}
                            onValidCard={setCardValidity}
                        />
                    </>
                )}
                <FooterModal>
                    <ResetButton>{c('Action').t`Close`}</ResetButton>
                    {canPay ? (
                        <PrimaryButton type="submit" loading={loadingPay}>{c('Action').t`Pay`}</PrimaryButton>
                    ) : null}
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

PayInvoiceModal.propTypes = {
    invoice: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    fetchInvoices: PropTypes.func.isRequired
};

export default PayInvoiceModal;
