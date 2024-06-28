import * as useDecryptedApiWalletsDataModule from '../../hooks/useDecryptedApiWalletsData';
import { apiWalletsData } from '../fixtures';

export const mockUseDecryptedWallets = (
    mockedValue?: Partial<ReturnType<typeof useDecryptedApiWalletsDataModule.useDecryptedApiWalletsData>>
) => {
    const spy = vi.spyOn(useDecryptedApiWalletsDataModule, 'useDecryptedApiWalletsData');

    spy.mockReturnValue({
        walletMap: mockedValue?.walletMap ?? {},
        decryptedApiWalletsData: mockedValue?.decryptedApiWalletsData ?? apiWalletsData,
        loading: mockedValue?.loading ?? false,
        setPassphrase: mockedValue?.setPassphrase ?? vi.fn(),
        getDecryptedApiWalletsData: vi.fn(async () => mockedValue?.decryptedApiWalletsData ?? apiWalletsData),
    });

    return spy;
};
