import type { MockedFunction } from 'vitest';

import { exchangeRate } from '@proton/wallet/tests';

import * as useExchangeRateModule from '../../store/hooks/useExchangeRate';

export const mockUseGetExchangeRate = (
    mockedValue?: MockedFunction<ReturnType<typeof useExchangeRateModule.useGetExchangeRate>>
) => {
    const spy = vi.spyOn(useExchangeRateModule, 'useGetExchangeRate');

    spy.mockReturnValue(mockedValue ?? vi.fn().mockResolvedValue(exchangeRate));

    return spy;
};
