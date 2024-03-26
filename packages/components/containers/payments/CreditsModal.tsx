import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { usePollEvents } from '@proton/components/payments/client-extensions/usePollEvents';
import { AmountAndCurrency, PAYMENT_METHOD_TYPES, TokenPaymentMethod } from '@proton/components/payments/core';
import { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { useLoading } from '@proton/hooks';
import { buyCredit, getPaymentsVersion } from '@proton/shared/lib/api/payments';
import {
    APPS,
    DEFAULT_CREDITS_AMOUNT,
    DEFAULT_CURRENCY,
    MAX_BITCOIN_AMOUNT,
    MIN_BITCOIN_AMOUNT,
    MIN_CREDIT_AMOUNT,
} from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getHasSomeVpnPlan } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Currency } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import {
    Form,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useDebounceInput,
} from '../../components';
import { useApi, useConfig, useEventManager, useNotifications, useSubscription } from '../../hooks';
import { ChargebeePaypalWrapper } from '../../payments/chargebee/ChargebeeWrapper';
import AmountRow from './AmountRow';
import PaymentInfo from './PaymentInfo';
import PaymentWrapper from './PaymentWrapper';
import StyledPayPalButton from './StyledPayPalButton';

const getCurrenciesI18N = () => ({
    EUR: c('Monetary unit').t`Euro`,
    CHF: c('Monetary unit').t`Swiss franc`,
    USD: c('Monetary unit').t`Dollar`,
});

const CreditsModal = (props: ModalProps) => {
    const { APP_NAME } = useConfig();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_CREDITS_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const amountLoading = debouncedAmount !== amount;
    const i18n = getCurrenciesI18N();
    const i18nCurrency = i18n[currency];
    const api = useApi();
    const pollEventsMultipleTimes = usePollEvents();
    const chargebeeContext = useChargebeeContext();
    const [subscription] = useSubscription();

    const paymentFacade = usePaymentFacade({
        amount: debouncedAmount,
        currency,
        onChargeable: (operations) => {
            const run = async () => {
                await operations.buyCredit();
                await call();
                props.onClose?.();
                createNotification({ text: c('Success').t`Credits added` });
            };

            const promise = run();
            void withLoading(promise);

            promise.then(() => pollEventsMultipleTimes()).catch(noop);

            return promise;
        },
        flow: 'credit',
    });

    const [bitcoinValidated, setBitcoinValidated] = useState(false);
    const [awaitingBitcoinPayment, setAwaitingBitcoinPayment] = useState(false);

    const exitSuccess = async () => {
        props.onClose?.();
        createNotification({ text: c('Success').t`Credits added` });
    };

    const handleChargeableToken = async (tokenPaymentMethod: TokenPaymentMethod) => {
        const amountAndCurrency: AmountAndCurrency = { Amount: debouncedAmount, Currency: currency };
        await api(buyCredit({ ...tokenPaymentMethod, ...amountAndCurrency }));
        await call();
    };

    const methodValue = paymentFacade.selectedMethodValue;

    const submit = (() => {
        const bitcoinAmountInRange = debouncedAmount >= MIN_BITCOIN_AMOUNT && debouncedAmount <= MAX_BITCOIN_AMOUNT;
        if (
            debouncedAmount < MIN_CREDIT_AMOUNT ||
            (methodValue === PAYMENT_METHOD_TYPES.BITCOIN && !bitcoinAmountInRange)
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
        if (methodValue === PAYMENT_METHOD_TYPES.BITCOIN) {
            return (
                <PrimaryButton
                    loading={!bitcoinValidated && awaitingBitcoinPayment}
                    disabled={true}
                    data-testid="top-up-button"
                >
                    {awaitingBitcoinPayment ? c('Info').t`Awaiting transaction` : topUpText}
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
                        chargebeeEnabled: chargebeeContext.enableChargebee,
                    };

                    captureMessage('Payments: failed to handle credits', {
                        level: 'error',
                        extra: { error, context },
                    });
                }
            }
        });

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
                    paymentMethodType={paymentFacade.selectedMethodType}
                    amount={amount}
                    onChangeAmount={setAmount}
                    currency={currency}
                    onChangeCurrency={setCurrency}
                />
                <PaymentWrapper
                    {...paymentFacade}
                    onPaypalCreditClick={() => process(paymentFacade.paypalCredit)}
                    noMaxWidth
                    onBitcoinTokenValidated={async (data) => {
                        setBitcoinValidated(true);
                        await handleChargeableToken(data);
                        void wait(2000).then(() => exitSuccess());
                    }}
                    onAwaitingBitcoinPayment={setAwaitingBitcoinPayment}
                    triggersDisabled={amountLoading}
                    hasSomeVpnPlan={getHasSomeVpnPlan(subscription)}
                />
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={props.onClose}>{c('Action').t`Close`}</Button>
                {submit}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreditsModal;
