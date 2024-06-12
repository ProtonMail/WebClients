import { WasmNetwork } from '@proton/andromeda';
import { apiWalletsData } from '@proton/wallet';
import { buildMapFromWallets } from '@proton/wallet/utils/wallet';

import * as useBitcoinBlockchainContextModule from '../../contexts/BitcoinBlockchainContext';
import { getFeesEstimationMap, mockedWalletChainDataByWalletId } from '../fixtures';

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

        decryptedApiWalletsData: apiWalletsData,
        walletMap: buildMapFromWallets(apiWalletsData),
        loadingApiWalletsData: false,
        setPassphrase: vi.fn(),

        isSyncing: vi.fn(),
        getSyncingData: vi.fn(),

        feesEstimation: getFeesEstimationMap(),
        loadingFeesEstimation: false,

        ...mockedValue,
    });

    return spy;
};
