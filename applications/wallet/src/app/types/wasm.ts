import { WasmApiWallet, WasmApiWalletAccount, WasmApiWalletKey, WasmApiWalletSettings } from '@proton/andromeda';

export type ApiWalletWithPassphraseInput = WasmApiWallet & { Passphrase?: string };

export interface IWasmApiWalletData {
    Wallet: ApiWalletWithPassphraseInput;
    WalletAccounts: WasmApiWalletAccount[];
    WalletKey?: WasmApiWalletKey;
    WalletSettings?: WasmApiWalletSettings;
}
