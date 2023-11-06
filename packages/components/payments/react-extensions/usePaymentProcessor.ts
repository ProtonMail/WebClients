import { useRef } from 'react';

import { PaymentProcessor } from '../core';

export const usePaymentProcessor = <T extends PaymentProcessor>(init: () => T) => {
    const paymentProcessorRef = useRef<T | null>(null);
    if (!paymentProcessorRef.current) {
        paymentProcessorRef.current = init();
    }

    const paymentProcessor = paymentProcessorRef.current;

    return paymentProcessor;
};
