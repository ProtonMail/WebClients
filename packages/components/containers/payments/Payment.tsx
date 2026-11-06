import type { Ref } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import useStableLoading from '@proton/hooks/useStableLoading';
import { BilledUserInlineMessage } from '@proton/payments-hooks/client-extensions/billed-user/BilledUserInlineMessage';
import type { ThemeCode } from '@proton/payments-hooks/client-extensions/helpers';
import type { ChargebeePaypalProcessorHook } from '@proton/payments-hooks/payment-processors/useChargebeePaypal';
import type { BitcoinHook } from '@proton/payments-hooks/react-extensions/useBitcoin';
import type { ChargebeeCardProcessorHook } from '@proton/payments-hooks/react-extensions/useChargebeeCard';
import type { ChargebeeIdealProcessorHook } from '@proton/payments-hooks/react-extensions/useChargebeeIdeal';
import type { ChargebeeDirectDebitProcessorHook } from '@proton/payments-hooks/react-extensions/useSepaDirectDebit';
import type { ViewPaymentMethod } from '@proton/payments-ui/client-extensions/useMethods';
import { BitcoinNewMethodForm } from '@proton/payments-ui/payment-methods/bitcoin/BitcoinNewMethodForm';
import { CardNewMethodForm } from '@proton/payments-ui/payment-methods/card/CardNewMethodForm';
import { CashNewMethodForm } from '@proton/payments-ui/payment-methods/cash/CashNewMethodForm';
import { IdealNewMethodForm } from '@proton/payments-ui/payment-methods/ideal/IdealNewMethodForm';
import { PayPalNewMethodForm } from '@proton/payments-ui/payment-methods/paypal/PayPalNewMethodForm';
import { SepaNewMethodForm } from '@proton/payments-ui/payment-methods/sepa/SepaNewMethodForm';
import { TaxFields } from '@proton/payments-ui/ui/billing-address/components/TaxFields';
import type { TaxCountryHook } from '@proton/payments-ui/ui/billing-address/hooks/useTaxCountry';
import type { VatNumberHook } from '@proton/payments-ui/ui/billing-address/hooks/useVatNumber';
import type { CbIframeHandles } from '@proton/payments-ui/ui/components/ChargebeeIframe';
import type { ChargebeePaypalButtonProps } from '@proton/payments-ui/ui/components/ChargebeePaypalButton';
import {
    type ChargebeeCardWrapperProps,
    ChargebeeSavedCardWrapper,
} from '@proton/payments-ui/ui/components/ChargebeeWrapper';
import type { DirectDebitProps } from '@proton/payments-ui/ui/components/SepaDirectDebit';
import { getMinCreditAmount, getMinDonationAmount } from '@proton/payments/core/amount-limits';
import type { BillingAddressStatus } from '@proton/payments/core/billing-address/billing-address';
import { PAYMENT_METHOD_TYPES, PLANS } from '@proton/payments/core/constants';
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
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { methodMatches } from '@proton/payments/core/type-guards';
import type { User } from '@proton/shared/lib/interfaces/User';
import { isBilledUser } from '@proton/shared/lib/interfaces/User';
import clsx from '@proton/utils/clsx';

import Loader from '../../components/loader/Loader';
import Price from '../../components/price/Price';
import Alert3DS from './Alert3ds';
import DefaultPaymentMethodMessage from './DefaultPaymentMethodMessage';
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
    creditCardDetailsRef?: Ref<HTMLDivElement>;
    selectedProcessor: PaymentProcessorHook | undefined;
    processingPayment: boolean;
    checkResult?: SubscriptionEstimation;
    minCreditAmount?: number;
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
    creditCardDetailsRef,
    selectedProcessor,
    processingPayment,
    checkResult,
    minCreditAmount = getMinCreditAmount(currency),
}: Props) => {
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

    if ((flow === 'credit' || flow === 'lumo-credit') && amount < minCreditAmount) {
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

    const infoMessages = (
        <>
            {flow === 'subscription' && (
                <DefaultPaymentMethodMessage
                    className="mt-4"
                    savedPaymentMethods={savedPaymentMethods}
                    selectedPaymentMethod={method}
                />
            )}
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

    const renderNewMethodForm = (newMethod: PlainPaymentMethodType) => {
        switch (newMethod) {
            case PAYMENT_METHOD_TYPES.CHARGEBEE_CARD:
                return (
                    <CardNewMethodForm
                        {...sharedCbProps}
                        themeCode={themeCode}
                        // if we don't let user select the tax country then we still need a fallback way to
                        // collect the card country and the postal code
                        showCountry={!showTaxCountry}
                        creditCardDetailsRef={creditCardDetailsRef}
                        taxFields={taxFields}
                        showAlert3ds={showAlert3ds}
                    />
                );
            case PAYMENT_METHOD_TYPES.CASH:
                return <CashNewMethodForm />;
            case PAYMENT_METHOD_TYPES.APPLE_PAY:
            case PAYMENT_METHOD_TYPES.GOOGLE_PAY:
                return (
                    <div key={newMethod} className="mt-2">
                        {taxFields}
                    </div>
                );
            case PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT:
                return <SepaNewMethodForm {...sharedCbProps} taxFields={taxFields} />;
            case PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL:
                return <IdealNewMethodForm chargebeeIdeal={chargebeeIdeal} taxFields={taxFields} />;
            case PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN:
                if (isBilledUser(user)) {
                    return <BilledUserInlineMessage />;
                }
                if (!isAuthenticated) {
                    return (
                        <p>{c('Info')
                            .t`In the next step, you’ll be able to submit a deposit using a Bitcoin address.`}</p>
                    );
                }
                return (
                    <BitcoinNewMethodForm
                        bitcoin={bitcoinProps}
                        loading={loadingBitcoin || (!!taxCountry && !taxCountry.billingAddressValid)}
                        taxFields={taxFields}
                    />
                );
            case PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL:
                return (
                    <PayPalNewMethodForm
                        amount={amount}
                        currency={currency}
                        taxFields={taxFields}
                        showPaypalView={!isSingleSignup}
                    />
                );
            case PAYMENT_METHOD_TYPES.TOKEN:
                return null;
            default:
                newMethod satisfies never;
                return null;
        }
    };

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
                        {methodMatches(method, Object.values(PAYMENT_METHOD_TYPES)) && renderNewMethodForm(method)}
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
                    isPassBasic={!!checkResult?.requestData.Plans[PLANS.PASS_BASIC]}
                />
            )}
        </>
    );
};
