import { PAYMENT_METHOD_TYPE } from '@proton/shared/lib/constants';

import { IconName } from '../../components';

export interface PaymentMethodData {
    icon?: IconName;
    value: PAYMENT_METHOD_TYPE;
    text: string;
    disabled?: boolean;
}

export type PaymentMethodFlows = 'invoice' | 'signup' | 'human-verification' | 'credit' | 'donation' | 'subscription';
