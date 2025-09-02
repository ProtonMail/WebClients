import type { WasmProtonWalletApiClient } from '@proton/andromeda';
import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

export interface WalletThunkArguments extends ProtonThunkArguments {
    walletApi: WasmProtonWalletApiClient;
    notificationsManager: NotificationsManager;
}

export const extraThunkArguments = {} as WalletThunkArguments;
