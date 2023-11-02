import { c } from 'ttag';

import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { useLoading } from '@proton/hooks';
import { checkInvoice } from '@proton/shared/lib/api/payments';
import { toPrice } from '@proton/shared/lib/helpers/string';
import { Currency } from '@proton/shared/lib/interfaces';

import { EllipsisLoader, Field, FormModal, Input, Label, Price, PrimaryButton, Row } from '../../components';
import { useApiResult, useEventManager, useNotifications } from '../../hooks';
import PaymentWrapper from '../payments/PaymentWrapper';
import StyledPayPalButton from '../payments/StyledPayPalButton';
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

const PayInvoiceModal = ({ invoice, fetchInvoices, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const { result, loading: amountLoading } = useApiResult<CheckInvoiceResponse, typeof checkInvoice>(
        () => checkInvoice(invoice.ID),
        []
    );

    const { AmountDue, Amount, Currency, Credit } = result ?? {};

    const amount = AmountDue ?? 0;
    const currency = Currency as Currency;

    const paymentFacade = usePaymentFacade({
        amount,
        currency,
        onChargeable: (operations) => {
            return withLoading(async () => {
                await operations.payInvoice();
                await Promise.all([
                    call(), // Update user.Delinquent to hide TopBanner
                    fetchInvoices(),
                ]);
                rest.onClose?.();
                createNotification({ text: c('Success').t`Invoice paid` });
            });
        },
        flow: 'invoice',
    });

    const process = async (processor?: PaymentProcessorHook) =>
        withLoading(async () => {
            if (!processor) {
                return;
            }

            try {
                paymentFacade.paymentContext.setInvoiceData({
                    invoiceId: invoice.ID,
                });
                await processor.processPaymentToken();
            } catch {}
        });

    const submit =
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.PAYPAL ? (
            <StyledPayPalButton
                type="submit"
                paypal={paymentFacade.paypal}
                amount={amount}
                currency={paymentFacade.currency}
                loading={loading}
                data-testid="paypal-button"
            />
        ) : (
            <PrimaryButton
                loading={loading}
                disabled={paymentFacade.methods.loading || !paymentFacade.userCanTriggerSelected}
                type="submit"
                data-testid="pay-invoice-button"
            >
                {c('Action').t`Pay`}
            </PrimaryButton>
        );

    return (
        <FormModal
            onSubmit={() => process(paymentFacade.selectedProcessor)}
            loading={loading}
            close={c('Action').t`Close`}
            submit={submit}
            title={c('Title').t`Pay invoice`}
            data-testid="pay-invoice-modal"
            {...rest}
        >
            {amountLoading ? (
                <EllipsisLoader />
            ) : (
                <>
                    {!!Credit && (
                        <>
                            <Row>
                                <Label>{c('Label').t`Amount`}</Label>
                                <Field className="text-right">
                                    <Price className="label" currency={currency}>
                                        {Amount ?? 0}
                                    </Price>
                                </Field>
                            </Row>
                            <Row>
                                <Label>{c('Label').t`Credits used`}</Label>
                                <Field className="text-right">
                                    <Price className="label" currency={currency}>
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
                                value={toPrice(amount, currency)}
                            />
                        </Field>
                    </Row>
                    {amount > 0 ? (
                        <PaymentWrapper
                            {...paymentFacade}
                            onPaypalCreditClick={() => process(paymentFacade.paypalCredit)}
                            noMaxWidth
                        />
                    ) : null}
                </>
            )}
        </FormModal>
    );
};

export default PayInvoiceModal;
