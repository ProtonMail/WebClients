import { ReactNode } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import CacheProvider from '@proton/components/containers/cache/Provider';
import createCache from '@proton/shared/lib/helpers/cache';

import * as WasmBlockchainModule from '../../pkg';
import { getFeesEstimationMap } from '../tests';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';

const feesEstimationMap = getFeesEstimationMap();

describe('useBlockchainFeesEstimation', () => {
    const mockGetFeesEstimation = vi.fn().mockResolvedValue(feesEstimationMap);

    vi.spyOn(WasmBlockchainModule, 'WasmBlockchain').mockReturnValue({
        getFeesEstimation: mockGetFeesEstimation,
    } as unknown as WasmBlockchainModule.WasmBlockchain);

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
