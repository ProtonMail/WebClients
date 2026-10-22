import type { EventLoop } from '@proton/account/eventLoop';
import type { WasmApiWallet, WasmApiWalletAccount, WasmApiWalletKey, WasmApiWalletSettings } from '@proton/andromeda';
import type { EventItemUpdate } from '@proton/shared/lib/helpers/updateCollection';

export type WalletEvent = EventItemUpdate<WasmApiWallet, 'Wallet'>;
export type WalletAccountEvent = EventItemUpdate<WasmApiWalletAccount, 'WalletAccount'>;
type WalletKeyEvent = EventItemUpdate<WasmApiWalletKey, 'WalletKey'>;
type WalletSettingsEvent = EventItemUpdate<WasmApiWalletSettings, 'WalletSettings'>;

export type WalletEventLoop = EventLoop & {
    Wallets?: WalletEvent[];
    WalletAccounts?: WalletAccountEvent[];
    WalletKeys?: WalletKeyEvent[];
    WalletSettings?: WalletSettingsEvent[];
};
