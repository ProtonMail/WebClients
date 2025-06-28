import useAuthentication from '@proton/components/hooks/useAuthentication';
import type { ThemeCode, usePaymentFacade } from '@proton/components/payments/client-extensions';
import type { BillingAddressStatus, PAYMENT_METHOD_TYPES } from '@proton/payments';

import { PaymentsNoApi } from './Payment';

export type Props = ReturnType<typeof usePaymentFacade> & {
    onPaypalCreditClick?: () => void;
    noMaxWidth?: boolean;
    triggersDisabled?: boolean;
    hideFirstLabel?: boolean;
    hideSavedMethodsDetails?: boolean;
    disabled?: boolean;
    isAuthenticated?: boolean;
    defaultMethod?: PAYMENT_METHOD_TYPES;
    hasSomeVpnPlan: boolean;
    themeCode: ThemeCode;
    onMethod?: (method: string | undefined) => void;
    billingAddressStatus?: BillingAddressStatus;
    onChargebeeInitialized?: () => void;
    showCardIcons?: boolean;
    isTrial?: boolean;
    isCurrencyOverriden?: boolean;
};

const PaymentWrapper = ({
    flow,
    methods,
    amount,
    currency,
    paypal,
    paypalCredit,
    noMaxWidth,
    onPaypalCreditClick,
    triggersDisabled,
    hideFirstLabel,
    hideSavedMethodsDetails,
    disabled,
    isAuthenticated: isAuthenticatedProp,
    defaultMethod,
    iframeHandles,
    chargebeeCard,
    chargebeePaypal,
    hasSomeVpnPlan,
    paymentComponentLoaded,
    themeCode,
    bitcoinInhouse,
    bitcoinChargebee,
    isChargebeeEnabled,
    onMethod,
    user,
    billingAddressStatus,
    directDebit,
    onChargebeeInitialized,
    showCardIcons,
    isTrial,
    isCurrencyOverriden,
}: Props) => {
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID || !!isAuthenticatedProp;

    return (
        <PaymentsNoApi
            type={flow}
            method={methods.selectedMethod?.value}
            amount={amount}
            currency={currency}
            onMethod={(value) => {
                methods.selectMethod(value);
                onMethod?.(value);
            }}
            paypal={paypal}
            paypalCredit={paypalCredit}
            lastUsedMethod={methods.lastUsedMethod}
            loading={methods.loading}
            savedMethodInternal={methods.savedInternalSelectedMethod}
            savedMethodExternal={methods.savedExternalSelectedMethod}
            allMethods={methods.allMethods}
            isAuthenticated={isAuthenticated}
            noMaxWidth={noMaxWidth}
            onPaypalCreditClick={onPaypalCreditClick}
            triggersDisabled={triggersDisabled}
            hideFirstLabel={hideFirstLabel}
            hideSavedMethodsDetails={hideSavedMethodsDetails}
            disabled={disabled}
            defaultMethod={defaultMethod}
            iframeHandles={iframeHandles}
            chargebeeCard={chargebeeCard}
            chargebeePaypal={chargebeePaypal}
            hasSomeVpnPlan={hasSomeVpnPlan}
            paymentComponentLoaded={paymentComponentLoaded}
            themeCode={themeCode}
            bitcoinInhouse={bitcoinInhouse}
            bitcoinChargebee={bitcoinChargebee}
            isChargebeeEnabled={isChargebeeEnabled}
            user={user}
            billingAddressStatus={billingAddressStatus}
            paymentStatus={methods.status}
            directDebit={directDebit}
            onChargebeeInitialized={onChargebeeInitialized}
            showCardIcons={showCardIcons}
            savedPaymentMethods={methods.savedMethods ?? []}
            isTrial={isTrial}
            isCurrencyOverriden={!!isCurrencyOverriden}
        />
    );
};

export default PaymentWrapper;
