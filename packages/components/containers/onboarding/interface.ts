import type { ReactNode } from 'react';

export interface OnboardingStepProps {
    children: ReactNode;
}

export interface OnboardingStepRenderCallback {
    onNext: () => void;
    onBack?: () => void;
    displayGenericSteps?: boolean;
}

export type OnboardingStepComponent = (props: OnboardingStepRenderCallback) => ReactNode;
