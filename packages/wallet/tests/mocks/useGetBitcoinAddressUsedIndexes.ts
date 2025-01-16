import type { MockedFunction } from 'vitest';

import * as useBitcoinAddressUsedIndexesModule from '../../store/hooks/useBitcoinAddressUsedIndexes';

export const mockUseBitcoinAddressUsedIndexes = (
    mockedValue?: MockedFunction<ReturnType<typeof useBitcoinAddressUsedIndexesModule.useGetBitcoinAddressUsedIndexes>>
) => {
    const spy = vi.spyOn(useBitcoinAddressUsedIndexesModule, 'useGetBitcoinAddressUsedIndexes');
    spy.mockReturnValue(mockedValue ?? vi.fn());
    return spy;
};
