import { WasmMnemonic } from '@proton/andromeda';

/**
 * Wallet setup scheme defines necessary steps
 */
export enum WalletSetupScheme {
    /**
     * Use case: user click on wallet setup button and selects `create new wallet`
     */
    ManualCreation = 'ManualCreation',

    /**
     * Use case: user click on wallet setup button and selects `import wallet`
     */
    WalletImport = 'WalletImport',

    /**
     *
     * Use case: on first user login, if user has no wallet, we use this quick flow
     */
    WalletAutocreationFinalize = 'WalletAutocreationFinalize',

    /**
     *
     * Use case: after autocreation, user can click on `Back up your wallet` in the discover checklist, then we use this scheme.
     */
    WalletAutocreationBackup = 'WalletAutocreationBackup',
}

export type SchemeAndData =
    | { scheme: WalletSetupScheme.WalletAutocreationBackup; mnemonic: WasmMnemonic }
    /**
     * If walletId is truthy, this means that a wallet has already been autocreated and setup only needs to be finalised (only settings step to display)
     */
    | { scheme: WalletSetupScheme.WalletAutocreationFinalize; walletId?: string }
    | { scheme: WalletSetupScheme.ManualCreation }
    | { scheme: WalletSetupScheme.WalletImport };

export enum WalletSetupStep {
    Intro = 'Intro',
    MnemonicInput = 'MnemonicInput',
    PassphraseInput = 'PassphraseInput',
    MnemonicBackup = 'MnemonicBackup',
    Settings = 'Settings',
}
