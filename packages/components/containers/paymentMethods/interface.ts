import { PaymentMethodType } from '@proton/shared/lib/interfaces';

import { IconName } from '../../components/icon';

export interface PaymentMethodData {
    icon?: IconName;
    value: PaymentMethodType;
    text: string;
    disabled?: boolean;
}

export type PaymentMethodFlows = 'invoice' | 'signup' | 'human-verification' | 'credit' | 'donation' | 'subscription';
