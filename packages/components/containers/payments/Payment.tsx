import React, { useEffect } from 'react';
import { c } from 'ttag';
import {
    PAYMENT_METHOD_TYPE,
    MIN_DONATION_AMOUNT,
    MIN_CREDIT_AMOUNT,
    DEFAULT_CURRENCY,
    PAYMENT_METHOD_TYPES,
} from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import { classnames } from '../../helpers';

import { Alert, Price, Loader } from '../../components';
import { useMethods } from '../paymentMethods';
import PaymentMethodSelector from '../paymentMethods/PaymentMethodSelector';
import CreditCard from './CreditCard';
import Cash from './Cash';
import Bitcoin from './Bitcoin';
import PayPalView from './PayPalView';
import PaymentMethodDetails from '../paymentMethods/PaymentMethodDetails';
import Alert3DS from './Alert3ds';
import { PaymentMethodFlows } from '../paymentMethods/interface';
import { CardModel } from './interface';

interface Props {
    children?: React.ReactNode;
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
    errors: any;
    noMaxWidth?: boolean;
}

const Payment = ({
    children,
    type,
    amount = 0,
    currency = DEFAULT_CURRENCY,
    coupon = '',
    paypal,
    paypalCredit,
    method,
    onMethod,
    card,
    onCard,
    errors,
    noMaxWidth = false,
}: Props) => {
    const { paymentMethods, options, loading } = useMethods({ amount, coupon, flow: type });
    const lastCustomMethod = [...options]
        .reverse()
        .find(
            ({ value }) =>
                ![
                    PAYMENT_METHOD_TYPES.CARD,
                    PAYMENT_METHOD_TYPES.PAYPAL,
                    PAYMENT_METHOD_TYPES.CASH,
                    PAYMENT_METHOD_TYPES.BITCOIN,
                ].includes(value as any)
        );

    useEffect(() => {
        if (loading) {
            return onMethod(undefined);
        }
        const result = options.find(({ disabled }) => !disabled);
        if (result) {
            onMethod(result.value);
        }
    }, [loading, options.length]);

    if (['donation', 'human-verification'].includes(type) && amount < MIN_DONATION_AMOUNT) {
        const price = (
            <Price key="price" currency={currency}>
                {MIN_DONATION_AMOUNT}
            </Price>
        );
        return <Alert type="error">{c('Error').jt`The minimum amount that can be donated is ${price}`}</Alert>;
    }

    if (type === 'credit' && amount < MIN_CREDIT_AMOUNT) {
        const price = (
            <Price key="price" currency={currency}>
                {MIN_CREDIT_AMOUNT}
            </Price>
        );
        return <Alert type="error">{c('Error').jt`The minimum amount of credit that can be added is ${price}`}</Alert>;
    }

    if (amount <= 0) {
        const price = (
            <Price key="price" currency={currency}>
                {0}
            </Price>
        );
        return <Alert type="error">{c('Error').jt`The minimum payment we accept is ${price}`}</Alert>;
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
                <div className="mr1 on-mobile-mr0 border-bottom pb2">
                    <h2 className="text-2xl text-bold">{c('Label').t`Select a method`}</h2>
                    <PaymentMethodSelector
                        options={options}
                        method={method}
                        onChange={(value) => onMethod(value)}
                        lastCustomMethod={lastCustomMethod}
                    />
                </div>
                <div className="mt2">
                    <h2 className="text-2xl text-bold">{c('Title').t`Payment details`}</h2>
                    {method === PAYMENT_METHOD_TYPES.CARD && (
                        <>
                            <CreditCard card={card} errors={errors} onChange={onCard} />
                            <Alert3DS />
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
                            {customPaymentMethod.Type === PAYMENT_METHOD_TYPES.CARD ? <Alert3DS /> : null}
                        </>
                    )}
                    {children}
                </div>
            </div>
            {type === 'subscription' &&
            method &&
            [PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method as any) ? (
                <Alert type="warning">{c('Warning')
                    .t`Please note that by choosing this payment method, your account cannot be upgraded immediately. We will update your account once the payment is cleared.`}</Alert>
            ) : null}
        </>
    );
};

export default Payment;
