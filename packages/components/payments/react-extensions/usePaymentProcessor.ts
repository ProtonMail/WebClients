import { useRef } from 'react';

import { type PaymentProcessor } from '@proton/payments';

/**
 * An internal helper to avoid re-initialization of the payment processor on every render.
 * The init function is supposed to return a new instance of the payment processor.
 */
export const usePaymentProcessor = <T extends PaymentProcessor>(init: () => T) => {
    const paymentProcessorRef = useRef<T | null>(null);
    if (!paymentProcessorRef.current) {
        paymentProcessorRef.current = init();
    }

    const paymentProcessor = paymentProcessorRef.current;

    return paymentProcessor;
};
