import React from 'react';

export interface OnboardingStepProps {
    title: React.ReactNode;
    submit: React.ReactNode;
    close: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    onSubmit?: () => void;
    onClose?: () => void;
}

export interface OnboardingStepRenderCallback {
    onNext: () => void;
    onBack?: () => void;
    onClose?: () => void;
}
