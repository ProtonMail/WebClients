import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { Mock } from 'vitest';

import { mockUseNotifications } from '@proton/testing/lib/vitest';

import { WasmTxBuilder } from '../../../../pkg';
import * as useTxBuilderModule from '../../../hooks/useTxBuilder';
import { mockUseOnchainWalletContext, walletsWithAccountsWithBalanceAndTxs } from '../../../tests';
import { useOnchainTransactionBuilder } from './useOnchainTransactionBuilder';

describe('useOnchainTransactionBuilder', () => {
    let mockSetAccount: Mock;

    beforeEach(() => {
        mockUseNotifications();
        mockUseOnchainWalletContext();

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
            const { result } = renderHook(() => useOnchainTransactionBuilder());

            act(() => result.current.handleSelectWalletAndAccount({ wallet: walletsWithAccountsWithBalanceAndTxs[1] }));
            expect(result.current.walletAndAccount).toStrictEqual({
                wallet: walletsWithAccountsWithBalanceAndTxs[1],
                account: walletsWithAccountsWithBalanceAndTxs[1].accounts[0],
            });

            act(() =>
                result.current.handleSelectWalletAndAccount({
                    account: walletsWithAccountsWithBalanceAndTxs[1].accounts[1],
                })
            );
            expect(result.current.walletAndAccount).toStrictEqual({
                wallet: walletsWithAccountsWithBalanceAndTxs[1],
                account: walletsWithAccountsWithBalanceAndTxs[1].accounts[1],
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
                useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs[1].Wallet.ID)
            );

            expect(result.current.walletAndAccount.wallet).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[1]);
        });
    });
});
