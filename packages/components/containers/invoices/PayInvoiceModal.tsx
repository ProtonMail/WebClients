import { c } from 'ttag';

import { ChargebeePaypalWrapper } from '@proton/components/payments/chargebee/ChargebeeWrapper';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import type { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { useLoading } from '@proton/hooks';
import { checkInvoice, getPaymentsVersion } from '@proton/shared/lib/api/payments';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { toPrice } from '@proton/shared/lib/helpers/string';
import { getHasSomeVpnPlan } from '@proton/shared/lib/helpers/subscription';
import type { Currency } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';

import { EllipsisLoader, Field, FormModal, Input, Label, Price, PrimaryButton, Row } from '../../components';
import { useApiResult, useEventManager, useNotifications, useSubscription, useUser } from '../../hooks';
import PaymentWrapper from '../payments/PaymentWrapper';
import StyledPayPalButton from '../payments/StyledPayPalButton';
import { getInvoicePaymentsVersion } from './helpers';
import type { Invoice } from './interface';

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

    const invoicePaymentsVersion = getInvoicePaymentsVersion(invoice);
    const { result, loading: amountLoading } = useApiResult<CheckInvoiceResponse, typeof checkInvoice>(
        () => checkInvoice(invoice.ID, invoicePaymentsVersion),
        []
    );
    const [subscription] = useSubscription();
    const [user] = useUser();
    const hasSomeVpnPlan = getHasSomeVpnPlan(subscription);

    const { AmountDue, Amount, Currency, Credit } = result ?? {};

    const amountDue = AmountDue ?? 0;
    const currency = Currency as Currency;

    const chargebeeContext = useChargebeeContext();

    const forceInhouseSavedMethodProcessors = !invoice.IsExternal;
    const disableNewPaymentMethods =
        forceInhouseSavedMethodProcessors && user.ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED;

    const paymentFacade = usePaymentFacade({
        amount: amountDue,
        currency,
        billingPlatform: subscription?.BillingPlatform,
        chargebeeUserExists: user.ChargebeeUserExists,
        forceInhouseSavedMethodProcessors,
        disableNewPaymentMethods,
        onChargeable: (operations) => {
            return withLoading(async () => {
                await operations.payInvoice(invoice.ID, invoicePaymentsVersion);
                await Promise.all([
                    call(), // Update user.Delinquent to hide TopBanner
                    fetchInvoices(),
                ]);
                rest.onClose?.();
                createNotification({ text: c('Success').t`Invoice paid` });
            });
        },
        flow: 'invoice',
        user,
    });

    const process = async (processor?: PaymentProcessorHook) =>
        withLoading(async () => {
            let selectedProcessor = processor;

            // Here we have a unique case when the payment can happen even if no payment methods are offered.
            // Even in the SubscriptionContainer, we select a payment method underhood when the amount due is 0.
            // In the PayInvoiceModal, there is an exception for splitted users when when we disable all the new payment
            // methods. In this case amountDue > 0 check is a traditional one: the payment processor MUST exist if
            // the AmountDue is greater than 0. There are several UI cases for this:
            //   - user has saved payment method. Then the payment processor will exist here. It will be payment
            //       processor for the saved payment method.
            //   - user does not have saved payment method. Then user will see a prompt to add a payment method (see
            //       it below). In this case the payment processor will be undefined and this code will never be called
            //       because the Pay button is supposed to be disabled.
            //   - finally, amountDue is 0 and there is no payment processor, then it means that the user doesn't have
            //       saved payment methods. But they are still allowed to pay. In this case we can select any "neutral"
            //       payment processor. It will behave exactly like in the SubscriptionContainer when the
            //       amount due is 0.
            if (!selectedProcessor) {
                if (amountDue > 0) {
                    return;
                }

                // The case of selecting the "neutral" payment processor.
                selectedProcessor = paymentFacade.card;
            }

            try {
                await selectedProcessor.processPaymentToken();
            } catch (e) {
                const error = getSentryError(e);
                if (error) {
                    const context = {
                        invoiceId: invoice.ID,
                        currency,
                        amount: amountDue,
                        processorType: paymentFacade.selectedProcessor?.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        paymentsVersion: getPaymentsVersion(),
                        chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
                    };

                    captureMessage('Payments: failed to pay invoice', {
                        level: 'error',
                        extra: { error, context },
                    });
                }
            }
        });

    const submit = (() => {
        if (paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.PAYPAL) {
            return (
                <StyledPayPalButton
                    type="submit"
                    paypal={paymentFacade.paypal}
                    amount={amountDue}
                    currency={paymentFacade.currency}
                    loading={loading}
                    data-testid="paypal-button"
                />
            );
        }

        if (
            paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL &&
            // if the invoice is internal, then we don't render the CB paypal button and fallback to the regular pay
            // button
            !forceInhouseSavedMethodProcessors
        ) {
            return (
                <div className="flex justify-end">
                    <div className="w-1/2 mr-1">
                        <ChargebeePaypalWrapper
                            chargebeePaypal={paymentFacade.chargebeePaypal}
                            iframeHandles={paymentFacade.iframeHandles}
                        />
                    </div>
                </div>
            );
        }

        // userCanTriggerSelected can be false when no payment method selected. It can happen when splitted user
        // tries to pay for the inhouse invoice. In this case they won't have any new payment methods available by
        // design. And if it happens that they also don't have any old payment methods, then userCanTriggerSelected
        // will remain false. However it might happen that they do have enough credits to pay for the invoice. In this
        // case we should not disable the pay button.
        const disablePayButton =
            paymentFacade.methods.loading || (!paymentFacade.userCanTriggerSelected && amountDue > 0);

        return (
            <PrimaryButton loading={loading} disabled={disablePayButton} type="submit" data-testid="pay-invoice-button">
                {c('Action').t`Pay`}
            </PrimaryButton>
        );
    })();

    const userMustAddMethod =
        disableNewPaymentMethods && paymentFacade.methods.allMethods.length === 0 && amountDue > 0;

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
                                className="field--highlight pointer-events-none text-strong text-right"
                                readOnly
                                value={toPrice(amountDue, currency)}
                            />
                        </Field>
                    </Row>
                    {userMustAddMethod && (
                        <p>{c('Payments').t`Please add a payment method in the dashboard to continue.`}</p>
                    )}
                    {/* "Duplicated amountDue > 0 condition isn't a mistake. Even if we don't show the message above,
                     we still will hide the PaymentWrapper if the amount is 0. This handles the case when user has 
                     enough credits to pay for the invoice without adding a new payment method. So the amount to pay 
                     will remain 0." */}
                    {amountDue > 0 && !userMustAddMethod ? (
                        <PaymentWrapper
                            {...paymentFacade}
                            onPaypalCreditClick={() => process(paymentFacade.paypalCredit)}
                            noMaxWidth
                            hasSomeVpnPlan={hasSomeVpnPlan}
                        />
                    ) : null}
                </>
            )}
        </FormModal>
    );
};

export default PayInvoiceModal;
