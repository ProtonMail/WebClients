import type { ReactNode } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import * as WasmBlockchainClientModule from '@proton/andromeda';
import { CacheProvider } from '@proton/components/containers/cache/Provider';
import createCache from '@proton/shared/lib/helpers/cache';
import { getFeesEstimationMap, mockUseWalletApi } from '@proton/wallet/tests';

import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';

const feesEstimationMap = getFeesEstimationMap();

describe('useBlockchainFeesEstimation', () => {
    const mockGetFeesEstimation = vi.fn().mockResolvedValue(feesEstimationMap);

    beforeEach(() => {
        mockUseWalletApi();

        vi.spyOn(WasmBlockchainClientModule, 'WasmBlockchainClient').mockReturnValue({
            getFeesEstimation: mockGetFeesEstimation,
        } as unknown as WasmBlockchainClientModule.WasmBlockchainClient);
    });

    it('should fetch fees estimation once at mount', async () => {
        const { result } = renderHook(() => useBlockchainFeesEstimation(), {
            wrapper: ({ children }: { children: ReactNode }) => (
                <CacheProvider cache={createCache()}> {children}</CacheProvider>
            ),
        });

        await waitFor(() => {
            expect(mockGetFeesEstimation).toHaveBeenCalledTimes(1);
        });

        expect(result.current.loading).toBeFalsy();
        expect(result.current.feesEstimation).toStrictEqual(feesEstimationMap);
    });
});
