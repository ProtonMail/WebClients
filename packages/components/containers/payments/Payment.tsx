import type { Ref } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { useStableLoading } from '@proton/hooks';
import type { useCurrencyOverride } from '@proton/payments-ui/payment-methods/useCurrencyOverride';
import { TaxFields } from '@proton/payments-ui/ui/billing-address/components/TaxFields';
import type { TaxCountryHook } from '@proton/payments-ui/ui/billing-address/hooks/useTaxCountry';
import type { VatNumberHook } from '@proton/payments-ui/ui/billing-address/hooks/useVatNumber';
import type { CbIframeHandles } from '@proton/payments-ui/ui/components/ChargebeeIframe';
import type { ChargebeePaypalButtonProps } from '@proton/payments-ui/ui/components/ChargebeePaypalButton';
import {
    type ChargebeeCardWrapperProps,
    ChargebeeCreditCardWrapper,
    ChargebeeSavedCardWrapper,
} from '@proton/payments-ui/ui/components/ChargebeeWrapper';
import { getMinCreditAmount, getMinDonationAmount } from '@proton/payments/core/amount-limits';
import type { BillingAddressStatus } from '@proton/payments/core/billing-address/billing-address';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { savedMethodRequires3DS } from '@proton/payments/core/createPaymentToken';
import type {
    AvailablePaymentMethod,
    Currency,
    FreeSubscription,
    PaymentMethodFlow,
    PaymentMethodType,
    PlainPaymentMethodType,
    SavedPaymentMethod,
} from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { User } from '@proton/shared/lib/interfaces';
import { isBilledUser } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import Loader from '../../components/loader/Loader';
import Price from '../../components/price/Price';
import { IdealAccountHolderInput } from '../../payments/chargebee/IdealAccountHolderInput';
import { IdealAuthorizationText } from '../../payments/chargebee/IdealAuthorizationText';
import { type DirectDebitProps, SepaDirectDebit } from '../../payments/chargebee/SepaDirectDebit';
import { BilledUserInlineMessage } from '../../payments/client-extensions/billed-user/index';
import type { ThemeCode, ViewPaymentMethod } from '../../payments/client-extensions/index';
import type { BitcoinHook } from '../../payments/react-extensions/useBitcoin';
import type { ChargebeeCardProcessorHook } from '../../payments/react-extensions/useChargebeeCard';
import type { ChargebeeIdealProcessorHook } from '../../payments/react-extensions/useChargebeeIdeal';
import type { ChargebeePaypalProcessorHook } from '../../payments/react-extensions/useChargebeePaypal';
import type { ChargebeeDirectDebitProcessorHook } from '../../payments/react-extensions/useSepaDirectDebit';
import Alert3DS from './Alert3ds';
import { ApplePayView } from './ApplePayView';
import Cash from './Cash';
import DefaultPaymentMethodMessage from './DefaultPaymentMethodMessage';
import { GooglePayView } from './GooglePayView';
import { IdealInfoMessage } from './IdealInfoMessage';
import PayPalInfoMessage from './PayPalInfoMessage';
import PayPalView from './PayPalView';
import Bitcoin from './bitcoin/Bitcoin';
import BitcoinInfoMessage from './bitcoin/BitcoinInfoMessage';
import { CurrencyOverrideBannerText } from './currencyOverrideBannerText';
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
    chargebeeIdeal: ChargebeeIdealProcessorHook;
    user: User | undefined;
    startTrial?: boolean;
    lastUsedMethod?: ViewPaymentMethod;
    allMethods: ViewPaymentMethod[];
    isAuthenticated: boolean;
    loading: boolean;
    savedMethod?: SavedPaymentMethod;
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
    currencyOverride: ReturnType<typeof useCurrencyOverride>;
    creditCardDetailsRef?: Ref<HTMLDivElement>;
    selectedProcessor: PaymentProcessorHook | undefined;
    processingPayment: boolean;
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
    savedMethod,
    hideFirstLabel,
    hideSavedMethodsDetails,
    defaultMethod,
    iframeHandles,
    chargebeeCard,
    chargebeePaypal,
    chargebeeIdeal,
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
    creditCardDetailsRef,
    selectedProcessor,
    processingPayment,
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
            <Banner className="mb-4" variant={BannerVariants.DANGER}>{c('Error')
                .jt`The minimum amount of credit that can be added is ${price}`}</Banner>
        );
    }

    const minDonationAmount = getMinDonationAmount(currency);
    if (flow === 'reservation-donation' && amount < minDonationAmount) {
        const price = (
            <Price key="price" currency={currency}>
                {minDonationAmount}
            </Price>
        );
        return (
            <Banner className="mb-4" variant={BannerVariants.DANGER}>{c('Error')
                .jt`The minimum donation amount is ${price}`}</Banner>
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
        flow === 'signup-v2-upgrade' ||
        flow === 'reservation-donation'
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
            {currencyOverride.isCurrencyOverriden && <CurrencyOverrideBannerText selectedMethod={method} />}
        </>
    );

    const paymentMethodRequired = getPaymentMethodRequired({
        amount,
        startTrial,
        subscription,
        savedPaymentMethods,
    });

    const taxFields = (
        <TaxFields user={user} taxCountry={taxCountry} vatNumber={vatNumber} subscription={subscription} />
    );

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
                            disabled={selectedProcessor?.userInitiatedProcessing || processingPayment}
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
                                    creditCardDetailsRef={creditCardDetailsRef}
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
                        {method === PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL && (
                            <>
                                <IdealAccountHolderInput chargebeeIdeal={chargebeeIdeal} />
                                <div className="my-2">
                                    <IdealAuthorizationText />
                                </div>
                                {taxFields}
                                <div className="p-4 border rounded bg-weak mb-4" data-testid="ideal-view">
                                    <IdealInfoMessage />
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
