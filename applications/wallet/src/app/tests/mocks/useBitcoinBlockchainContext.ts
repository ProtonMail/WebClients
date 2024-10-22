import { WasmNetwork } from '@proton/andromeda';
import { apiWalletsData, getFeesEstimationMap, mockedWalletChainDataByWalletId } from '@proton/wallet/tests';
import { buildMapFromWallets } from '@proton/wallet/utils/wallet';

import * as useBitcoinBlockchainContextModule from '../../contexts/BitcoinBlockchainContext';

export const mockUseBitcoinBlockchainContext = (
    mockedValue?: Partial<ReturnType<typeof useBitcoinBlockchainContextModule.useBitcoinBlockchainContext>>
) => {
    const spy = vi.spyOn(useBitcoinBlockchainContextModule, 'useBitcoinBlockchainContext');

    spy.mockReturnValue({
        network: WasmNetwork.Testnet,

        walletsChainData: mockedWalletChainDataByWalletId,
        accountIDByDerivationPathByWalletID: {},
        syncingMetatadaByAccountId: {},
        syncSingleWalletAccount: vi.fn(),
        syncSingleWallet: vi.fn(),
        syncManyWallets: vi.fn(),
        incrementSyncKey: vi.fn(),

        apiWalletsData,
        walletMap: buildMapFromWallets(apiWalletsData),
        loadingApiWalletsData: false,

        isSyncing: vi.fn(),
        getSyncingData: vi.fn(),

        feesEstimation: getFeesEstimationMap(),
        loadingFeesEstimation: false,

        manageBitcoinAddressPool: vi.fn(),
        bitcoinAddressHelperByWalletAccountId: {},

        ...mockedValue,
    });

    return spy;
};
