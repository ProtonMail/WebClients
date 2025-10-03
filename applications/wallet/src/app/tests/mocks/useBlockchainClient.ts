import type { WasmBlockchainClient } from '@proton/andromeda';

import * as useBlockchainClientModule from '../../hooks/useBlockchainClient';

export const mockUseBlockchainClient = (
    mockedValue?: Partial<Pick<WasmBlockchainClient, 'getFeesEstimation' | 'getMininumFees' | 'broadcastPsbt'>>
) => {
    const spy = vi.spyOn(useBlockchainClientModule, 'useBlockchainClient');

    spy.mockReturnValue({
        getFeesEstimation: vi.fn(),
        getMininumFees: vi.fn(),
        getRecommendedFees: vi.fn(),
        broadcastPsbt: vi.fn(),
        free: vi.fn(),
        [Symbol.dispose]: vi.fn(),
        ...mockedValue,
    });

    return spy;
};
