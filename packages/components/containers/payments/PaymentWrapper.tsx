import type { ThemeCode, usePaymentFacade } from '@proton/components/payments/client-extensions';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments';

import { useAuthentication } from '../../hooks';
import { PaymentsNoApi } from './Payment';
import type { BillingAddressStatus } from './subscription/helpers';

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
};

const PaymentWrapper = ({
    card,
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
}: Props) => {
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID || !!isAuthenticatedProp;

    return (
        <PaymentsNoApi
            type={flow}
            method={methods.selectedMethod?.value}
            amount={amount}
            currency={currency}
            card={card.card}
            onMethod={(value) => {
                methods.selectMethod(value);
                onMethod?.(value);
            }}
            onCard={card.setCardProperty}
            cardErrors={card.errors}
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
            cardFieldStatus={card.fieldsStatus}
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
        />
    );
};

export default PaymentWrapper;
