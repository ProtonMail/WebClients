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
            ShowWalletRecovery: 0,
            TwoFactorAmountThreshold: 0,
        },
        mockedValue?.[1] ?? false,
    ]);

    return spy;
};
