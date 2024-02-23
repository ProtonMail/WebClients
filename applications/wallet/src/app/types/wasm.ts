import { WasmApiWallet, WasmWalletAccount, WasmWalletKey, WasmWalletSettings } from '../../pkg';

export interface IWasmWallet {
    Wallet: WasmApiWallet;
    WalletKey: WasmWalletKey;
    WalletSettings: WasmWalletSettings;
    WalletAccounts: WasmWalletAccount[];
}
