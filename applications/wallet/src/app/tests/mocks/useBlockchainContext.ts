import { getFeesEstimationMap, walletsWithAccountsWithBalanceAndTxs } from '..';
import * as useBlockchainContextModule from '../../contexts/BlockchainContext';

export const mockUseBlockchainContext = (
    mockedValue?: Partial<ReturnType<typeof useBlockchainContextModule.useBlockchainContext>>
) => {
    const spy = vi.spyOn(useBlockchainContextModule, 'useBlockchainContext');

    spy.mockReturnValue({
        wallets: walletsWithAccountsWithBalanceAndTxs,
        fees: getFeesEstimationMap(),
        loading: false,
        syncingMetatadaByAccountId: {},
        syncSingleWalletAccountBlockchainData: vi.fn(),
        ...mockedValue,
    });

    return spy;
};
