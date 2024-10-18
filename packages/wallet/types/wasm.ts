import type { WasmApiWallet, WasmApiWalletAccount, WasmApiWalletKey, WasmApiWalletSettings } from '@proton/andromeda';

export type ApiWalletWithPassphraseInput = WasmApiWallet & { Passphrase?: string };
export type DecryptedApiWalletKey = WasmApiWalletKey & { DecryptedKey?: CryptoKey };

export interface IWasmApiWalletData {
    Wallet: ApiWalletWithPassphraseInput;
    WalletAccounts: WasmApiWalletAccount[];
    WalletKey?: DecryptedApiWalletKey;
    WalletSettings?: WasmApiWalletSettings;
    IsNotDecryptable?: boolean;
}
