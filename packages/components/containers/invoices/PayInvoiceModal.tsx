import PropTypes from 'prop-types';
import { c } from 'ttag';

import { checkInvoice, payInvoice } from '@proton/shared/lib/api/payments';
import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { toPrice } from '@proton/shared/lib/helpers/string';
import { Currency } from '@proton/shared/lib/interfaces';

import { Field, FormModal, Input, Label, Price, PrimaryButton, Row } from '../../components';
import { useApi, useApiResult, useEventManager, useLoading, useModals, useNotifications } from '../../hooks';
import Payment from '../payments/Payment';
import StyledPayPalButton from '../payments/StyledPayPalButton';
import { PaymentParameters } from '../payments/interface';
import { handlePaymentToken } from '../payments/paymentTokenHelper';
import usePayment from '../payments/usePayment';
import { Invoice } from './interface';

interface CheckInvoiceResponse {
    Code: number;
    Currency: Currency;
    Amount: number;
    Gift: number;
    Credit: number;
    AmountDue: number;
}

export interface Props {
    invoice: Invoice;
    fetchInvoices: () => void;
    onClose?: () => void;
}

const PayInvoiceModal = ({ invoice, fetchInvoices, onClose, ...rest }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { result, loading: isLoading } = useApiResult<CheckInvoiceResponse, typeof checkInvoice>(
        () => checkInvoice(invoice.ID),
        []
    );

    const { AmountDue, Amount, Currency, Credit } = result ?? {};

    const handleSubmit = async (params: PaymentParameters) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: AmountDue as number, Currency: Currency as Currency },
            api,
            createModal,
        });
        await api(payInvoice(invoice.ID, requestBody));
        await Promise.all([
            call(), // Update user.Delinquent to hide TopBanner
            fetchInvoices(),
        ]);
        onClose?.();
        createNotification({ text: c('Success').t`Invoice paid` });
    };

    const { card, setCard, cardErrors, handleCardSubmit, method, setMethod, parameters, canPay, paypal, paypalCredit } =
        usePayment({
            amount: AmountDue as number,
            currency: Currency as Currency,
            onPay: handleSubmit,
        });

    const submit =
        method === PAYMENT_METHOD_TYPES.PAYPAL ? (
            <StyledPayPalButton paypal={paypal} flow="invoice" amount={AmountDue ?? 0} />
        ) : (
            <PrimaryButton loading={loading} disabled={!canPay} type="submit">{c('Action').t`Pay`}</PrimaryButton>
        );

    return (
        <FormModal
            onSubmit={() => {
                if (!handleCardSubmit()) {
                    return;
                }
                withLoading(handleSubmit(parameters));
            }}
            loading={loading}
            close={c('Action').t`Close`}
            submit={submit}
            title={c('Title').t`Pay invoice`}
            onClose={() => onClose?.()}
            {...rest}
        >
            {!isLoading && (
                <>
                    {!!Credit && (
                        <>
                            <Row>
                                <Label>{c('Label').t`Amount`}</Label>
                                <Field className="text-right">
                                    <Price className="label" currency={Currency}>
                                        {Amount ?? 0}
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
                    )}
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
                    {AmountDue && AmountDue > 0 && (
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
                            cardErrors={cardErrors}
                        />
                    )}
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
