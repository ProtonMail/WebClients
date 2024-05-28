import { ReactNode, Ref, useEffect } from 'react';

import { c } from 'ttag';

import { ThemeCode, ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import {
    PAYMENT_METHOD_TYPES,
    PaymentMethodFlows,
    PaymentMethodStatus,
    PaymentMethodType,
    SavedPaymentMethod,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
} from '@proton/components/payments/core';
import { CardFieldStatus } from '@proton/components/payments/react-extensions/useCard';
import { ChargebeeCardProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeCard';
import { ChargebeePaypalProcessorHook } from '@proton/components/payments/react-extensions/useChargebeePaypal';
import { useLoading } from '@proton/hooks';
import { APPS, MIN_CREDIT_AMOUNT } from '@proton/shared/lib/constants';
import { Api, Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Alert, Loader, Price } from '../../components';
import { useConfig } from '../../hooks';
import { CbIframeHandles } from '../../payments/chargebee/ChargebeeIframe';
import { ChargebeeCreditCardWrapper, ChargebeeSavedCardWrapper } from '../../payments/chargebee/ChargebeeWrapper';
import { CardModel } from '../../payments/core';
import PaymentMethodDetails from '../paymentMethods/PaymentMethodDetails';
import PaymentMethodSelector from '../paymentMethods/PaymentMethodSelector';
import Alert3DS from './Alert3ds';
import Bitcoin from './Bitcoin';
import BitcoinInfoMessage from './BitcoinInfoMessage';
import Cash from './Cash';
import CreditCard from './CreditCard';
import PayPalView from './PayPalView';
import useBitcoin, { OnBitcoinTokenValidated } from './useBitcoin';

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
    cardFieldStatus: CardFieldStatus;
    paypalPrefetchToken?: boolean;
    onBitcoinTokenValidated?: OnBitcoinTokenValidated;
    onAwaitingBitcoinPayment?: (awaiting: boolean) => void;
    isAuthenticated?: boolean;
    hideFirstLabel?: boolean;
    triggersDisabled?: boolean;
    hideSavedMethodsDetails?: boolean;
    defaultMethod?: PAYMENT_METHOD_TYPES;
    iframeHandles: CbIframeHandles;
    chargebeeCard: ChargebeeCardProcessorHook;
    chargebeePaypal: ChargebeePaypalProcessorHook;
    hasSomeVpnPlan: boolean;
}

export interface NoApiProps extends Props {
    lastUsedMethod?: ViewPaymentMethod;
    allMethods: ViewPaymentMethod[];
    isAuthenticated: boolean;
    loading: boolean;
    savedMethodInternal?: SavedPaymentMethodInternal;
    savedMethodExternal?: SavedPaymentMethodExternal;
    currency: Currency;
    amount: number;
    onPaypalCreditClick?: () => void;
    paymentComponentLoaded: () => void;
    themeCode?: ThemeCode;
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
    savedMethodInternal,
    savedMethodExternal,
    api,
    onPaypalCreditClick,
    onAwaitingBitcoinPayment,
    hideFirstLabel,
    triggersDisabled,
    hideSavedMethodsDetails,
    defaultMethod,
    iframeHandles,
    chargebeeCard,
    chargebeePaypal,
    hasSomeVpnPlan,
    paymentComponentLoaded,
    themeCode,
}: NoApiProps) => {
    const { APP_NAME } = useConfig();

    const [handlingBitcoinPayment, withHandlingBitcoinPayment] = useLoading();

    const showBitcoinMethod = method === PAYMENT_METHOD_TYPES.BITCOIN;

    const bitcoinHook = useBitcoin({
        api,
        Amount: amount,
        Currency: currency,
        onTokenValidated: (data) => withHandlingBitcoinPayment(async () => onBitcoinTokenValidated?.(data)),
        onAwaitingPayment: onAwaitingBitcoinPayment,
        enablePolling: showBitcoinMethod,
    });

    useEffect(() => {
        paymentComponentLoaded();
    }, []);

    useEffect(() => {
        if (loading) {
            return onMethod(undefined);
        }
        if (defaultMethod) {
            onMethod(defaultMethod);
            return;
        }

        const selectedMethod = allMethods.find((otherMethod) => otherMethod.value === method);
        const result = allMethods[0];
        if (!selectedMethod && result) {
            onMethod(result.value);
        }
    }, [loading, allMethods.length]);

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

    const isSignupPass = type === 'signup-pass' || type === 'signup-pass-upgrade';
    const isSignupVpn = type === 'signup-vpn';
    const isSingleSignup = isSignupPass || isSignupVpn;
    const isSignup = type === 'signup' || isSignupPass || isSignupVpn;

    const sharedCbProps = {
        iframeHandles,
        chargebeeCard,
        chargebeePaypal,
    };

    const savedMethod = savedMethodInternal ?? savedMethodExternal;

    const showPaypalView =
        (method === PAYMENT_METHOD_TYPES.PAYPAL || method === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) && !isSingleSignup;
    const showPaypalCredit =
        method === PAYMENT_METHOD_TYPES.PAYPAL &&
        !isSingleSignup &&
        APP_NAME !== APPS.PROTONVPN_SETTINGS &&
        !hasSomeVpnPlan;

    return (
        <>
            <div
                className={clsx('payment-container center', noMaxWidth === false && 'max-w-full md:max-w-custom')}
                style={noMaxWidth === false ? { '--md-max-w-custom': '37em' } : undefined}
            >
                <div>
                    {!isSingleSignup && !hideFirstLabel && (
                        <h2 className="text-rg text-bold mb-1" data-testid="payment-label">
                            {c('Label').t`Payment method`}
                        </h2>
                    )}
                    <PaymentMethodSelector
                        options={allMethods}
                        method={method}
                        onChange={(value) => onMethod(value)}
                        lastUsedMethod={lastUsedMethod}
                        forceDropdown={isSingleSignup}
                        narrow={isSingleSignup}
                    />
                </div>
                <div className="mt-4">
                    {method === PAYMENT_METHOD_TYPES.CARD && (
                        <>
                            <div ref={creditCardTopRef} />
                            <CreditCard
                                card={card}
                                errors={cardErrors}
                                setCardProperty={onCard}
                                fieldsStatus={cardFieldStatus}
                            />
                            {!isSignup && <Alert3DS />}
                        </>
                    )}
                    {method === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && (
                        <>
                            <ChargebeeCreditCardWrapper {...sharedCbProps} themeCode={themeCode} />
                            {!isSignup && <Alert3DS />}
                        </>
                    )}
                    {method === PAYMENT_METHOD_TYPES.CASH && <Cash />}
                    {showBitcoinMethod && (
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
                                    <Bitcoin processingToken={handlingBitcoinPayment} {...bitcoinHook} />
                                </>
                            )}
                        </>
                    )}
                    {showPaypalView && (
                        <PayPalView
                            method={method}
                            paypal={paypal}
                            paypalCredit={paypalCredit}
                            amount={amount}
                            currency={currency}
                            type={type}
                            disabled={disabled}
                            prefetchToken={paypalPrefetchToken}
                            onClick={onPaypalCreditClick}
                            triggersDisabled={triggersDisabled}
                            showPaypalCredit={showPaypalCredit}
                        />
                    )}
                    {savedMethod && (
                        <>
                            {!hideSavedMethodsDetails && (
                                <PaymentMethodDetails type={savedMethod.Type} details={savedMethod.Details} />
                            )}
                            {(savedMethod.Type === PAYMENT_METHOD_TYPES.CARD ||
                                savedMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) && <Alert3DS />}
                            {savedMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && (
                                <ChargebeeSavedCardWrapper {...sharedCbProps} />
                            )}
                        </>
                    )}
                    {children}
                </div>
            </div>
            {type === 'subscription' && method && method === PAYMENT_METHOD_TYPES.CASH ? (
                <Alert className="mb-4" type="warning">{c('Warning')
                    .t`Please note that by choosing this payment method, your account cannot be upgraded immediately. We will update your account once the payment is cleared.`}</Alert>
            ) : null}
        </>
    );
};
