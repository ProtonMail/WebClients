import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { AmountAndCurrency, PAYMENT_METHOD_TYPES, TokenPaymentMethod } from '@proton/components/payments/core';
import { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { useLoading } from '@proton/hooks';
import { buyCredit } from '@proton/shared/lib/api/payments';
import {
    APPS,
    DEFAULT_CREDITS_AMOUNT,
    DEFAULT_CURRENCY,
    MAX_BITCOIN_AMOUNT,
    MIN_BITCOIN_AMOUNT,
    MIN_CREDIT_AMOUNT,
} from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Currency } from '@proton/shared/lib/interfaces';

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
import { useApi, useConfig, useEventManager, useNotifications } from '../../hooks';
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
    const i18n = getCurrenciesI18N();
    const i18nCurrency = i18n[currency];
    const api = useApi();

    const paymentFacade = usePaymentFacade({
        amount: debouncedAmount,
        currency,
        onChargeable: (operations) => {
            return withLoading(async () => {
                await operations.buyCredit();
                await call();
                props.onClose?.();
                createNotification({ text: c('Success').t`Credits added` });
            });
        },
        flow: 'credit',
    });

    const [bitcoinValidated, setBitcoinValidated] = useState(false);
    const [awaitingBitcoinPayment, setAwaitingBitcoinPayment] = useState(false);

    const exitSuccess = async () => {
        props.onClose?.();
        createNotification({ text: c('Success').t`Credits added` });
    };

    const handleChargableToken = async (tokenPaymentMethod: TokenPaymentMethod) => {
        const amountAndCurrency: AmountAndCurrency = { Amount: debouncedAmount, Currency: currency };
        await api(buyCredit({ ...tokenPaymentMethod, ...amountAndCurrency }));
        await call();
    };

    const selectedMethodType = paymentFacade.methods.selectedMethod?.type;
    const method = paymentFacade.methods.selectedMethod?.value;

    const bitcoinAmountInRange =
        (debouncedAmount >= MIN_BITCOIN_AMOUNT && debouncedAmount <= MAX_BITCOIN_AMOUNT) ||
        method !== PAYMENT_METHOD_TYPES.BITCOIN;

    const submit =
        debouncedAmount >= MIN_CREDIT_AMOUNT && bitcoinAmountInRange ? (
            paymentFacade.methods.isNewPaypal ? (
                <StyledPayPalButton
                    type="submit"
                    paypal={paymentFacade.paypal}
                    amount={debouncedAmount}
                    currency={paymentFacade.currency}
                    loading={loading}
                    data-testid="paypal-button"
                />
            ) : method === PAYMENT_METHOD_TYPES.BITCOIN ? (
                <PrimaryButton
                    loading={!bitcoinValidated && awaitingBitcoinPayment}
                    disabled={true}
                    data-testid="top-up-button"
                >{c('Info').t`Awaiting transaction`}</PrimaryButton>
            ) : (
                <PrimaryButton
                    loading={loading}
                    disabled={paymentFacade.methods.loading || !paymentFacade.userCanTriggerSelected}
                    type="submit"
                    data-testid="top-up-button"
                >{c('Action').t`Top up`}</PrimaryButton>
            )
        ) : null;

    const process = async (processor?: PaymentProcessorHook) =>
        withLoading(async () => {
            if (!processor) {
                return;
            }

            try {
                await processor.processPaymentToken();
            } catch {}
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
                <PaymentInfo method={selectedMethodType} />
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
                    method={selectedMethodType}
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
                        await handleChargableToken(data);
                        wait(2000).then(() => exitSuccess());
                    }}
                    onAwaitingBitcoinPayment={setAwaitingBitcoinPayment}
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
