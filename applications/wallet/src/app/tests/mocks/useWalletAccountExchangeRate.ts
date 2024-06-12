import { exchangeRate } from '@proton/wallet';

import * as useWalletAccountExchangeRateModule from '../../hooks/useWalletAccountExchangeRate';

export const mockUseWalletAccountExchangeRate = (
    mockedValue?: ReturnType<typeof useWalletAccountExchangeRateModule.useWalletAccountExchangeRate>[0] | null
) => {
    const spy = vi.spyOn(useWalletAccountExchangeRateModule, 'useWalletAccountExchangeRate');

    spy.mockReturnValue([mockedValue === undefined ? exchangeRate : mockedValue ?? undefined, false]);

    return spy;
};
