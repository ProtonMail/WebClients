import { useState } from 'react';

import { walletCreationSetupSteps, walletImportSetupSteps } from './constants';
import { WalletSetupMode, WalletSetupStep } from './type';

interface Props {
    onSetupFinish: () => void;
}

const getSetupSteps = (mode: WalletSetupMode) =>
    mode === WalletSetupMode.Creation ? walletCreationSetupSteps : walletImportSetupSteps;

export const useWalletSetupModal = ({ onSetupFinish }: Props) => {
    const [setupMode, setSetupMode] = useState<WalletSetupMode>();
    const [currentStep, setCurrentStep] = useState<WalletSetupStep>(WalletSetupStep.SetupModeChoice);

    const onNextStep = () => {
        if (!setupMode) {
            return setCurrentStep(WalletSetupStep.SetupModeChoice);
        }

        const steps = getSetupSteps(setupMode);
        const currentStepIndex = steps.findIndex((step) => step === currentStep);

        const isLastStep = currentStepIndex === steps.length - 1;

        if (isLastStep) {
            return onSetupFinish();
        }

        setCurrentStep(steps[currentStepIndex + 1]);
    };

    const onSelectSetupMode = (mode: WalletSetupMode) => {
        const [firstStep] = getSetupSteps(mode);

        setSetupMode(mode);
        setCurrentStep(firstStep);
    };

    return {
        onSelectSetupMode,
        onNextStep,
        currentStep,
        setupMode,
    };
};
