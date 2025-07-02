import useAuthentication from '@proton/components/hooks/useAuthentication';
import type { ThemeCode, usePaymentFacade } from '@proton/components/payments/client-extensions';
import type { BillingAddressStatus, Currency, PAYMENT_METHOD_TYPES } from '@proton/payments';

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
    onCurrencyChange?: (currency: Currency) => void;
};

const PaymentWrapper = ({
    methods,
    isAuthenticated: isAuthenticatedProp,
    onMethod,
    onCurrencyChange,
    ...rest
}: Props) => {
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID || !!isAuthenticatedProp;

    return (
        <PaymentsNoApi
            {...rest}
            method={methods.selectedMethod?.value}
            onMethod={(newPaymentMethodValue) => {
                methods.selectMethod(newPaymentMethodValue);
                onMethod?.(newPaymentMethodValue);

                const maybeNewCurrency = rest.currencyOverride.updateCurrencyOverride(newPaymentMethodValue);
                if (maybeNewCurrency) {
                    onCurrencyChange?.(maybeNewCurrency);
                }
            }}
            lastUsedMethod={methods.lastUsedMethod}
            loading={methods.loading}
            savedMethodInternal={methods.savedInternalSelectedMethod}
            savedMethodExternal={methods.savedExternalSelectedMethod}
            allMethods={methods.allMethods}
            isAuthenticated={isAuthenticated}
            paymentStatus={methods.status}
            savedPaymentMethods={methods.savedMethods ?? []}
        />
    );
};

export default PaymentWrapper;
