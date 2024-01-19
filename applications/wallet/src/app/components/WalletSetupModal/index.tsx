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

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const WalletSetupModal = ({ isOpen, onClose }: Props) => {
    const {
        currentStep,
        mnemonic,
        passphrase,
        onSelectSetupMode,
        onMnemonicGenerated,
        onNextStep,
        onSaveNewWallet,
        onMnemonicInput,
    } = useWalletSetupModal({ isOpen, onSetupFinish: onClose });

    const step = useMemo(() => {
        switch (currentStep) {
            case WalletSetupStep.SetupModeChoice:
                return <SetupModeSelect onModeSelection={(mode) => onSelectSetupMode(mode)} />;
            case WalletSetupStep.MnemonicInput:
                return <MnemonicInput onContinue={onMnemonicInput} />;
            case WalletSetupStep.MnemonicGeneration:
                return <MnemonicGeneration onGenerated={onMnemonicGenerated} />;
            case WalletSetupStep.MnemonicBackup:
                return <MnemonicBackup mnemonic={mnemonic} onContinue={onNextStep} />;
            case WalletSetupStep.PassphraseInput:
                return <PassphraseInput onContinue={onSaveNewWallet} />;
            case WalletSetupStep.Confirmation:
                return <SetupConfirmation mnemonic={mnemonic} passphrase={passphrase} onOpenWallet={onNextStep} />;
        }
    }, [currentStep, onMnemonicGenerated, mnemonic, onNextStep, onSaveNewWallet, passphrase, onSelectSetupMode]);

    return (
        <ModalTwo className="p-0" open={isOpen} onClose={onClose} enableCloseWhenClickOutside>
            <ModalContent className="p-0 m-0">{step}</ModalContent>
        </ModalTwo>
    );
};
