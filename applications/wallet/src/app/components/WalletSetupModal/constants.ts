import { WalletSetupStep } from './type';

export const walletCreationSetupSteps = [
    WalletSetupStep.MnemonicGeneration,
    WalletSetupStep.MnemonicBackup,
    WalletSetupStep.PassphraseInput,
    WalletSetupStep.Confirmation,
];

export const walletImportSetupSteps = [
    WalletSetupStep.MnemonicInput,
    WalletSetupStep.PassphraseInput,
    WalletSetupStep.Confirmation,
];
