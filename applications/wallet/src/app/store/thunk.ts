import { WasmProtonWalletApiClient } from '@proton/andromeda';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';

export interface WalletThunkArguments extends ProtonThunkArguments {
    rustApi: WasmProtonWalletApiClient;
}

export const extraThunkArguments = {} as WalletThunkArguments;
