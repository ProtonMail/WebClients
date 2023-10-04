import { usePaymentFacade } from '@proton/components/payments/client-extensions';

import { useAuthentication } from '../..';
import { Props as PaymentProps, PaymentsNoApi } from './Payment';

export type Props = ReturnType<typeof usePaymentFacade> & {
    onPaypalCreditClick?: () => void;
    noMaxWidth?: boolean;
    onBitcoinTokenValidated?: PaymentProps['onBitcoinTokenValidated'];
    onAwaitingBitcoinPayment?: PaymentProps['onAwaitingBitcoinPayment'];
    triggersDisabled?: boolean;
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
}: Props) => {
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;

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
        />
    );
};

export default PaymentWrapper;
