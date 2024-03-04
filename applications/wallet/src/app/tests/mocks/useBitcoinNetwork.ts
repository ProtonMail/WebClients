import { WasmNetwork } from '@proton/andromeda';

import * as useBitcoinNetworkModule from '../../store/hooks/useBitcoinNetwork';

export const mockUseBitcoinNetwork = (
    mockedValue?: Partial<ReturnType<typeof useBitcoinNetworkModule.useBitcoinNetwork>>
) => {
    const spy = vi.spyOn(useBitcoinNetworkModule, 'useBitcoinNetwork');

    spy.mockReturnValue([mockedValue?.[0] ?? WasmNetwork.Testnet, mockedValue?.[1] ?? false]);

    return spy;
};
