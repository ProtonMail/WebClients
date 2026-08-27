import type { ComponentType } from 'react';

import { PaymentsContextProvider } from '@proton/payments-ui/ui/context/PaymentContext';

export const withPaymentContext =
    () =>
    <T extends {}>(Component: ComponentType<T>) =>
        function PaymentContextHOC(props: T & JSX.IntrinsicAttributes) {
            return (
                <PaymentsContextProvider>
                    <Component {...props} />
                </PaymentsContextProvider>
            );
        };
