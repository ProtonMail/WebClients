import type {
    WasmBitcoinAddressClient,
    WasmEmailIntegrationClient,
    WasmExchangeRateClient,
    WasmInviteClient,
    WasmNetworkClient,
    WasmPaymentGatewayClient,
    WasmPriceGraphClient,
    WasmProtonWalletApiClient,
    WasmSettingsClient,
    WasmWalletClient,
} from '@proton/andromeda';
import * as useWalletApiModule from '@proton/wallet/contexts/ExtendedApiContext';

import { freeable } from '../utils/wasm';

type PartiallyMockedWalletApiClient = Partial<{
    bitcoin_address: Partial<Omit<WasmBitcoinAddressClient, 'free'>>;
    email_integration: Partial<Omit<WasmEmailIntegrationClient, 'free'>>;
    exchange_rate: Partial<Omit<WasmExchangeRateClient, 'free'>>;
    network: Partial<Omit<WasmNetworkClient, 'free'>>;
    settings: Partial<Omit<WasmSettingsClient, 'free'>>;
    wallet: Partial<Omit<WasmWalletClient, 'free'>>;
    invite: Partial<Omit<WasmInviteClient, 'free'>>;
    payment_gateway: Partial<Omit<WasmPaymentGatewayClient, 'free'>>;
    price_graph: Partial<Omit<WasmPriceGraphClient, 'free'>>;
}>;

export const getMockedApi = (mockedValue?: PartiallyMockedWalletApiClient): WasmProtonWalletApiClient => {
    const f = freeable({
        exchange_rate: freeable({
            getExchangeRate: mockedValue?.exchange_rate?.getExchangeRate ?? vi.fn(),
            getAllFiatCurrencies: mockedValue?.exchange_rate?.getAllFiatCurrencies ?? vi.fn(),
        }),
        email_integration: freeable({
            createBitcoinAddressesRequest: mockedValue?.email_integration?.createBitcoinAddressesRequest ?? vi.fn(),
            lookupBitcoinAddress: mockedValue?.email_integration?.lookupBitcoinAddress ?? vi.fn(),
        }),
        settings: freeable({
            getUserSettings: mockedValue?.settings?.getUserSettings ?? vi.fn(),
            setBitcoinUnit: mockedValue?.settings?.setBitcoinUnit ?? vi.fn(),
            setFiatCurrency: mockedValue?.settings?.setFiatCurrency ?? vi.fn(),
            setTwoFaThreshold: mockedValue?.settings?.setTwoFaThreshold ?? vi.fn(),
            setHideEmptyUsedAddresses: mockedValue?.settings?.setHideEmptyUsedAddresses ?? vi.fn(),
            acceptTermsAndConditions: mockedValue?.settings?.acceptTermsAndConditions ?? vi.fn(),
            setReceiveNotificationEmail: mockedValue?.settings?.setReceiveNotificationEmail ?? vi.fn(),
            getUserWalletEligibility: mockedValue?.settings?.getUserWalletEligibility ?? vi.fn(),
        }),
        network: freeable({ getNetwork: mockedValue?.network?.getNetwork ?? vi.fn(), free: vi.fn() }),
        wallet: freeable({
            getWallets: mockedValue?.wallet?.getWallets ?? vi.fn(),
            createWallet: mockedValue?.wallet?.createWallet ?? vi.fn(),
            updateWalletName: mockedValue?.wallet?.updateWalletName ?? vi.fn(),
            deleteWallet: mockedValue?.wallet?.deleteWallet ?? vi.fn(),
            migrate: mockedValue?.wallet?.migrate ?? vi.fn(),
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
            setWalletTransactionFlag: mockedValue?.wallet?.setWalletTransactionFlag ?? vi.fn(),
            deleteWalletTransactionFlag: mockedValue?.wallet?.deleteWalletTransactionFlag ?? vi.fn(),
            updateExternalWalletTransactionSender:
                mockedValue?.wallet?.updateExternalWalletTransactionSender ?? vi.fn(),
            disableShowWalletRecovery: mockedValue?.wallet?.disableShowWalletRecovery ?? vi.fn(),
            updateWalletAccountsOrder: mockedValue?.wallet?.updateWalletAccountsOrder ?? vi.fn(),
            updateWalletAccountLastUsedIndex: mockedValue?.wallet?.updateWalletAccountLastUsedIndex ?? vi.fn(),
            getWalletAccountAddresses: mockedValue?.wallet?.getWalletAccountAddresses ?? vi.fn(),
        }),
        bitcoin_address: freeable({
            getBitcoinAddresses: mockedValue?.bitcoin_address?.getBitcoinAddresses ?? vi.fn(),
            getBitcoinAddressHighestIndex: mockedValue?.bitcoin_address?.getBitcoinAddressHighestIndex ?? vi.fn(),
            addBitcoinAddress: mockedValue?.bitcoin_address?.addBitcoinAddress ?? vi.fn(),
            updateBitcoinAddress: mockedValue?.bitcoin_address?.updateBitcoinAddress ?? vi.fn(),
        }),
        payment_gateway: freeable({
            getCountries: mockedValue?.payment_gateway?.getCountries ?? vi.fn(),
            getFiatCurrencies: mockedValue?.payment_gateway?.getFiatCurrencies ?? vi.fn(),
            getPaymentMethods: mockedValue?.payment_gateway?.getPaymentMethods ?? vi.fn(),
            getQuotes: mockedValue?.payment_gateway?.getQuotes ?? vi.fn(),
            createOnRampCheckout: mockedValue?.payment_gateway?.createOnRampCheckout ?? vi.fn(),
            signUrl: mockedValue?.payment_gateway?.signUrl ?? vi.fn(),
            getPublicApiKey: mockedValue?.payment_gateway?.getPublicApiKey ?? vi.fn(),
            getCheckoutIframeSrc: mockedValue?.payment_gateway?.getCheckoutIframeSrc ?? vi.fn(),
        }),
        invite: freeable({
            checkInviteStatus: mockedValue?.invite?.checkInviteStatus ?? vi.fn(),
            sendNewcomerInvite: mockedValue?.invite?.sendNewcomerInvite ?? vi.fn(),
            sendEmailIntegrationInvite: mockedValue?.invite?.sendEmailIntegrationInvite ?? vi.fn(),
            getRemainingMonthlyInvitation: mockedValue?.invite?.getRemainingMonthlyInvitation ?? vi.fn(),
        }),
        price_graph: freeable({
            getGraphData: mockedValue?.price_graph?.getGraphData ?? vi.fn(),
        }),
    });

    return freeable({
        clients: () => f,
    });
};

export const mockUseWalletApi = (mockedValue?: WasmProtonWalletApiClient) => {
    const spy = vi.spyOn(useWalletApiModule, 'useWalletApi');

    spy.mockReturnValue(mockedValue ?? getMockedApi());

    return spy;
};

export const mockUseWalletApiClients = (mockedValue?: WasmProtonWalletApiClient) => {
    const spy = vi.spyOn(useWalletApiModule, 'useWalletApiClients');

    spy.mockReturnValue((mockedValue ?? getMockedApi()).clients());

    return spy;
};
