import { usePaymentFacade } from '@proton/components/payments/client-extensions';

import { useAuthentication } from '../..';
import { PaymentsNoApi } from './Payment';

export type Props = ReturnType<typeof usePaymentFacade> & {
    onPaypalCreditClick?: () => void;
    noMaxWidth?: boolean;
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
        />
    );
};

export default PaymentWrapper;
