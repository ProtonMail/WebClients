import type { ReactNode } from 'react';

import { PayPalInfoMessage } from '@proton/payments-hooks/payment-methods/paypal/PayPalInfoMessage';
import type { Currency } from '@proton/payments/core/interface';

import { PayPalView } from './PayPalView';

type Props = {
    amount: number;
    currency: Currency;
    taxFields: ReactNode;
    showPaypalView: boolean;
};

export const PayPalNewMethodForm = ({ amount, currency, taxFields, showPaypalView }: Props) => (
    <>
        {taxFields}
        {showPaypalView && (
            <PayPalView amount={amount} currency={currency}>
                <div className="p-4 border rounded bg-weak mb-4" data-testid="paypal-view">
                    <PayPalInfoMessage />
                </div>
            </PayPalView>
        )}
    </>
);
