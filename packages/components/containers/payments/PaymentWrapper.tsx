import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';

import { useAuthentication } from '../..';
import { Props as PaymentProps, PaymentsNoApi } from './Payment';

export type Props = ReturnType<typeof usePaymentFacade> & {
    onPaypalCreditClick?: () => void;
    noMaxWidth?: boolean;
    onBitcoinTokenValidated?: PaymentProps['onBitcoinTokenValidated'];
    onAwaitingBitcoinPayment?: PaymentProps['onAwaitingBitcoinPayment'];
    triggersDisabled?: boolean;
    hideFirstLabel?: boolean;
    hideSavedMethodsDetails?: boolean;
    disabled?: boolean;
    isAuthenticated?: boolean;
    defaultMethod?: PAYMENT_METHOD_TYPES;
};

const PaymentWrapper = ({
    card,
    api,
    flow,
    methods,
    amount,
    currency,
    paypal,
    paypalCredit,
    noMaxWidth,
    onPaypalCreditClick,
    onBitcoinTokenValidated,
    onAwaitingBitcoinPayment,
    triggersDisabled,
    hideFirstLabel,
    hideSavedMethodsDetails,
    disabled,
    isAuthenticated: isAuthenticatedProp,
    defaultMethod,
}: Props) => {
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID || !!isAuthenticatedProp;

    return (
        <PaymentsNoApi
            api={api}
            type={flow}
            method={methods.selectedMethod?.value}
            amount={amount}
            currency={currency}
            card={card.card}
            onMethod={methods.selectMethod}
            onCard={card.setCardProperty}
            cardErrors={card.errors}
            paypal={paypal}
            paypalCredit={paypalCredit}
            lastUsedMethod={methods.lastUsedMethod}
            loading={methods.loading}
            customPaymentMethod={methods.savedSelectedMethod}
            allMethods={methods.allMethods}
            isAuthenticated={isAuthenticated}
            noMaxWidth={noMaxWidth}
            onPaypalCreditClick={onPaypalCreditClick}
            onBitcoinTokenValidated={onBitcoinTokenValidated}
            onAwaitingBitcoinPayment={onAwaitingBitcoinPayment}
            triggersDisabled={triggersDisabled}
            hideFirstLabel={hideFirstLabel}
            cardFieldStatus={card.fieldsStatus}
            hideSavedMethodsDetails={hideSavedMethodsDetails}
            disabled={disabled}
            defaultMethod={defaultMethod}
        />
    );
};

export default PaymentWrapper;
