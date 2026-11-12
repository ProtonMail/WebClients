import { c } from 'ttag';

import { useGetPaymentsInit } from '@proton/account/paymentsInit/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import Field from '@proton/components/components/container/Field';
import Row from '@proton/components/components/container/Row';
import Form from '@proton/components/components/form/Form';
import Input from '@proton/components/components/input/Input';
import Label from '@proton/components/components/label/Label';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Price from '@proton/components/components/price/Price';
import { getInvoicePaymentsVersion } from '@proton/components/containers/invoices/helpers';
import useApiResult from '@proton/components/hooks/useApiResult';
import useEventManager from '@proton/components/hooks/useEventManager';
import useLoading from '@proton/hooks/useLoading';
import {
    IdealAuthorizationText,
    isIdealAuthorizationNoteShown,
} from '@proton/payments-hooks/ui/components/IdealAuthorizationText';
import { checkInvoice } from '@proton/payments/core/api/api';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { Currency, Invoice } from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { getSimplePriceString } from '@proton/payments/core/price-format';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import { CacheType } from '@proton/redux-utilities/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { usePaymentFacade } from '../../client-extensions/usePaymentFacade';
import { ApplePayButton } from '../../ui/components/ApplePayButton';
import { ChargebeeIdealButton } from '../../ui/components/ChargebeeIdealButton';
import { WALLET_BUTTON_WIDTH } from '../../ui/components/ChargebeeIframe';
import { ChargebeePaypalButton } from '../../ui/components/ChargebeePaypalButton';
import { GooglePayButton } from '../../ui/components/GooglePayButton';
import PaymentWrapper from '../payments/PaymentWrapper';

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
    app: APP_NAMES;
}

const PayInvoiceModal = ({ invoice, fetchInvoices, app, ...rest }: Props) => {
    const getPaymentsInit = useGetPaymentsInit();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();

    const invoicePaymentsVersion = getInvoicePaymentsVersion(invoice);
    const { result, loading: amountLoading } = useApiResult<CheckInvoiceResponse, typeof checkInvoice>(
        () => checkInvoice(invoice.ID, invoicePaymentsVersion),
        []
    );
    const [user] = useUser();
    const [subscription] = useSubscription();

    const { AmountDue, Amount, Currency, Credit } = result ?? {};

    const amountDue = AmountDue ?? 0;
    const currency = Currency as Currency;

    const paymentFacade = usePaymentFacade({
        amount: amountDue,
        currency,
        onChargeable: (operations) => {
            return withLoading(async () => {
                await operations.payInvoice(invoice.ID, invoicePaymentsVersion);
                // The invoice is already paid, so a failed refresh must not keep the modal open
                await Promise.allSettled([
                    call(), // Update user.Delinquent to hide TopBanner
                    fetchInvoices(),
                    getPaymentsInit({ cache: CacheType.None }),
                ]);
                rest.onClose?.();
                createNotification({ text: c('Success').t`Invoice paid` });
            });
        },
        flow: 'invoice',
        user,
        product: app,
        telemetryContext: 'other',
    });

    const process = async (processor?: PaymentProcessorHook) =>
        withLoading(async () => {
            // When credits cover the invoice, only the card processor emits a token-less chargeable payload. The PayPal,
            // iDEAL, Apple Pay and Google Pay processors are no-ops here because they charge from their own buttons.
            const selectedProcessor = amountDue === 0 ? paymentFacade.chargebeeCard : processor;
            if (!selectedProcessor) {
                return;
            }

            try {
                await selectedProcessor.processPaymentToken();
            } catch (e) {
                tracePaymentError(e, {
                    component: 'pay-invoice-modal',
                    subscription,
                    extra: {
                        invoiceId: invoice.ID,
                        currency,
                        amount: amountDue,
                        processorType: selectedProcessor.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                    },
                });
            }
        });

    const submitButton = (() => {
        const defaultButton = (
            <Button
                color="norm"
                loading={loading}
                disabled={paymentFacade.methods.loading || amountLoading}
                type="submit"
                data-testid="pay-invoice-button"
            >
                {c('Action').t`Pay`}
            </Button>
        );

        if (amountLoading || amountDue === 0) {
            return defaultButton;
        }

        switch (paymentFacade.selectedMethodValue) {
            case PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL:
                return (
                    <ChargebeePaypalButton
                        chargebeePaypal={paymentFacade.chargebeePaypal}
                        iframeHandles={paymentFacade.iframeHandles}
                    />
                );
            case PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL:
                return (
                    <ChargebeeIdealButton
                        chargebeeIdeal={paymentFacade.chargebeeIdeal}
                        iframeHandles={paymentFacade.iframeHandles}
                    />
                );
            case PAYMENT_METHOD_TYPES.APPLE_PAY:
                return (
                    <ApplePayButton
                        applePay={paymentFacade.applePay}
                        iframeHandles={paymentFacade.iframeHandles}
                        width={WALLET_BUTTON_WIDTH}
                        loading={loading}
                    />
                );
            case PAYMENT_METHOD_TYPES.GOOGLE_PAY:
                return (
                    <GooglePayButton
                        googlePay={paymentFacade.googlePay}
                        iframeHandles={paymentFacade.iframeHandles}
                        width={WALLET_BUTTON_WIDTH}
                        loading={loading}
                    />
                );
            default:
                return defaultButton;
        }
    })();

    return (
        <ModalTwo
            as={Form}
            onSubmit={() => process(paymentFacade.selectedProcessor)}
            data-testid="pay-invoice-modal"
            {...rest}
        >
            <ModalTwoHeader title={c('Title').t`Pay invoice`} />
            <ModalTwoContent>
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
                                    className="field--highlight pointer-events-none text-strong text-right"
                                    readOnly
                                    value={getSimplePriceString(currency, amountDue)}
                                />
                            </Field>
                        </Row>
                        {amountDue > 0 ? <PaymentWrapper {...paymentFacade} noMaxWidth /> : null}
                        {isIdealAuthorizationNoteShown(paymentFacade) && (
                            <div className="mt-4">
                                <IdealAuthorizationText />
                            </div>
                        )}
                    </>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>{c('Action').t`Close`}</Button>
                {submitButton}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PayInvoiceModal;
