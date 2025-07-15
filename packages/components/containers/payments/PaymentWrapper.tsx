import useAuthentication from '@proton/components/hooks/useAuthentication';
import type { ThemeCode, usePaymentFacade } from '@proton/components/payments/client-extensions';
import type { Currency, PAYMENT_METHOD_TYPES } from '@proton/payments';
import { type FreeSubscription, type Subscription } from '@proton/payments';
import { type TaxCountryHook, type VatNumberHook } from '@proton/payments/ui';
import type { Organization } from '@proton/shared/lib/interfaces';

import { PaymentsNoApi } from './Payment';

export type Props = ReturnType<typeof usePaymentFacade> & {
    noMaxWidth?: boolean;
    hideFirstLabel?: boolean;
    hideSavedMethodsDetails?: boolean;
    isAuthenticated?: boolean;
    defaultMethod?: PAYMENT_METHOD_TYPES;
    themeCode: ThemeCode;
    onMethod?: (method: string | undefined) => void;
    onChargebeeInitialized?: () => void;
    showCardIcons?: boolean;
    startTrial?: boolean;
    onCurrencyChange?: (currency: Currency) => void;
    taxCountry?: TaxCountryHook;
    vatNumber?: VatNumberHook;
    loadingBitcoin?: boolean;
    subscription?: Subscription | FreeSubscription;
    organization?: Organization;
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
            savedPaymentMethods={methods.savedMethods ?? []}
        />
    );
};

export default PaymentWrapper;
