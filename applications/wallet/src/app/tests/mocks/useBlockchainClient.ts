import type { WasmBlockchainClient } from '@proton/andromeda';

import * as useBlockchainClientModule from '../../hooks/useBlockchainClient';

export const mockUseBlockchainClient = (
    mockedValue?: Partial<
        Pick<
            WasmBlockchainClient,
            'getFeesEstimation' | 'getMempoolMinFee' | 'fullSync' | 'partialSync' | 'shouldSync' | 'broadcastPsbt'
        >
    >
) => {
    const spy = vi.spyOn(useBlockchainClientModule, 'useBlockchainClient');

    spy.mockReturnValue({
        getFeesEstimation: vi.fn(),
        getMempoolMinFee: vi.fn(),
        fullSync: vi.fn(),
        partialSync: vi.fn(),
        shouldSync: vi.fn(),
        broadcastPsbt: vi.fn(),
        free: vi.fn(),
        ...mockedValue,
    });

    return spy;
};
