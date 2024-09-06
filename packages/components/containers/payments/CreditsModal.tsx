import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import { useAutomaticCurrency, usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { usePollEvents } from '@proton/components/payments/client-extensions/usePollEvents';
import { PAYMENT_METHOD_TYPES, type PaymentMethodStatusExtended } from '@proton/components/payments/core';
import type { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { useLoading } from '@proton/hooks';
import { getPaymentsVersion } from '@proton/shared/lib/api/payments';
import {
    APPS,
    DEFAULT_CREDITS_AMOUNT,
    MAX_BITCOIN_AMOUNT,
    MIN_BITCOIN_AMOUNT,
    MIN_CREDIT_AMOUNT,
    isFreeSubscription,
} from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getHasSomeVpnPlan } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Currency } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../components';
import {
    Form,
    Loader,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Price,
    PrimaryButton,
    useDebounceInput,
} from '../../components';
import { useConfig, useEventManager, useNotifications, useSubscription, useUser } from '../../hooks';
import { ChargebeePaypalWrapper } from '../../payments/chargebee/ChargebeeWrapper';
import AmountRow from './AmountRow';
import PaymentInfo from './PaymentInfo';
import PaymentWrapper from './PaymentWrapper';
import StyledPayPalButton from './StyledPayPalButton';

const getCurrenciesI18N = () => ({
    EUR: c('Monetary unit').t`Euro`,
    CHF: c('Monetary unit').t`Swiss franc`,
    USD: c('Monetary unit').t`US Dollar`,
    BRL: c('Monetary unit').t`Brazilian real`,
});

type Props = {
    status: PaymentMethodStatusExtended;
} & ModalProps;

const CreditsModal = ({ status, ...props }: Props) => {
    const { APP_NAME } = useConfig();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const preferredCurrency = useAutomaticCurrency();
    const [currency, setCurrency] = useState<Currency>(preferredCurrency);
    const [amount, setAmount] = useState(DEFAULT_CREDITS_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const amountLoading = debouncedAmount !== amount;
    const i18n = getCurrenciesI18N();
    const i18nCurrency = i18n[currency];
    const pollEventsMultipleTimes = usePollEvents();
    const chargebeeContext = useChargebeeContext();
    const [subscription, loadingSubscription] = useSubscription();
    const [user, loadingUser] = useUser();

    const paymentFacade = usePaymentFacade({
        amount: debouncedAmount,
        currency,
        billingPlatform: subscription?.BillingPlatform,
        chargebeeUserExists: user.ChargebeeUserExists,
        paymentMethodStatusExtended: status,
        onChargeable: (operations, data) => {
            const run = async () => {
                await operations.buyCredit();
                await call();
                props.onClose?.();

                if (data.sourceType === 'chargebee-bitcoin') {
                    createNotification({
                        text: c('Payments')
                            .t`The transaction is successfully detected. The credits will be added to your account once the transaction is fully confirmed.`,
                        expiration: 20000,
                    });
                } else {
                    createNotification({ text: c('Success').t`Credits added` });
                }
            };

            const promise = run();
            void withLoading(promise);

            promise.then(() => pollEventsMultipleTimes()).catch(noop);

            return promise;
        },
        flow: 'credit',
        user,
    });

    if (loadingSubscription || loadingUser) {
        return <Loader />;
    }

    const methodValue = paymentFacade.selectedMethodValue;

    const submit = (() => {
        const bitcoinAmountInRange = debouncedAmount >= MIN_BITCOIN_AMOUNT && debouncedAmount <= MAX_BITCOIN_AMOUNT;
        if (
            debouncedAmount < MIN_CREDIT_AMOUNT ||
            ((methodValue === PAYMENT_METHOD_TYPES.BITCOIN || methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) &&
                !bitcoinAmountInRange)
        ) {
            return null;
        }

        if (paymentFacade.methods.isNewPaypal) {
            return (
                <StyledPayPalButton
                    type="submit"
                    paypal={paymentFacade.paypal}
                    amount={debouncedAmount}
                    currency={paymentFacade.currency}
                    loading={loading}
                    disabled={amountLoading}
                    data-testid="paypal-button"
                />
            );
        }

        if (methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
            if (loading) {
                return (
                    <ButtonLike disabled loading={true}>
                        {c('Payments').t`Processing payment`}
                    </ButtonLike>
                );
            }

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

        const topUpText = c('Action').t`Top up`;
        if (methodValue === PAYMENT_METHOD_TYPES.BITCOIN || methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
            return (
                <PrimaryButton
                    loading={
                        paymentFacade.bitcoinInhouse.bitcoinLoading || paymentFacade.bitcoinChargebee.bitcoinLoading
                    }
                    disabled={true}
                    data-testid="top-up-button"
                >
                    {paymentFacade.bitcoinInhouse.awaitingBitcoinPayment ||
                    paymentFacade.bitcoinChargebee.awaitingBitcoinPayment
                        ? c('Info').t`Awaiting transaction`
                        : topUpText}
                </PrimaryButton>
            );
        }

        return (
            <PrimaryButton
                loading={loading}
                disabled={paymentFacade.methods.loading || !paymentFacade.userCanTriggerSelected || amountLoading}
                type="submit"
                data-testid="top-up-button"
            >
                {topUpText}
            </PrimaryButton>
        );
    })();

    const process = async (processor?: PaymentProcessorHook) =>
        withLoading(async () => {
            if (!processor) {
                return;
            }

            try {
                await processor.processPaymentToken();
            } catch (e) {
                const error = getSentryError(e);
                if (error) {
                    const context = {
                        app: APP_NAME,
                        currency,
                        amount,
                        debouncedAmount,
                        processorType: paymentFacade.selectedProcessor?.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        paymentsVersion: getPaymentsVersion(),
                        chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
                    };

                    captureMessage('Payments: failed to handle credits', {
                        level: 'error',
                        extra: { error, context },
                    });
                }
            }
        });

    const disableCurrencySelector =
        chargebeeContext.enableChargebeeRef.current !== ChargebeeEnabled.INHOUSE_FORCED &&
        !isFreeSubscription(subscription);

    const amountToCharge = amountLoading ? null : <Price currency={currency}>{debouncedAmount}</Price>;

    return (
        <ModalTwo
            className="credits-modal"
            size="large"
            as={Form}
            onSubmit={() => process(paymentFacade.selectedProcessor)}
            {...props}
        >
            <ModalTwoHeader title={c('Title').t`Add credits`} />
            <ModalTwoContent>
                <PaymentInfo paymentMethodType={paymentFacade.selectedMethodType} />
                <div className="mb-4">
                    <div>
                        {c('Info')
                            .jt`Top up your account with credits that you can use to subscribe to a new plan or renew your current plan. You get one credit for every ${i18nCurrency} spent.`}
                    </div>
                    <Href
                        href={
                            APP_NAME === APPS.PROTONVPN_SETTINGS
                                ? 'https://protonvpn.com/support/vpn-credit-proration/'
                                : getKnowledgeBaseUrl('/credit-proration-coupons')
                        }
                    >
                        {c('Link').t`Learn more`}
                    </Href>
                </div>
                <AmountRow
                    status={status}
                    paymentMethodType={paymentFacade.selectedMethodType}
                    amount={amount}
                    onChangeAmount={setAmount}
                    currency={currency}
                    onChangeCurrency={setCurrency}
                    disableCurrencySelector={disableCurrencySelector}
                />
                <PaymentWrapper
                    {...paymentFacade}
                    onPaypalCreditClick={() => process(paymentFacade.paypalCredit)}
                    noMaxWidth
                    triggersDisabled={amountLoading}
                    hasSomeVpnPlan={getHasSomeVpnPlan(subscription)}
                />
                {
                    <p
                        className="text-sm text-center color-weak min-h-custom"
                        style={{
                            '--min-h-custom': '1.5rem',
                        }}
                    >
                        {amountToCharge
                            ? c('Payments').jt`You will be charged ${amountToCharge} from your selected payment method.`
                            : null}
                    </p>
                }
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={props.onClose}>{c('Action').t`Close`}</Button>
                {submit}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreditsModal;
