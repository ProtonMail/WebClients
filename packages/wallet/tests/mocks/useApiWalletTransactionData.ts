import * as useApiWalletTransactionDataModule from '../../store/hooks/useApiWalletTransactionData';

export const mockUseApiWalletTransactionData = (
    mockedValue?: Partial<ReturnType<typeof useApiWalletTransactionDataModule.useApiWalletTransactionData>>
) => {
    const spy = vi.spyOn(useApiWalletTransactionDataModule, 'useApiWalletTransactionData');

    spy.mockReturnValue([mockedValue?.[0] ?? {}, mockedValue?.[1] ?? false]);

    return spy;
};
