import { WasmExchangeRateClient, WasmNetworkClient, WasmSettingsClient, WasmWalletClient } from '@proton/andromeda';
import * as useWalletApiModule from '@proton/wallet/contexts/ExtendedApiContext';

type PartiallyMockedWalletApiClient = Partial<{
    exchange_rate: Partial<Omit<WasmExchangeRateClient, 'free'>>;
    settings: Partial<Omit<WasmSettingsClient, 'free'>>;
    network: Partial<Omit<WasmNetworkClient, 'free'>>;
    wallet: Partial<Omit<WasmWalletClient, 'free'>>;
}>;

export const mockUseWalletApi = (mockedValue?: PartiallyMockedWalletApiClient) => {
    const spy = vi.spyOn(useWalletApiModule, 'useWalletApi');

    spy.mockReturnValue({
        exchange_rate: vi.fn(
            (): WasmExchangeRateClient => ({
                getExchangeRate: mockedValue?.exchange_rate?.getExchangeRate ?? vi.fn(),
                free: vi.fn(),
            })
        ),
        settings: vi.fn(
            (): WasmSettingsClient => ({
                free: vi.fn(),
                getUserSettings: mockedValue?.settings?.getUserSettings ?? vi.fn(),
                setBitcoinUnit: mockedValue?.settings?.setBitcoinUnit ?? vi.fn(),
                setFiatCurrency: mockedValue?.settings?.setFiatCurrency ?? vi.fn(),
                setTwoFaThreshold: mockedValue?.settings?.setTwoFaThreshold ?? vi.fn(),
                setHideEmptyUsedAddresses: mockedValue?.settings?.setHideEmptyUsedAddresses ?? vi.fn(),
            })
        ),
        network: vi.fn(
            (): WasmNetworkClient => ({ getNetwork: mockedValue?.network?.getNetwork ?? vi.fn(), free: vi.fn() })
        ),
        wallet: vi.fn(
            (): WasmWalletClient => ({
                free: vi.fn(),
                getWallets: mockedValue?.wallet?.getWallets ?? vi.fn(),
                createWallet: mockedValue?.wallet?.createWallet ?? vi.fn(),
                deleteWallet: mockedValue?.wallet?.deleteWallet ?? vi.fn(),
                getWalletAccounts: mockedValue?.wallet?.getWalletAccounts ?? vi.fn(),
                createWalletAccount: mockedValue?.wallet?.createWalletAccount ?? vi.fn(),
                updateWalletAccountLabel: mockedValue?.wallet?.updateWalletAccountLabel ?? vi.fn(),
                deleteWalletAccount: mockedValue?.wallet?.deleteWalletAccount ?? vi.fn(),
                getWalletTransactions: mockedValue?.wallet?.getWalletTransactions ?? vi.fn(),
                getWalletTransactionsToHash: mockedValue?.wallet?.getWalletTransactionsToHash ?? vi.fn(),
                createWalletTransaction: mockedValue?.wallet?.createWalletTransaction ?? vi.fn(),
                updateWalletTransactionLabel: mockedValue?.wallet?.updateWalletTransactionLabel ?? vi.fn(),
                updateWalletTransactionHashedTxId: mockedValue?.wallet?.updateWalletTransactionHashedTxId ?? vi.fn(),
                deleteWalletTransaction: mockedValue?.wallet?.deleteWalletTransaction ?? vi.fn(),
            })
        ),
        free: vi.fn(),
    });

    return spy;
};
