import { ReactNode } from 'react';

export interface OnboardingStepProps {
    submit: ReactNode;
    close: ReactNode;
    children: ReactNode;
    loading?: boolean;
    onSubmit?: () => void;
    onClose?: () => void;
}

export interface OnboardingStepRenderCallback {
    onNext: () => void;
    onBack?: () => void;
    displayGenericSteps?: boolean;
}
