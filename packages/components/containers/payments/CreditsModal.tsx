import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import usePaymentToken from '@proton/components/containers/payments/usePaymentToken';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
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
import { useApi, useConfig, useEventManager, useLoading, useNotifications } from '../../hooks';
import {
    AmountAndCurrency,
    ExistingPayment,
    TokenPaymentMethod,
    WrappedCardPayment,
} from '../../payments/core/interface';
import AmountRow from './AmountRow';
import Payment from './Payment';
import PaymentInfo from './PaymentInfo';
import StyledPayPalButton from './StyledPayPalButton';
import usePayment from './usePayment';

const getCurrenciesI18N = () => ({
    EUR: c('Monetary unit').t`Euro`,
    CHF: c('Monetary unit').t`Swiss franc`,
    USD: c('Monetary unit').t`Dollar`,
});

const CreditsModal = (props: ModalProps) => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const { call } = useEventManager();
    const createPaymentToken = usePaymentToken();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_CREDITS_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const i18n = getCurrenciesI18N();
    const i18nCurrency = i18n[currency];

    const [bitcoinValidated, setBitcoinValidated] = useState(false);

    const exitSuccess = async () => {
        props.onClose?.();
        createNotification({ text: c('Success').t`Credits added` });
    };

    const handleChargableToken = async (tokenPaymentMethod: TokenPaymentMethod) => {
        const amountAndCurrency: AmountAndCurrency = { Amount: debouncedAmount, Currency: currency };
        await api(buyCredit({ ...tokenPaymentMethod, ...amountAndCurrency }));
        await call();
    };

    const handleSubmit = async (params: TokenPaymentMethod | WrappedCardPayment | ExistingPayment) => {
        const amountAndCurrency: AmountAndCurrency = { Amount: debouncedAmount, Currency: currency };
        const tokenPaymentMethod = await createPaymentToken(params, { amountAndCurrency });
        await handleChargableToken(tokenPaymentMethod);
        exitSuccess();
    };

    const { card, setCard, cardErrors, handleCardSubmit, method, setMethod, parameters, canPay, paypal, paypalCredit } =
        usePayment({
            amount: debouncedAmount,
            currency,
            onPaypalPay: handleSubmit,
        });

    const bitcoinAmountInRange =
        (debouncedAmount >= MIN_BITCOIN_AMOUNT && debouncedAmount <= MAX_BITCOIN_AMOUNT) ||
        method !== PAYMENT_METHOD_TYPES.BITCOIN;

    const submit =
        debouncedAmount >= MIN_CREDIT_AMOUNT && bitcoinAmountInRange ? (
            method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                <StyledPayPalButton paypal={paypal} amount={debouncedAmount} data-testid="paypal-button" />
            ) : method === PAYMENT_METHOD_TYPES.BITCOIN ? (
                <PrimaryButton loading={!bitcoinValidated} disabled={true} data-testid="top-up-button">{c('Info')
                    .t`Awaiting transaction`}</PrimaryButton>
            ) : (
                <PrimaryButton loading={loading} disabled={!canPay} type="submit" data-testid="top-up-button">{c(
                    'Action'
                ).t`Top up`}</PrimaryButton>
            )
        ) : null;

    return (
        <ModalTwo
            className="credits-modal"
            size="large"
            as={Form}
            onSubmit={() => {
                if (!handleCardSubmit() || !parameters) {
                    return;
                }

                withLoading(handleSubmit(parameters));
            }}
            {...props}
        >
            <ModalTwoHeader title={c('Title').t`Add credits`} />
            <ModalTwoContent>
                <PaymentInfo method={method} />
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
                    method={method}
                    amount={amount}
                    onChangeAmount={setAmount}
                    currency={currency}
                    onChangeCurrency={setCurrency}
                />
                <Payment
                    type="credit"
                    method={method}
                    amount={debouncedAmount}
                    currency={currency}
                    card={card}
                    onMethod={setMethod}
                    onCard={setCard}
                    cardErrors={cardErrors}
                    paypal={paypal}
                    paypalCredit={paypalCredit}
                    noMaxWidth
                    onBitcoinTokenValidated={async (data) => {
                        setBitcoinValidated(true);
                        await handleChargableToken(data);
                        wait(2000).then(() => exitSuccess());
                    }}
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
