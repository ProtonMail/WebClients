import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Input,
    FormModal,
    Row,
    Label,
    Field,
    Price,
    useApiWithoutResult,
    useApiResult,
    useApi
} from 'react-components';
import { checkInvoice, payInvoice } from 'proton-shared/lib/api/payments';
import { toPrice } from 'proton-shared/lib/helpers/string';

import Payment from '../payments/Payment';
import usePayment from '../payments/usePayment';
import { handle3DS } from '../payments/paymentTokenHelper';

const PayInvoiceModal = ({ invoice, fetchInvoices, ...rest }) => {
    const api = useApi();
    const { request, loading: loadingPay } = useApiWithoutResult(payInvoice);
    const { result = {}, loading: loadingCheck } = useApiResult(() => checkInvoice(invoice.ID), []);
    const { AmountDue, Amount, Currency } = result;
    const { method, setMethod, parameters, setParameters, canPay, setCardValidity } = usePayment();

    const handleSubmit = async (params = parameters) => {
        const requestBody = await handle3DS({ ...params, Amount: AmountDue, Currency }, api);
        await request(invoice.ID, requestBody);
        fetchInvoices();
        rest.onClose();
    };

    return (
        <FormModal
            small
            onSubmit={() => handleSubmit()}
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
                        <Field className="alignright">
                            <Price className="pm-label" currency={Currency}>
                                {Amount}
                            </Price>
                        </Field>
                    </Row>
                    <Row>
                        <Label>{c('Label').t`Amount due`}</Label>
                        <Field>
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
                        parameters={parameters}
                        onParameters={setParameters}
                        onMethod={setMethod}
                        onValidCard={setCardValidity}
                        onPay={handleSubmit}
                    />
                </>
            )}
        </FormModal>
    );
};

PayInvoiceModal.propTypes = {
    invoice: PropTypes.object.isRequired,
    fetchInvoices: PropTypes.func.isRequired
};

export default PayInvoiceModal;
