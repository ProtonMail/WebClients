export enum WalletSetupMode {
    Creation = 'Creation',
    Import = 'Import',
}

export enum WalletSetupStep {
    SetupModeChoice = 'SetupModeChoice',
    MnemonicInput = 'MnemonicInput',
    MnemonicGeneration = 'MnemonicGeneration',
    PassphraseInput = 'PassphraseInput',
    MnemonicBackup = 'MnemonicBackup',
    Confirmation = 'Confirmation',
}
