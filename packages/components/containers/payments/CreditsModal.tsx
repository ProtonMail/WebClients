import { useState } from 'react';
import { c } from 'ttag';
import { buyCredit } from '@proton/shared/lib/api/payments';
import {
    APPS,
    DEFAULT_CURRENCY,
    DEFAULT_CREDITS_AMOUNT,
    MIN_CREDIT_AMOUNT,
    PAYMENT_METHOD_TYPES,
} from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import {
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
    ModalProps,
    Form,
    Button,
    PrimaryButton,
    Alert,
    useDebounceInput,
} from '../../components';
import { useNotifications, useEventManager, useConfig, useModals, useApi, useLoading } from '../../hooks';

import AmountRow from './AmountRow';
import PaymentInfo from './PaymentInfo';
import Payment from './Payment';
import usePayment from './usePayment';
import { handlePaymentToken } from './paymentTokenHelper';
import StyledPayPalButton from './StyledPayPalButton';
import { PaymentParameters } from './interface';

const getCurrenciesI18N = () => ({
    EUR: c('Monetary unit').t`Euro`,
    CHF: c('Monetary unit').t`Swiss franc`,
    USD: c('Monetary unit').t`Dollar`,
});

const CreditsModal = (props: ModalProps) => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const [amount, setAmount] = useState(DEFAULT_CREDITS_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const i18n = getCurrenciesI18N();
    const i18nCurrency = i18n[currency];

    const handleSubmit = async (params: PaymentParameters) => {
        const requestBody = await handlePaymentToken({
            params: { ...params, Amount: debouncedAmount, Currency: currency },
            api,
            createModal,
        });
        await api(buyCredit(requestBody));
        await call();
        props.onClose?.();
        createNotification({ text: c('Success').t`Credits added` });
    };

    const { card, setCard, cardErrors, handleCardSubmit, method, setMethod, parameters, canPay, paypal, paypalCredit } =
        usePayment({
            amount: debouncedAmount,
            currency,
            onPay: handleSubmit,
        });

    const submit =
        debouncedAmount >= MIN_CREDIT_AMOUNT ? (
            method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                <StyledPayPalButton paypal={paypal} amount={debouncedAmount} />
            ) : (
                <PrimaryButton loading={loading} disabled={!canPay} type="submit">{c('Action')
                    .t`Top up`}</PrimaryButton>
            )
        ) : null;

    return (
        <ModalTwo
            className="credits-modal"
            size="large"
            as={Form}
            onSubmit={() => {
                if (!handleCardSubmit()) {
                    return;
                }
                withLoading(handleSubmit(parameters));
            }}
            {...props}
        >
            <ModalTwoHeader title={c('Title').t`Add credits`} />
            <ModalTwoContent>
                <PaymentInfo method={method} />
                <Alert
                    className="mb1"
                    learnMore={
                        APP_NAME === APPS.PROTONVPN_SETTINGS
                            ? 'https://protonvpn.com/support/vpn-credit-proration/'
                            : 'https://protonmail.com/support/knowledge-base/credit-proration/'
                    }
                >{c('Info')
                    .jt`Top up your account with credits that you can use to subscribe to a new plan or renew your current plan. You get one credit for every ${i18nCurrency} spent.`}</Alert>
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
