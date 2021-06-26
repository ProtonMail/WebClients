import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { checkInvoice, payInvoice } from '@proton/shared/lib/api/payments';
import { toPrice } from '@proton/shared/lib/helpers/string';
import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { Input, FormModal, PrimaryButton, Row, Label, Field, Price } from '../../components';
import { useApiResult, useModals, useNotifications, useApi, useLoading, useEventManager } from '../../hooks';

import PayPalButton from '../payments/PayPalButton';
import Payment from '../payments/Payment';
import usePayment from '../payments/usePayment';
import { handlePaymentToken } from '../payments/paymentTokenHelper';

const PayInvoiceModal = ({ invoice, fetchInvoices, ...rest }) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { result = {}, loading: loadingCheck } = useApiResult(() => checkInvoice(invoice.ID), []);
    const { AmountDue, Amount, Currency, Credit } = result;

    const handleSubmit = async (params) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: AmountDue, Currency },
            api,
            createModal,
        });
        await api(payInvoice(invoice.ID, requestBody));
        await Promise.all([
            call(), // Update user.Delinquent to hide TopBanner
            fetchInvoices(),
        ]);
        rest.onClose();
        createNotification({ text: c('Success').t`Invoice paid` });
    };

    const { card, setCard, errors, method, setMethod, parameters, canPay, paypal, paypalCredit } = usePayment({
        amount: AmountDue,
        currency: Currency,
        onPay: handleSubmit,
    });

    const submit =
        method === PAYMENT_METHOD_TYPES.PAYPAL ? (
            <PayPalButton paypal={paypal} type="invoice" color="norm" amount={AmountDue}>{c('Action')
                .t`Continue`}</PayPalButton>
        ) : (
            <PrimaryButton loading={loading} disabled={!canPay} type="submit">{c('Action').t`Pay`}</PrimaryButton>
        );

    return (
        <FormModal
            onSubmit={() => withLoading(handleSubmit(parameters))}
            loading={loading}
            close={c('Action').t`Close`}
            submit={submit}
            title={c('Title').t`Pay invoice`}
            {...rest}
        >
            {loadingCheck ? null : (
                <>
                    {Credit ? (
                        <>
                            <Row>
                                <Label>{c('Label').t`Amount`}</Label>
                                <Field className="text-right">
                                    <Price className="label" currency={Currency}>
                                        {Amount}
                                    </Price>
                                </Field>
                            </Row>
                            <Row>
                                <Label>{c('Label').t`Credits used`}</Label>
                                <Field className="text-right">
                                    <Price className="label" currency={Currency}>
                                        {Credit}
                                    </Price>
                                </Field>
                            </Row>
                        </>
                    ) : null}
                    <Row>
                        <Label>{c('Label').t`Amount due`}</Label>
                        <Field>
                            <Input
                                className="field--highlight no-pointer-events text-strong text-right"
                                readOnly
                                value={toPrice(AmountDue, Currency)}
                            />
                        </Field>
                    </Row>
                    {AmountDue > 0 ? (
                        <Payment
                            type="invoice"
                            paypal={paypal}
                            paypalCredit={paypalCredit}
                            method={method}
                            amount={AmountDue}
                            currency={Currency}
                            card={card}
                            onMethod={setMethod}
                            onCard={setCard}
                            errors={errors}
                        />
                    ) : null}
                </>
            )}
        </FormModal>
    );
};

PayInvoiceModal.propTypes = {
    invoice: PropTypes.object.isRequired,
    fetchInvoices: PropTypes.func.isRequired,
};

export default PayInvoiceModal;
