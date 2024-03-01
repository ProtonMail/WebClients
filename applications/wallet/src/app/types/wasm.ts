import { WasmApiWallet, WasmWalletAccount, WasmWalletKey, WasmWalletSettings } from '../../pkg';

export interface IWasmWallet {
    Wallet: WasmApiWallet;
    WalletAccounts: WasmWalletAccount[];
    WalletKey?: WasmWalletKey;
    WalletSettings?: WasmWalletSettings;
}
