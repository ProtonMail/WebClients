import { useEffect } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import Alert from '@proton/components/components/alert/Alert';
import Loader from '@proton/components/components/loader/Loader';
import Price from '@proton/components/components/price/Price';
import PayPalInfoMessage from '@proton/components/containers/payments/PayPalInfoMessage';
import { type DirectDebitProps, SepaDirectDebit } from '@proton/components/payments/chargebee/SepaDirectDebit';
import type { ThemeCode, ViewPaymentMethod } from '@proton/components/payments/client-extensions';
import { BilledUserInlineMessage } from '@proton/components/payments/client-extensions/billed-user';
import type { BitcoinHook } from '@proton/components/payments/react-extensions/useBitcoin';
import type { ChargebeeCardProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeCard';
import type { ChargebeePaypalProcessorHook } from '@proton/components/payments/react-extensions/useChargebeePaypal';
import type { ChargebeeDirectDebitProcessorHook } from '@proton/components/payments/react-extensions/useSepaDirectDebit';
import { useStableLoading } from '@proton/hooks';
import {
    type AvailablePaymentMethod,
    type BillingAddressStatus,
    type Currency,
    type FreeSubscription,
    PAYMENT_METHOD_TYPES,
    type PaymentMethodFlow,
    type PaymentMethodType,
    type PlainPaymentMethodType,
    type SavedPaymentMethod,
    type SavedPaymentMethodExternal,
    type SavedPaymentMethodInternal,
    type Subscription,
    savedMethodRequires3DS,
    type useSepaCurrencyOverride,
} from '@proton/payments';
import { getMinCreditAmount } from '@proton/payments/core/amount-limits';
import {
    type CbIframeHandles,
    type ChargebeeCardWrapperProps,
    ChargebeeCreditCardWrapper,
    type ChargebeePaypalButtonProps,
    ChargebeeSavedCardWrapper,
    type TaxCountryHook,
    type VatNumberHook,
} from '@proton/payments/ui';
import { TaxFields } from '@proton/payments/ui/components/TaxFields';
import type { User } from '@proton/shared/lib/interfaces';
import { isBilledUser } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import Alert3DS from './Alert3ds';
import { ApplePayView } from './ApplePayView';
import Cash from './Cash';
import DefaultPaymentMethodMessage from './DefaultPaymentMethodMessage';
import { GooglePayView } from './GooglePayView';
import PayPalView from './PayPalView';
import Bitcoin from './bitcoin/Bitcoin';
import BitcoinInfoMessage from './bitcoin/BitcoinInfoMessage';
import PaymentMethodDetails from './methods/PaymentMethodDetails';
import PaymentMethodSelector from './methods/PaymentMethodSelector';
import { getPaymentMethodRequired } from './subscription/helpers/getPaymentMethodRequired';
import { NoPaymentRequiredNote } from './subscription/modal-components/NoPaymentRequiredNote';

export interface Props {
    flow: PaymentMethodFlow;
    method?: PaymentMethodType;
    onMethod: (
        paymentMethod: AvailablePaymentMethod | PlainPaymentMethodType | undefined,
        source?: 'user_action'
    ) => void;
    noMaxWidth?: boolean;
    hideFirstLabel?: boolean;
    hideSavedMethodsDetails?: boolean;
    defaultMethod?: PlainPaymentMethodType;
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
    startTrial,
    currencyOverride,
}: Props) => {
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
        const firstMethod = allMethods[0];
        if (!selectedMethod && firstMethod) {
            onMethod(firstMethod);
        }
    }, [loading, allMethods.length]);

    const { loading: loadingHookProps, ...bitcoinProps } = bitcoinChargebee;

    const loadingBitcoin = useStableLoading([loadingHookProps, !!loadingBitcoinProp]);

    const minCreditAmount = getMinCreditAmount(currency);
    if (flow === 'credit' && amount < minCreditAmount) {
        const price = (
            <Price key="price" currency={currency}>
                {minCreditAmount}
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

    const infoMessages = (
        <>
            {flow === 'subscription' && (
                <DefaultPaymentMethodMessage
                    className="mt-4"
                    savedPaymentMethods={savedPaymentMethods}
                    selectedPaymentMethod={method}
                />
            )}
            {currencyOverride.isCurrencyOverriden && (
                <Banner className="mt-2 mb-4" variant={BannerVariants.INFO}>{c('Payments')
                    .t`Your currency has been changed to euros (€) because SEPA bank transfers only support payments in euros.`}</Banner>
            )}
        </>
    );

    const paymentMethodRequired = getPaymentMethodRequired({
        amount,
        startTrial,
        subscription,
        savedPaymentMethods,
    });

    const taxFields = <TaxFields user={user} taxCountry={taxCountry} vatNumber={vatNumber} />;

    return (
        <>
            <div
                className={clsx('payment-container mx-auto', noMaxWidth === false && 'max-w-full md:max-w-custom')}
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
                            onChange={(paymentMethod) => onMethod(paymentMethod, 'user_action')}
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
                                    suffix={taxFields}
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
                                <div className="mt-2">{taxFields}</div>
                            </>
                        )}
                        {method === PAYMENT_METHOD_TYPES.GOOGLE_PAY && (
                            <>
                                <GooglePayView />
                                <div className="mt-2">{taxFields}</div>
                            </>
                        )}
                        {method === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT && (
                            <>
                                <SepaDirectDebit {...sharedCbProps} />
                                <div className="mt-2">{taxFields}</div>
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
                                        <div className="mt-4">{taxFields}</div>
                                    </>
                                );
                            }

                            return null;
                        })()}
                        {showBitcoinPlaceholder && <BilledUserInlineMessage />}
                        {isPaypalMethod && (
                            <>
                                {taxFields}
                                {showPaypalView ? (
                                    <PayPalView method={method} amount={amount} currency={currency}>
                                        <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
                                            <PayPalInfoMessage />
                                        </div>
                                    </PayPalView>
                                ) : null}
                            </>
                        )}
                        {savedMethod && (
                            <>
                                {!hideSavedMethodsDetails && (
                                    <PaymentMethodDetails type={savedMethod.Type} details={savedMethod.Details} />
                                )}
                                {taxFields}
                                {savedMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && showAlert3ds && (
                                    <Alert3DS />
                                )}
                                {savedMethodRequires3DS(savedMethod.Type) && (
                                    <ChargebeeSavedCardWrapper {...sharedCbProps} />
                                )}
                            </>
                        )}
                        {infoMessages}
                    </div>
                )}
            </div>
            {!paymentMethodRequired && (
                <NoPaymentRequiredNote
                    hasPaymentMethod={!!savedPaymentMethods?.length}
                    subscription={subscription}
                    taxFields={taxFields}
                />
            )}
        </>
    );
};
