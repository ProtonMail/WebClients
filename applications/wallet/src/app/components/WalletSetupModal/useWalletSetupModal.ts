import { useEffect, useState } from 'react';

import { WasmMnemonic } from '../../../pkg';
import { walletCreationSetupSteps, walletImportSetupSteps } from './constants';
import { WalletSetupMode, WalletSetupStep } from './type';

interface Props {
    onSetupFinish: () => void;
    isOpen: boolean;
}

const getSetupSteps = (mode: WalletSetupMode) =>
    mode === WalletSetupMode.Creation ? walletCreationSetupSteps : walletImportSetupSteps;

export const useWalletSetupModal = ({ onSetupFinish, isOpen }: Props) => {
    const [mnemonic, setMnemonic] = useState<WasmMnemonic>();
    const [passphrase, setPassphrase] = useState<string>();
    const [walletName, setWalletName] = useState<string>('');
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

    const onMnemonicInput = (mnemonic: WasmMnemonic) => {
        setMnemonic(mnemonic);
        onNextStep();
    };

    const onMnemonicGenerated = (mnemonic: WasmMnemonic) => {
        setMnemonic(mnemonic);
        onNextStep();
    };

    const onSaveNewWallet = (passphrase: string) => {
        setPassphrase(passphrase);

        onNextStep();
    };

    const onWalletSubmit = (name: string, fiatCurrency: string) => {
        // TODO: check and encrypt mnemonic
        const encryptedMnemonic = mnemonic?.asString();
        const hasPassphrase = !!passphrase;

        // eslint-disable-next-line no-console
        console.log(encryptedMnemonic, hasPassphrase, name, fiatCurrency);

        // TODO: API req to create wallet

        setWalletName(name);
        onNextStep();
    };

    const clear = () => {
        setMnemonic(undefined);
        setSetupMode(undefined);
        setCurrentStep(WalletSetupStep.SetupModeChoice);
    };

    useEffect(() => {
        if (!isOpen) {
            clear();
        }
    }, [isOpen]);

    return {
        onSelectSetupMode,
        onMnemonicGenerated,
        onMnemonicInput,
        onNextStep,
        setMnemonic,
        onWalletSubmit,
        onSaveNewWallet,
        clear,
        walletName,
        currentStep,
        setupMode,
        mnemonic,
        passphrase,
    };
};
