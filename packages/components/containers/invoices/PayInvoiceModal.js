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
import { handlePaymentToken } from '../payments/paymentTokenHelper';

const PayInvoiceModal = ({ invoice, fetchInvoices, ...rest }) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { result = {}, loading: loadingCheck } = useApiResult(() => checkInvoice(invoice.ID), []);
    const { AmountDue, Amount, Currency, Credit } = result;

    const handleSubmit = async (params) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: AmountDue, Currency },
            api,
            createModal
        });
        await api(payInvoice(invoice.ID, requestBody));
        fetchInvoices();
        rest.onClose();
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount: AmountDue,
        currency: Currency,
        onPay: handleSubmit
    });

    return (
        <FormModal
            small
            onSubmit={() => withLoading(handleSubmit(parameters))}
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
                            card={card}
                            onMethod={setMethod}
                            onCard={setCard}
                            errors={errors}
                            paypal={paypal}
                            paypalCredit={paypalCredit}
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
