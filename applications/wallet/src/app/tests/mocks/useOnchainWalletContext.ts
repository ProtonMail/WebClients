import { getFeesEstimationMap, walletsWithAccountsWithBalanceAndTxs } from '..';
import { WasmNetwork } from '../../../pkg';
import * as useOnchainWalletContextModule from '../../contexts/OnchainWalletContext';

export const mockUseOnchainWalletContext = (
    mockedValue?: Partial<ReturnType<typeof useOnchainWalletContextModule.useOnchainWalletContext>>
) => {
    const spy = vi.spyOn(useOnchainWalletContextModule, 'useOnchainWalletContext');

    spy.mockReturnValue({
        isInitialised: false,
        wallets: walletsWithAccountsWithBalanceAndTxs,
        fees: getFeesEstimationMap(),
        syncingMetatadaByAccountId: {},
        syncSingleWalletAccountBlockchainData: vi.fn(),
        network: WasmNetwork.Testnet,
        ...mockedValue,
    });

    return spy;
};
