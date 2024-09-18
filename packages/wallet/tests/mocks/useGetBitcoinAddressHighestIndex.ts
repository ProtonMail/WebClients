import type { MockedFunction } from 'vitest';

import * as useBitcoinAddressHighestIndexModule from '../../store/hooks/useBitcoinAddressHighestIndex';

export const mockUseBitcoinAddressHighestIndexModule = (
    mockedValue?: MockedFunction<
        ReturnType<typeof useBitcoinAddressHighestIndexModule.useGetBitcoinAddressHighestIndex>
    >
) => {
    const spy = vi.spyOn(useBitcoinAddressHighestIndexModule, 'useGetBitcoinAddressHighestIndex');

    spy.mockReturnValue(mockedValue ?? vi.fn());

    return spy;
};
