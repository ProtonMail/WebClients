import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import type { ThemeCode, usePaymentFacade } from '@proton/components/payments/client-extensions';
import type {
    AvailablePaymentMethod,
    Currency,
    FreeSubscription,
    PAYMENT_METHOD_TYPES,
    Subscription,
} from '@proton/payments';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import type { TaxCountryHook, VatNumberHook } from '@proton/payments/ui';

import { PaymentsNoApi } from './Payment';

export type Props = ReturnType<typeof usePaymentFacade> & {
    noMaxWidth?: boolean;
    hideFirstLabel?: boolean;
    hideSavedMethodsDetails?: boolean;
    isAuthenticated?: boolean;
    defaultMethod?: PAYMENT_METHOD_TYPES;
    themeCode: ThemeCode;
    onMethod?: (availablePaymentMethod: AvailablePaymentMethod | undefined, source?: 'user_action') => void;
    onChargebeeInitialized?: () => void;
    showCardIcons?: boolean;
    startTrial?: boolean;
    onCurrencyChange?: (currency: Currency) => void;
    taxCountry?: TaxCountryHook;
    vatNumber?: VatNumberHook;
    loadingBitcoin?: boolean;
    subscription?: Subscription | FreeSubscription;
};

const PaymentWrapper = ({
    methods,
    isAuthenticated: isAuthenticatedProp,
    onMethod,
    onCurrencyChange,
    ...rest
}: Props) => {
    const { UID } = useAuthentication();
    const { APP_NAME } = useConfig();
    const isAuthenticated = !!UID || !!isAuthenticatedProp;

    return (
        <PaymentsNoApi
            {...rest}
            method={methods.selectedMethod?.value}
            onMethod={(newPaymentMethod, source) => {
                const newPaymentMethodValue =
                    typeof newPaymentMethod === 'string' ? newPaymentMethod : newPaymentMethod?.value;

                const newAvailablePaymentMethod = methods.selectMethod(newPaymentMethodValue);
                onMethod?.(newAvailablePaymentMethod, source);
                if (source === 'user_action' && newAvailablePaymentMethod && rest.checkResult) {
                    checkoutTelemetry.reportSubscriptionEstimationChange({
                        action: 'payment_method_changed',
                        subscription: rest.subscription,
                        userCurrency: rest.user?.Currency,
                        selectedPlanIDs: rest.checkResult.requestData.Plans,
                        selectedCurrency: rest.checkResult.Currency,
                        selectedCycle: rest.checkResult.Cycle,
                        selectedCoupon: rest.checkResult.Coupon?.Code,
                        paymentMethodValue: newAvailablePaymentMethod.value,
                        paymentMethodType: newAvailablePaymentMethod.type,
                        context: rest.telemetryContext,
                        build: APP_NAME,
                        product: rest.product,
                    });
                }

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
