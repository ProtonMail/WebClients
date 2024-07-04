import * as useWalletSettingsModule from '@proton/wallet/store/hooks/useWalletSettings';

export const mockUseWalletSettings = (
    mockedValue?: Partial<ReturnType<typeof useWalletSettingsModule.useWalletSettings>>
) => {
    const spy = vi.spyOn(useWalletSettingsModule, 'useWalletSettings');

    spy.mockReturnValue([
        {
            ...mockedValue?.[0],
            BitcoinUnit: 'BTC',
            FiatCurrency: 'USD',
            HideEmptyUsedAddresses: 0,
            TwoFactorAmountThreshold: 0,
            ReceiveEmailIntegrationNotification: null,
            ReceiveInviterNotification: null,
            WalletCreated: null,
        },
        mockedValue?.[1] ?? false,
    ]);

    return spy;
};
