import { EventLoop } from '@proton/account';
import { EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';

import { WasmApiWallet, WasmWalletAccount, WasmWalletKey, WasmWalletSettings } from '../../pkg';

export type WalletEvent = EventItemUpdate<WasmApiWallet, 'Wallet'>;
export type WalletAccountEvent = EventItemUpdate<WasmWalletAccount, 'WalletAccount'>;
export type WalletKeyEvent = EventItemUpdate<WasmWalletKey, 'WalletKey'>;
export type WalletSettingsEvent = EventItemUpdate<WasmWalletSettings, 'WalletSettings'>;

export type WalletEventLoop = EventLoop & {
    Wallets?: WalletEvent[];
    WalletAccounts?: WalletAccountEvent[];
    WalletKeys?: WalletKeyEvent[];
    WalletSettings?: WalletSettingsEvent[];
};
