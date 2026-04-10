import type { ReactNode } from 'react';

interface CancellationStepConfig {
    canShow: () => Promise<boolean>;
}

interface CancellationStep<T = void> {
    modal: ReactNode;
    show: () => Promise<T>;
}

export type { CancellationStep, CancellationStepConfig };
