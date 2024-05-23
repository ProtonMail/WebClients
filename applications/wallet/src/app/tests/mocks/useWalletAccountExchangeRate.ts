import * as useWalletAccountExchangeRateModule from '../../hooks/useWalletAccountExchangeRate';
import { exchangeRate } from '../fixtures/api';

export const mockUseWalletAccountExchangeRate = (
    mockedValue?: ReturnType<typeof useWalletAccountExchangeRateModule.useWalletAccountExchangeRate>[0] | null
) => {
    const spy = vi.spyOn(useWalletAccountExchangeRateModule, 'useWalletAccountExchangeRate');

    spy.mockReturnValue([mockedValue === undefined ? exchangeRate : mockedValue ?? undefined, false]);

    return spy;
};
