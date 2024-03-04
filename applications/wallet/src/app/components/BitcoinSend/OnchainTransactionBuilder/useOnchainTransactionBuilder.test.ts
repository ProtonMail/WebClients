import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { Mock } from 'vitest';

import { WasmTxBuilder } from '@proton/andromeda';
import { mockUseNotifications } from '@proton/testing/lib/vitest';

import * as useTxBuilderModule from '../../../hooks/useTxBuilder';
import { mockUseBitcoinBlockchainContext } from '../../../tests';
import { apiWalletAccountTwoA, apiWalletAccountTwoB, apiWalletsData } from '../../../tests/fixtures/api';
import { mockUseDecryptedWallets } from '../../../tests/mocks/useDecryptedWallet';
import { useOnchainTransactionBuilder } from './useOnchainTransactionBuilder';

describe('useOnchainTransactionBuilder', () => {
    let mockSetAccount: Mock;

    beforeEach(() => {
        mockUseNotifications();
        mockUseDecryptedWallets();
        mockUseBitcoinBlockchainContext();

        mockSetAccount = vi.fn();

        const fakeTxBuilder = { setAccount: mockSetAccount } as unknown as WasmTxBuilder;
        vi.spyOn(useTxBuilderModule, 'useTxBuilder').mockReturnValue({
            txBuilder: fakeTxBuilder,
            updateTxBuilder: vi.fn().mockImplementation((updater) => {
                return updater(fakeTxBuilder);
            }),
        });
    });

    describe('handleSelectWalletAndAccount', () => {
        it('should set `selectedWallet`', async () => {
            const { result } = renderHook(() => useOnchainTransactionBuilder(apiWalletsData));

            act(() => result.current.handleSelectWalletAndAccount({ apiWalletData: apiWalletsData[1] }));
            expect(result.current.walletAndAccount).toStrictEqual({
                apiWalletData: apiWalletsData[1],
                apiAccount: apiWalletAccountTwoA,
            });

            act(() =>
                result.current.handleSelectWalletAndAccount({
                    apiAccount: apiWalletAccountTwoB,
                })
            );

            expect(result.current.walletAndAccount).toStrictEqual({
                apiWalletData: apiWalletsData[1],
                apiAccount: apiWalletAccountTwoB,
            });

            // setAccount should have been called once at mount, once at wallet change and once at account change
            await waitFor(() => {
                expect(mockSetAccount).toHaveBeenCalledTimes(3);
            });
        });
    });

    describe('when `defaultWalletId` is provided', () => {
        it('should select the associated wallet by default', async () => {
            const { result } = renderHook(() =>
                useOnchainTransactionBuilder(apiWalletsData, apiWalletsData[1].Wallet.ID)
            );

            expect(result.current.walletAndAccount.apiWalletData).toStrictEqual(apiWalletsData[1]);
        });
    });
});
