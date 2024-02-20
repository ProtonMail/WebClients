import type { ProtonThunkArguments } from '@proton/redux-shared-store';

import { WasmProtonWalletApiClient } from '../../pkg';

export interface WalletThunkArguments extends ProtonThunkArguments {
    rustApi: WasmProtonWalletApiClient;
}

export const extraThunkArguments = {} as WalletThunkArguments;
