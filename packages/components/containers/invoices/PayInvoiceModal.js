import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, FormModal, Row, Field, Label, Price, useApiWithoutResult, useApiResult } from 'react-components';
import { checkInvoice, payInvoice } from 'proton-shared/lib/api/payments';
import { toPrice } from 'proton-shared/lib/helpers/string';

import Payment from '../payments/Payment';
import usePayment from '../payments/usePayment';

const PayInvoiceModal = ({ invoice, fetchInvoices, onClose, ...rest }) => {
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
        <FormModal
            small
            onClose={onClose}
            onSubmit={handleSubmit}
            loading={loadingPay}
            close={c('Action').t`Close`}
            submit={canPay && c('Action').t`Pay`}
            title={c('Title').t`Pay invoice`}
            {...rest}
        >
            {loadingCheck ? null : (
                <>
                    <Row>
                        <Label>{c('Label').t`Amount`}</Label>
                        <Field className="w100 alignright">
                            <Price className="pm-label" currency={Currency}>
                                {Amount}
                            </Price>
                        </Field>
                    </Row>
                    <Row>
                        <Label>{c('Label').t`Amount due`}</Label>
                        <Field className="w100">
                            <Input
                                className="pm-field--highlight no-pointer-events strong alignright"
                                readOnly={true}
                                value={toPrice(AmountDue, Currency)}
                            />
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
        </FormModal>
    );
};

PayInvoiceModal.propTypes = {
    invoice: PropTypes.object.isRequired,
    onClose: PropTypes.func,
    fetchInvoices: PropTypes.func.isRequired
};

export default PayInvoiceModal;
