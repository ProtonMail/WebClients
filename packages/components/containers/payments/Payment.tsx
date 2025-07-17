import { useEffect } from 'react';

import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import Loader from '@proton/components/components/loader/Loader';
import Price from '@proton/components/components/price/Price';
import { type DirectDebitProps, SepaDirectDebit } from '@proton/components/payments/chargebee/SepaDirectDebit';
import type { ThemeCode, ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import { BilledUserInlineMessage } from '@proton/components/payments/client-extensions/billed-user';
import type { BitcoinHook } from '@proton/components/payments/react-extensions/useBitcoin';
import type { ChargebeeCardProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeCard';
import type { ChargebeePaypalProcessorHook } from '@proton/components/payments/react-extensions/useChargebeePaypal';
import { type ChargebeeDirectDebitProcessorHook } from '@proton/components/payments/react-extensions/useSepaDirectDebit';
import { useStableLoading } from '@proton/hooks';
import {
    type BillingAddressStatus,
    type Currency,
    type FreeSubscription,
    MIN_CREDIT_AMOUNT,
    PAYMENT_METHOD_TYPES,
    type PaymentMethodFlow,
    type PaymentMethodType,
    type SavedPaymentMethod,
    type SavedPaymentMethodExternal,
    type SavedPaymentMethodInternal,
    type Subscription,
    type useSepaCurrencyOverride,
} from '@proton/payments';
import type { CbIframeHandles } from '@proton/payments/ui';
import {
    type ChargebeeCardWrapperProps,
    ChargebeeCreditCardWrapper,
    type ChargebeePaypalButtonProps,
    ChargebeeSavedCardWrapper,
    type TaxCountryHook,
    TaxCountrySelector,
    type VatNumberHook,
    VatNumberInput,
    useIsB2BTrial,
} from '@proton/payments/ui';
import type { Organization, User } from '@proton/shared/lib/interfaces';
import { isBilledUser } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import Alert3DS from './Alert3ds';
import { ApplePayView } from './ApplePayView';
import Cash from './Cash';
import DefaultPaymentMethodMessage from './DefaultPaymentMethodMessage';
import PayPalView from './PayPalView';
import Bitcoin from './bitcoin/Bitcoin';
import BitcoinInfoMessage from './bitcoin/BitcoinInfoMessage';
import PaymentMethodDetails from './methods/PaymentMethodDetails';
import PaymentMethodSelector from './methods/PaymentMethodSelector';
import { NoPaymentRequiredNote } from './subscription/modal-components/NoPaymentRequiredNote';

export interface Props {
    flow: PaymentMethodFlow;
    method?: PaymentMethodType;
    onMethod: (value: PaymentMethodType | undefined) => void;
    noMaxWidth?: boolean;
    hideFirstLabel?: boolean;
    hideSavedMethodsDetails?: boolean;
    defaultMethod?: PAYMENT_METHOD_TYPES;
    iframeHandles: CbIframeHandles;
    chargebeeCard: ChargebeeCardProcessorHook;
    chargebeePaypal: ChargebeePaypalProcessorHook;
    user: User | undefined;
    startTrial?: boolean;
    lastUsedMethod?: ViewPaymentMethod;
    allMethods: ViewPaymentMethod[];
    isAuthenticated: boolean;
    loading: boolean;
    savedMethodInternal?: SavedPaymentMethodInternal;
    savedMethodExternal?: SavedPaymentMethodExternal;
    currency: Currency;
    amount: number;
    paymentComponentLoaded: () => void;
    themeCode?: ThemeCode;
    bitcoinChargebee: BitcoinHook;
    directDebit: ChargebeeDirectDebitProcessorHook;
    billingAddressStatus?: BillingAddressStatus;
    onChargebeeInitialized?: () => void;
    showCardIcons?: boolean;
    savedPaymentMethods: SavedPaymentMethod[];
    vatNumber?: VatNumberHook;
    taxCountry?: TaxCountryHook;
    loadingBitcoin?: boolean;
    showTaxCountry: boolean;
    subscription?: Subscription | FreeSubscription;
    organization?: Organization;
    currencyOverride: ReturnType<typeof useSepaCurrencyOverride>;
}

export const PaymentsNoApi = ({
    flow,
    amount,
    currency,
    method,
    onMethod,
    noMaxWidth = false,
    lastUsedMethod,
    allMethods,
    isAuthenticated,
    loading,
    savedMethodInternal,
    savedMethodExternal,
    hideFirstLabel,
    hideSavedMethodsDetails,
    defaultMethod,
    iframeHandles,
    chargebeeCard,
    chargebeePaypal,
    paymentComponentLoaded,
    themeCode,
    bitcoinChargebee,
    user,
    directDebit,
    taxCountry,
    onChargebeeInitialized,
    showCardIcons,
    savedPaymentMethods,
    vatNumber,
    loadingBitcoin: loadingBitcoinProp,
    showTaxCountry,
    subscription,
    organization,
    startTrial,
    currencyOverride,
}: Props) => {
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const enableVatIdFeature = useFlag('VatId');

    const isBitcoinMethod = method === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN;
    const showBitcoinMethod = isBitcoinMethod && !isBilledUser(user);
    const showBitcoinPlaceholder = isBitcoinMethod && isBilledUser(user);

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

    const { loading: loadingHookProps, ...bitcoinProps } = bitcoinChargebee;

    const loadingBitcoin = useStableLoading([loadingHookProps, !!loadingBitcoinProp]);

    if (flow === 'credit' && amount < MIN_CREDIT_AMOUNT) {
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

    if (loading) {
        return <Loader />;
    }

    const isSignupPass = flow === 'signup-pass' || flow === 'signup-pass-upgrade';
    const isSignupVpn = flow === 'signup-vpn';
    const isSignupWallet = flow === 'signup-wallet';
    const isSingleSignup = isSignupPass || isSignupVpn || isSignupWallet;
    const showAlert3ds = !(
        flow === 'signup' ||
        isSignupPass ||
        isSignupVpn ||
        isSignupWallet ||
        flow === 'signup-v2' ||
        flow === 'signup-v2-upgrade'
    );

    const sharedCbProps: Pick<
        ChargebeeCardWrapperProps & ChargebeePaypalButtonProps & DirectDebitProps,
        'iframeHandles' | 'chargebeePaypal' | 'chargebeeCard' | 'directDebit' | 'onInitialized'
    > = {
        iframeHandles,
        chargebeeCard,
        chargebeePaypal,
        directDebit,
        onInitialized: onChargebeeInitialized,
    };

    const savedMethod = savedMethodInternal ?? savedMethodExternal;

    const isPaypalMethod = method === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    const showPaypalView = isPaypalMethod && !isSingleSignup;

    const renderSavedChargebeeIframe = savedMethod?.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;

    const showVatInput = showTaxCountry; // basically the same condition as showTaxCountry for now. Can be changed later.

    const vatInput = enableVatIdFeature && showVatInput && taxCountry && vatNumber && (
        <VatNumberInput taxCountry={taxCountry} {...vatNumber} />
    );

    const billingCountryInput = showTaxCountry && taxCountry && <TaxCountrySelector className="mb-2" {...taxCountry} />;

    const defaultPaymentMethodMessage = flow === 'subscription' && (
        <DefaultPaymentMethodMessage
            className="mt-4"
            savedPaymentMethods={savedPaymentMethods}
            selectedPaymentMethod={method}
        />
    );

    // We must collect payment method details when amount due is greater than 0, this is obvious. But also when user
    // wants to start a trial. We will not charge user in this case, but we still want to save the payment method
    // information.
    const paymentMethodRequired = amount > 0 || startTrial || isB2BTrial;

    return (
        <>
            <div
                className={clsx('payment-container center', noMaxWidth === false && 'max-w-full md:max-w-custom')}
                style={noMaxWidth === false ? { '--md-max-w-custom': '37em' } : undefined}
            >
                {paymentMethodRequired && (
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
                            narrow={isSingleSignup}
                            showCardIcons={showCardIcons}
                        />
                    </div>
                )}
                {paymentMethodRequired && (
                    <div className="mt-4">
                        {method === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && (
                            <>
                                <ChargebeeCreditCardWrapper
                                    {...sharedCbProps}
                                    themeCode={themeCode}
                                    suffix={
                                        <>
                                            {billingCountryInput}
                                            {vatInput}
                                        </>
                                    }
                                    // if we don't let user select the tax country then we still need a fallback way to
                                    // collect the card country and the postal code
                                    showCountry={!showTaxCountry}
                                />
                                {showAlert3ds && <Alert3DS />}
                            </>
                        )}
                        {method === PAYMENT_METHOD_TYPES.CASH && <Cash />}
                        {method === PAYMENT_METHOD_TYPES.APPLE_PAY && (
                            <>
                                <ApplePayView />
                                <div className="mt-2">
                                    {billingCountryInput}
                                    {vatInput}
                                </div>
                            </>
                        )}
                        {method === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT && (
                            <>
                                <SepaDirectDebit
                                    {...sharedCbProps}
                                    isCurrencyOverriden={currencyOverride.isCurrencyOverriden}
                                />

                                <div className="mt-2">
                                    {billingCountryInput}
                                    {vatInput}
                                </div>
                            </>
                        )}
                        {(function renderBitcoin() {
                            if (!showBitcoinMethod) {
                                return null;
                            }

                            if (!isAuthenticated) {
                                return (
                                    <p>{c('Info')
                                        .t`In the next step, you’ll be able to submit a deposit using a Bitcoin address.`}</p>
                                );
                            }

                            if (method === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
                                return (
                                    <>
                                        <BitcoinInfoMessage />
                                        <Bitcoin
                                            loading={
                                                loadingBitcoin || (!!taxCountry && !taxCountry.billingAddressValid)
                                            }
                                            {...bitcoinProps}
                                        />
                                        <div className="mt-4">
                                            {billingCountryInput}
                                            {vatInput}
                                        </div>
                                    </>
                                );
                            }

                            return null;
                        })()}
                        {showBitcoinPlaceholder && <BilledUserInlineMessage />}
                        {isPaypalMethod && (
                            <>
                                {billingCountryInput}
                                {vatInput}
                                {showPaypalView ? (
                                    <PayPalView method={method} amount={amount} currency={currency} />
                                ) : null}
                            </>
                        )}
                        {savedMethod && (
                            <>
                                {!hideSavedMethodsDetails && (
                                    <PaymentMethodDetails type={savedMethod.Type} details={savedMethod.Details} />
                                )}
                                {billingCountryInput}
                                {vatInput}
                                {savedMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && showAlert3ds && (
                                    <Alert3DS />
                                )}
                                {renderSavedChargebeeIframe && <ChargebeeSavedCardWrapper {...sharedCbProps} />}
                            </>
                        )}
                        {defaultPaymentMethodMessage}
                    </div>
                )}
            </div>
            {!paymentMethodRequired && (
                <NoPaymentRequiredNote
                    hasPaymentMethod={!!savedPaymentMethods?.length}
                    organization={organization}
                    subscription={subscription}
                    taxCountry={
                        <>
                            {billingCountryInput}
                            {vatInput}
                        </>
                    }
                />
            )}
        </>
    );
};
