import * as useDecryptedApiWalletsDataModule from '@proton/wallet/hooks/useDecryptedApiWalletsData';

import { apiWalletsData } from '../fixtures/api';

export const mockUseDecryptedWallets = (
    mockedValue?: Partial<ReturnType<typeof useDecryptedApiWalletsDataModule.useDecryptedApiWalletsData>>
) => {
    const spy = vi.spyOn(useDecryptedApiWalletsDataModule, 'useDecryptedApiWalletsData');

    spy.mockReturnValue({
        walletMap: mockedValue?.walletMap ?? {},
        decryptedApiWalletsData: mockedValue?.decryptedApiWalletsData ?? apiWalletsData,
        loading: mockedValue?.loading ?? false,
        setPassphrase: mockedValue?.setPassphrase ?? vi.fn(),
    });

    return spy;
};
