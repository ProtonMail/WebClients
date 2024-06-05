import { MockedFunction } from 'vitest';

import * as useExchangeRateModule from '../../store/hooks/useExchangeRate';
import { exchangeRate } from '../fixtures/api';

export const mockUseGetExchangeRate = (
    mockedValue?: MockedFunction<ReturnType<typeof useExchangeRateModule.useGetExchangeRate>>
) => {
    const spy = vi.spyOn(useExchangeRateModule, 'useGetExchangeRate');

    spy.mockReturnValue(mockedValue ?? vi.fn().mockResolvedValue(exchangeRate));

    return spy;
};
