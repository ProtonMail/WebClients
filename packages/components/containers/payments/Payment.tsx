import { ReactNode, Ref, useEffect } from 'react';

import { c } from 'ttag';

import { ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import {
    PAYMENT_METHOD_TYPES,
    PaymentMethodStatus,
    PaymentMethodType,
    SavedPaymentMethod,
} from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { DEFAULT_CURRENCY, MIN_CREDIT_AMOUNT, MIN_DONATION_AMOUNT } from '@proton/shared/lib/constants';
import { Api, Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Alert, Loader, Price } from '../../components';
import { useAuthentication } from '../../hooks';
import { CardModel } from '../../payments/core';
import { useMethods } from '../paymentMethods';
import PaymentMethodDetails from '../paymentMethods/PaymentMethodDetails';
import PaymentMethodSelector from '../paymentMethods/PaymentMethodSelector';
import { PaymentMethodData, PaymentMethodFlows } from '../paymentMethods/interface';
import Alert3DS from './Alert3ds';
import Bitcoin, { ValidatedBitcoinToken } from './Bitcoin';
import BitcoinInfoMessage from './BitcoinInfoMessage';
import Cash from './Cash';
import CreditCard from './CreditCard';
import CreditCardNewDesign from './CreditCardNewDesign';
import PayPalInfoMessage from './PayPalInfoMessage';
import PayPalView from './PayPalView';
import { CardFieldStatus } from './useCard';

export interface Props {
    api: Api;
    children?: ReactNode;
    type: PaymentMethodFlows;
    amount?: number;
    currency?: Currency;
    coupon?: string;
    method?: PaymentMethodType;
    onMethod: (value: PaymentMethodType | undefined) => void;
    paypal: any;
    paypalCredit: any;
    card: CardModel;
    onCard: (key: keyof CardModel, value: string) => void;
    cardErrors: Partial<CardModel>;
    noMaxWidth?: boolean;
    paymentMethodStatus?: PaymentMethodStatus;
    paymentMethods?: SavedPaymentMethod[];
    creditCardTopRef?: Ref<HTMLDivElement>;
    disabled?: boolean;
    cardFieldStatus?: CardFieldStatus;
    paypalPrefetchToken?: boolean;
    onBitcoinTokenValidated?: (data: ValidatedBitcoinToken) => Promise<void>;
    isAuthenticated?: boolean;
}

export interface NoApiProps extends Props {
    lastUsedMethod?: PaymentMethodData | ViewPaymentMethod;
    allMethods: PaymentMethodData[];
    isAuthenticated: boolean;
    loading: boolean;
    customPaymentMethod?: SavedPaymentMethod;
    currency: Currency;
    amount: number;
    onPaypalCreditClick?: () => void;
}

export const PaymentsNoApi = ({
    children,
    type,
    amount,
    currency,
    paypal,
    paypalCredit,
    method,
    onMethod,
    card,
    onCard,
    cardErrors,
    cardFieldStatus,
    noMaxWidth = false,
    creditCardTopRef,
    disabled,
    paypalPrefetchToken,
    onBitcoinTokenValidated,
    lastUsedMethod,
    allMethods,
    isAuthenticated,
    loading,
    customPaymentMethod,
    api,
    onPaypalCreditClick,
}: NoApiProps) => {
    const [handlingBitcoinPayment, withHandlingBitcoinPayment] = useLoading();

    useEffect(() => {
        if (loading) {
            return onMethod(undefined);
        }
        const selectedMethod = allMethods.find((otherMethod) => otherMethod.value === method);
        const result = allMethods.find(({ disabled }) => !disabled);
        if ((!selectedMethod || selectedMethod.disabled) && result) {
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
            <Alert className="mb-4" type="error">{c('Error')
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
            <Alert className="mb-4" type="error">{c('Error')
                .jt`The minimum amount of credit that can be added is ${price}`}</Alert>
        );
    }

    if (amount <= 0) {
        const price = (
            <Price key="price" currency={currency}>
                {0}
            </Price>
        );
        return <Alert className="mb-4" type="error">{c('Error').jt`The minimum payment we accept is ${price}`}</Alert>;
    }

    if (loading) {
        return <Loader />;
    }

    const isSignupPass = type === 'signup-pass';
    const isSignup = type === 'signup' || type === 'signup-pass';

    return (
        <>
            <div className={clsx(['payment-container center', noMaxWidth === false && 'max-w37e on-mobile-max-w100 '])}>
                <div>
                    {!isSignupPass && (
                        <h2 className="text-rg text-bold mb-1" data-testid="payment-label">
                            {c('Label').t`Payment method`}
                        </h2>
                    )}
                    <PaymentMethodSelector
                        options={allMethods}
                        method={method}
                        onChange={(value) => onMethod(value)}
                        lastUsedMethod={lastUsedMethod}
                        forceDropdown={isSignupPass}
                        narrow={isSignupPass}
                    />
                </div>
                <div className="mt-4">
                    {method === PAYMENT_METHOD_TYPES.CARD && (
                        <>
                            <div ref={creditCardTopRef} />
                            {isSignupPass ? (
                                <CreditCardNewDesign
                                    card={card}
                                    errors={cardErrors}
                                    onChange={onCard}
                                    fieldsStatus={cardFieldStatus}
                                />
                            ) : (
                                <CreditCard card={card} errors={cardErrors} onChange={onCard} />
                            )}

                            {!isSignup && <Alert3DS />}
                        </>
                    )}
                    {method === PAYMENT_METHOD_TYPES.CASH && <Cash />}
                    {method === PAYMENT_METHOD_TYPES.BITCOIN && (
                        <>
                            {!isAuthenticated && (
                                <p>
                                    {c('Info')
                                        .t`In the next step, you’ll be able to submit a deposit using a Bitcoin address.`}
                                </p>
                            )}
                            {isAuthenticated && (
                                <>
                                    <BitcoinInfoMessage />
                                    <Bitcoin
                                        api={api}
                                        amount={amount}
                                        currency={currency}
                                        type={type}
                                        awaitingPayment={handlingBitcoinPayment}
                                        onTokenValidated={(data) =>
                                            withHandlingBitcoinPayment(async () => onBitcoinTokenValidated?.(data))
                                        }
                                        enableValidation={!!onBitcoinTokenValidated}
                                    />
                                </>
                            )}
                        </>
                    )}
                    {method === PAYMENT_METHOD_TYPES.PAYPAL && !isSignupPass && (
                        <PayPalView
                            paypal={paypal}
                            paypalCredit={paypalCredit}
                            amount={amount}
                            currency={currency}
                            type={type}
                            disabled={disabled}
                            prefetchToken={paypalPrefetchToken}
                            onClick={onPaypalCreditClick}
                        />
                    )}
                    {method === PAYMENT_METHOD_TYPES.PAYPAL && isSignupPass && <PayPalInfoMessage />}
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
                <Alert className="mb-4" type="warning">{c('Warning')
                    .t`Please note that by choosing this payment method, your account cannot be upgraded immediately. We will update your account once the payment is cleared.`}</Alert>
            ) : null}
        </>
    );
};

const Payment = (props: Props) => {
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID || !!props.isAuthenticated;

    const { paymentMethods, options, loading } = useMethods({
        api: props.api,
        amount: props.amount ?? 0,
        paymentMethodStatus: props.paymentMethodStatus,
        paymentMethods: props.paymentMethods,
        coupon: props.coupon ?? '',
        flow: props.type,
        isAuthenticated,
    });
    const lastUsedMethod = options.usedMethods[options.usedMethods.length - 1];

    const allMethods = [...options.usedMethods, ...options.methods];

    const customPaymentMethod = paymentMethods.find(({ ID }) => props.method === ID);

    return (
        <PaymentsNoApi
            {...props}
            paymentMethods={paymentMethods}
            lastUsedMethod={lastUsedMethod}
            allMethods={allMethods}
            loading={loading}
            isAuthenticated={isAuthenticated}
            currency={props.currency ?? DEFAULT_CURRENCY}
            amount={props.amount ?? 0}
            customPaymentMethod={customPaymentMethod}
        />
    );
};

export default Payment;
