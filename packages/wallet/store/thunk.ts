import type { WasmProtonWalletApiClient } from '@proton/andromeda';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';

export interface WalletSettingsThunkArguments extends ProtonThunkArguments {
    walletApi: WasmProtonWalletApiClient;
}

export const extraThunkArguments = {} as WalletSettingsThunkArguments;
