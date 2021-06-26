import { PAYMENT_METHOD_TYPE } from '@proton/shared/lib/constants';

export interface PaymentMethodData {
    icon: string;
    value: PAYMENT_METHOD_TYPE;
    text: string;
    disabled?: boolean;
}
export type PaymentMethodFlows = 'invoice' | 'signup' | 'human-verification' | 'credit' | 'donation' | 'subscription';
