import { WasmApiWallet, WasmWalletKey, WasmWalletSettings } from '../../pkg';

export interface IWasmWallet {
    Wallet: WasmApiWallet;
    WalletKey: WasmWalletKey;
    WalletSettings: WasmWalletSettings;
}
