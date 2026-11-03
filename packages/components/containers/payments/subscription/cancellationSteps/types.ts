import type { ReactNode } from 'react';

import type { Subscription } from '@proton/payments/core/subscription/interface';

export interface CancellationStepConfig {
    canShow: () => Promise<boolean>;
}

export interface CancellationStep<T = void> {
    modal: ReactNode;
    show: () => Promise<T>;
}

export interface SubscriptionCancellationStepConfig {
    canShow: (subscription: Subscription) => Promise<boolean>;
}

export interface SubscriptionCancellationStep<T = void> {
    modal: ReactNode;
    show: (subscription: Subscription) => Promise<T>;
}
