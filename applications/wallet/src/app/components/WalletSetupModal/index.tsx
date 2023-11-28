import { useMemo } from 'react';

import { ModalTwo } from '@proton/components/components';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

import {
    MnemonicBackup,
    MnemonicGeneration,
    MnemonicInput,
    PassphraseInput,
    SetupConfirmation,
    SetupModeSelect,
} from './steps';
import { WalletSetupStep } from './type';
import { useWalletSetupModal } from './useWalletSetupModal';

import './WalletSetupModal.scss';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const WalletSetupModal = ({ isOpen, onClose }: Props) => {
    const { currentStep, onSelectSetupMode, onNextStep } = useWalletSetupModal({ onSetupFinish: onClose });

    const step = useMemo(() => {
        switch (currentStep) {
            case WalletSetupStep.SetupModeChoice:
                return <SetupModeSelect onModeSelection={(mode) => onSelectSetupMode(mode)} />;
            case WalletSetupStep.MnemonicInput:
                return <MnemonicInput />;
            case WalletSetupStep.MnemonicGeneration:
                return <MnemonicGeneration onGenerated={onNextStep} />;
            case WalletSetupStep.MnemonicBackup:
                return <MnemonicBackup onContinue={onNextStep} />;
            case WalletSetupStep.PassphraseInput:
                return <PassphraseInput onContinue={onNextStep} />;
            case WalletSetupStep.Confirmation:
                return <SetupConfirmation onOpenWallet={onNextStep} />;
        }
    }, [currentStep, onNextStep, onSelectSetupMode]);

    return (
        <ModalTwo className="p-0" open={isOpen} onClose={onClose}>
            <ModalContent className="p-0 m-0">{step}</ModalContent>
        </ModalTwo>
    );
};
