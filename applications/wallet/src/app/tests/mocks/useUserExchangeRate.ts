import * as useUserExchangeRateModule from '../../hooks/useUserExchangeRate';
import { exchangeRate } from '../fixtures/api';

export const mockUseUserExchangeRate = (
    mockedValue?: ReturnType<typeof useUserExchangeRateModule.useUserExchangeRate>[0] | null
) => {
    const spy = vi.spyOn(useUserExchangeRateModule, 'useUserExchangeRate');

    spy.mockReturnValue([mockedValue === undefined ? exchangeRate : mockedValue ?? undefined, false]);

    return spy;
};
