import { useMemo } from 'react';

import { ModalTwo } from '@proton/components/components';

import {
    MnemonicBackup,
    MnemonicGeneration,
    MnemonicInput,
    PassphraseInput,
    SetupConfirmation,
    SetupModeSelect,
} from './steps';
import { WalletNameAndFiatInput } from './steps/WalletNameAndFiatInput';
import { WalletSetupStep } from './type';
import { useWalletSetupModal } from './useWalletSetupModal';

interface Props {
    isFirstSetup?: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export const WalletSetupModal = ({ isFirstSetup, isOpen, onClose }: Props) => {
    const {
        currentStep,
        mnemonic,
        passphrase,
        walletName,
        onSelectSetupMode,
        onMnemonicGenerated,
        onNextStep,
        onSaveNewWallet,
        onWalletSubmit,
        onMnemonicInput,
    } = useWalletSetupModal({ isOpen, onSetupFinish: onClose });

    const modal = useMemo(() => {
        switch (currentStep) {
            case WalletSetupStep.SetupModeChoice:
                return (
                    <SetupModeSelect isFirstSetup={isFirstSetup} onModeSelection={(mode) => onSelectSetupMode(mode)} />
                );
            case WalletSetupStep.MnemonicInput:
                return <MnemonicInput onContinue={onMnemonicInput} />;
            case WalletSetupStep.MnemonicGeneration:
                return <MnemonicGeneration onGenerated={onMnemonicGenerated} />;
            case WalletSetupStep.MnemonicBackup:
                return <MnemonicBackup mnemonic={mnemonic} onContinue={onNextStep} />;
            case WalletSetupStep.PassphraseInput:
                return <PassphraseInput onContinue={onSaveNewWallet} />;
            case WalletSetupStep.WalletNameAndFiatInput:
                return <WalletNameAndFiatInput onContinue={onWalletSubmit} />;
            case WalletSetupStep.Confirmation:
                return (
                    <SetupConfirmation
                        walletName={walletName}
                        mnemonic={mnemonic}
                        passphrase={passphrase}
                        onOpenWallet={onNextStep}
                    />
                );
        }
    }, [
        isFirstSetup,
        walletName,
        currentStep,
        mnemonic,
        passphrase,
        onMnemonicInput,
        onMnemonicGenerated,
        onNextStep,
        onSaveNewWallet,
        onWalletSubmit,
        onSelectSetupMode,
    ]);

    return (
        <ModalTwo className="p-0" open={isOpen} onClose={onClose} enableCloseWhenClickOutside>
            {modal}
        </ModalTwo>
    );
};
