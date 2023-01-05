import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { buyCredit } from '@proton/shared/lib/api/payments';
import {
    APPS,
    DEFAULT_CREDITS_AMOUNT,
    DEFAULT_CURRENCY,
    MIN_CREDIT_AMOUNT,
    PAYMENT_METHOD_TYPES,
} from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Currency } from '@proton/shared/lib/interfaces';

import {
    Form,
    Href,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useDebounceInput,
} from '../../components';
import { useApi, useConfig, useEventManager, useLoading, useModals, useNotifications } from '../../hooks';
import AmountRow from './AmountRow';
import Payment from './Payment';
import PaymentInfo from './PaymentInfo';
import StyledPayPalButton from './StyledPayPalButton';
import { PaymentParameters } from './interface';
import { handlePaymentToken } from './paymentTokenHelper';
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
                <div className="mb1">
                    <div>
                        {c('Info')
                            .jt`Top up your account with credits that you can use to subscribe to a new plan or renew your current plan. You get one credit for every ${i18nCurrency} spent.`}
                    </div>
                    <Href
                        url={
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
