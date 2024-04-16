import { MockedFunction } from 'vitest';

import * as useApiWalletTransactionDataModule from '../../store/hooks/useApiWalletTransactionData';

export const mockUseGetApiWalletTransactionData = (
    mockedValue?: MockedFunction<ReturnType<typeof useApiWalletTransactionDataModule.useGetApiWalletTransactionData>>
) => {
    const spy = vi.spyOn(useApiWalletTransactionDataModule, 'useGetApiWalletTransactionData');

    spy.mockReturnValue(mockedValue ?? jest.fn());

    return spy;
};
