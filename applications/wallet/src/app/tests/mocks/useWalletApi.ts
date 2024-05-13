import {
    WasmBitcoinAddressClient,
    WasmEmailIntegrationClient,
    WasmExchangeRateClient,
    WasmNetworkClient,
    WasmProtonWalletApiClient,
    WasmSettingsClient,
    WasmWalletClient,
} from '@proton/andromeda';
import * as useWalletApiModule from '@proton/wallet/contexts/ExtendedApiContext';

type PartiallyMockedWalletApiClient = Partial<{
    bitcoin_address: Partial<Omit<WasmBitcoinAddressClient, 'free'>>;
    email_integration: Partial<Omit<WasmEmailIntegrationClient, 'free'>>;
    exchange_rate: Partial<Omit<WasmExchangeRateClient, 'free'>>;
    network: Partial<Omit<WasmNetworkClient, 'free'>>;
    settings: Partial<Omit<WasmSettingsClient, 'free'>>;
    wallet: Partial<Omit<WasmWalletClient, 'free'>>;
}>;

export const getMockedApi = (mockedValue?: PartiallyMockedWalletApiClient): WasmProtonWalletApiClient => ({
    exchange_rate: vi.fn(
        (): WasmExchangeRateClient => ({
            getExchangeRate: mockedValue?.exchange_rate?.getExchangeRate ?? vi.fn(),
            getAllFiatCurrencies: mockedValue?.exchange_rate?.getAllFiatCurrencies ?? vi.fn(),
            free: vi.fn(),
        })
    ),
    email_integration: vi.fn(
        (): WasmEmailIntegrationClient => ({
            createBitcoinAddressesRequest: mockedValue?.email_integration?.createBitcoinAddressesRequest ?? vi.fn(),
            lookupBitcoinAddress: mockedValue?.email_integration?.lookupBitcoinAddress ?? vi.fn(),
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
            updateWalletName: mockedValue?.wallet?.updateWalletName ?? vi.fn(),
            deleteWallet: mockedValue?.wallet?.deleteWallet ?? vi.fn(),
            getWalletAccounts: mockedValue?.wallet?.getWalletAccounts ?? vi.fn(),
            createWalletAccount: mockedValue?.wallet?.createWalletAccount ?? vi.fn(),
            updateWalletAccountLabel: mockedValue?.wallet?.updateWalletAccountLabel ?? vi.fn(),
            updateWalletAccountFiatCurrency: mockedValue?.wallet?.updateWalletAccountFiatCurrency ?? vi.fn(),
            deleteWalletAccount: mockedValue?.wallet?.deleteWalletAccount ?? vi.fn(),
            getWalletTransactions: mockedValue?.wallet?.getWalletTransactions ?? vi.fn(),
            getWalletTransactionsToHash: mockedValue?.wallet?.getWalletTransactionsToHash ?? vi.fn(),
            createWalletTransaction: mockedValue?.wallet?.createWalletTransaction ?? vi.fn(),
            updateWalletTransactionLabel: mockedValue?.wallet?.updateWalletTransactionLabel ?? vi.fn(),
            updateWalletTransactionHashedTxId: mockedValue?.wallet?.updateWalletTransactionHashedTxId ?? vi.fn(),
            deleteWalletTransaction: mockedValue?.wallet?.deleteWalletTransaction ?? vi.fn(),
            addEmailAddress: mockedValue?.wallet?.addEmailAddress ?? vi.fn(),
            removeEmailAddress: mockedValue?.wallet?.removeEmailAddress ?? vi.fn(),
        })
    ),
    bitcoin_address: vi.fn(() => ({
        free: vi.fn(),
        getBitcoinAddresses: mockedValue?.bitcoin_address?.getBitcoinAddresses ?? vi.fn(),
        getBitcoinAddressHighestIndex: mockedValue?.bitcoin_address?.getBitcoinAddressHighestIndex ?? vi.fn(),
        addBitcoinAddress: mockedValue?.bitcoin_address?.addBitcoinAddress ?? vi.fn(),
        updateBitcoinAddress: mockedValue?.bitcoin_address?.updateBitcoinAddress ?? vi.fn(),
    })),
    free: vi.fn(),
});

export const mockUseWalletApi = (mockedValue?: PartiallyMockedWalletApiClient) => {
    const spy = vi.spyOn(useWalletApiModule, 'useWalletApi');

    spy.mockReturnValue(getMockedApi(mockedValue));

    return spy;
};
