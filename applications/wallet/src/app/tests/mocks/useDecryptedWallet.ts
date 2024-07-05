import { apiWalletsData } from '@proton/wallet';
import * as useDecryptedApiWalletsDataModule from '@proton/wallet/hooks/useDecryptedApiWalletsData';

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
