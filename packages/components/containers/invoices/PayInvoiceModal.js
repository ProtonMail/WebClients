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
    useApiResult,
    useModals,
    useApi,
    useLoading
} from 'react-components';
import { checkInvoice, payInvoice } from 'proton-shared/lib/api/payments';
import { toPrice } from 'proton-shared/lib/helpers/string';

import Payment from '../payments/Payment';
import usePayment from '../payments/usePayment';
import useCard from '../payments/useCard';
import { handlePaymentToken } from '../payments/paymentTokenHelper';

const PayInvoiceModal = ({ invoice, fetchInvoices, ...rest }) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const card = useCard();
    const { result = {}, loading: loadingCheck } = useApiResult(() => checkInvoice(invoice.ID), []);
    const { AmountDue, Amount, Currency, Credit } = result;
    const { method, setMethod, parameters, setParameters, canPay, setCardValidity } = usePayment();

    const handleSubmit = async (params = parameters) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: AmountDue, Currency },
            api,
            createModal
        });
        await api(payInvoice(invoice.ID, requestBody));
        fetchInvoices();
        rest.onClose();
    };

    return (
        <FormModal
            small
            onSubmit={() => withLoading(handleSubmit())}
            loading={loading}
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
                    {Credit ? (
                        <Row>
                            <Label>{c('Label').t`Credits used`}</Label>
                            <Field className="alignright">
                                <Price className="pm-label" currency={Currency}>
                                    {Credit}
                                </Price>
                            </Field>
                        </Row>
                    ) : null}
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
                    {AmountDue > 0 ? (
                        <Payment
                            type="invoice"
                            method={method}
                            amount={AmountDue}
                            currency={Currency}
                            parameters={parameters}
                            card={card}
                            onParameters={setParameters}
                            onMethod={setMethod}
                            onValidCard={setCardValidity}
                            onPay={handleSubmit}
                        />
                    ) : null}
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
