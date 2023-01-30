import { ReactNode, Ref, useEffect } from 'react';

import { c } from 'ttag';

import {
    DEFAULT_CURRENCY,
    MIN_CREDIT_AMOUNT,
    MIN_DONATION_AMOUNT,
    PAYMENT_METHOD_TYPE,
    PAYMENT_METHOD_TYPES,
} from '@proton/shared/lib/constants';
import { Currency, PaymentMethodStatus } from '@proton/shared/lib/interfaces';

import { Alert, Loader, Price } from '../../components';
import { classnames } from '../../helpers';
import { useMethods } from '../paymentMethods';
import PaymentMethodDetails from '../paymentMethods/PaymentMethodDetails';
import PaymentMethodSelector from '../paymentMethods/PaymentMethodSelector';
import { PaymentMethodFlows } from '../paymentMethods/interface';
import Alert3DS from './Alert3ds';
import Bitcoin from './Bitcoin';
import Cash from './Cash';
import CreditCard from './CreditCard';
import PayPalView from './PayPalView';
import { CardModel } from './interface';

interface Props {
    children?: ReactNode;
    type: PaymentMethodFlows;
    amount?: number;
    currency?: Currency;
    coupon?: string;
    method?: PAYMENT_METHOD_TYPE;
    onMethod: (value: PAYMENT_METHOD_TYPE | undefined) => void;
    paypal: any;
    paypalCredit: any;
    card: CardModel;
    onCard: (key: string, value: string) => void;
    cardErrors: Partial<CardModel>;
    noMaxWidth?: boolean;
    paymentMethodStatus?: PaymentMethodStatus;
    creditCardTopRef?: Ref<HTMLDivElement>;
}

const Payment = ({
    children,
    type,
    amount = 0,
    currency = DEFAULT_CURRENCY,
    coupon = '',
    paypal,
    paypalCredit,
    paymentMethodStatus,
    method,
    onMethod,
    card,
    onCard,
    cardErrors,
    noMaxWidth = false,
    creditCardTopRef,
}: Props) => {
    const { paymentMethods, options, loading } = useMethods({ amount, paymentMethodStatus, coupon, flow: type });
    const lastUsedMethod = options.usedMethods[options.usedMethods.length - 1];

    const allMethods = [...options.usedMethods, ...options.methods];

    useEffect(() => {
        if (loading) {
            return onMethod(undefined);
        }
        const result = allMethods.find(({ disabled }) => !disabled);
        if (result) {
            onMethod(result.value);
        }
    }, [loading, allMethods.length]);

    if (['donation', 'human-verification'].includes(type) && amount < MIN_DONATION_AMOUNT) {
        const price = (
            <Price key="price" currency={currency}>
                {MIN_DONATION_AMOUNT}
            </Price>
        );
        return (
            <Alert className="mb1" type="error">{c('Error')
                .jt`The minimum amount that can be donated is ${price}`}</Alert>
        );
    }

    if (type === 'credit' && amount < MIN_CREDIT_AMOUNT) {
        const price = (
            <Price key="price" currency={currency}>
                {MIN_CREDIT_AMOUNT}
            </Price>
        );
        return (
            <Alert className="mb1" type="error">{c('Error')
                .jt`The minimum amount of credit that can be added is ${price}`}</Alert>
        );
    }

    if (amount <= 0) {
        const price = (
            <Price key="price" currency={currency}>
                {0}
            </Price>
        );
        return <Alert className="mb1" type="error">{c('Error').jt`The minimum payment we accept is ${price}`}</Alert>;
    }

    if (loading) {
        return <Loader />;
    }

    const customPaymentMethod = paymentMethods.find(({ ID }) => method === ID);

    return (
        <>
            <div
                className={classnames([
                    'payment-container center',
                    noMaxWidth === false && 'max-w37e on-mobile-max-w100 ',
                ])}
            >
                <div>
                    {type !== 'signup' && <h2 className="text-2xl text-bold mb1">{c('Label').t`Payment method`}</h2>}
                    <PaymentMethodSelector
                        options={allMethods}
                        method={method}
                        onChange={(value) => onMethod(value)}
                        lastUsedMethod={lastUsedMethod}
                    />
                </div>
                <div className="mt1">
                    {method === PAYMENT_METHOD_TYPES.CARD && (
                        <>
                            <div ref={creditCardTopRef} />
                            <CreditCard card={card} errors={cardErrors} onChange={onCard} />
                            {type !== 'signup' && <Alert3DS />}
                        </>
                    )}
                    {method === PAYMENT_METHOD_TYPES.CASH && <Cash />}
                    {method === PAYMENT_METHOD_TYPES.BITCOIN && (
                        <Bitcoin amount={amount} currency={currency} type={type} />
                    )}
                    {method === PAYMENT_METHOD_TYPES.PAYPAL && (
                        <PayPalView
                            paypal={paypal}
                            paypalCredit={paypalCredit}
                            amount={amount}
                            currency={currency}
                            type={type}
                        />
                    )}
                    {customPaymentMethod && (
                        <>
                            <PaymentMethodDetails
                                type={customPaymentMethod.Type}
                                details={customPaymentMethod.Details}
                            />
                            {customPaymentMethod.Type === PAYMENT_METHOD_TYPES.CARD && <Alert3DS />}
                        </>
                    )}
                    {children}
                </div>
            </div>
            {type === 'subscription' &&
            method &&
            [PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method as any) ? (
                <Alert className="mb1" type="warning">{c('Warning')
                    .t`Please note that by choosing this payment method, your account cannot be upgraded immediately. We will update your account once the payment is cleared.`}</Alert>
            ) : null}
        </>
    );
};

export default Payment;
