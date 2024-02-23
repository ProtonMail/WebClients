import { act, renderHook } from '@testing-library/react-hooks';

import { mockUseOnchainWalletContext, walletsWithAccountsWithBalanceAndTxs } from '../../tests';
import { LightningUriFormat } from '../../types';
import { useBitcoinReceive } from './useBitcoinReceive';

describe('useBitcoinReceive', () => {
    beforeEach(() => {
        mockUseOnchainWalletContext();
    });

    describe('when wallets is empty', () => {
        it('should return undefined wallet and account', () => {
            mockUseOnchainWalletContext({ wallets: [] });

            const { result } = renderHook(() => useBitcoinReceive());

            expect(result.current.selectedWallet.wallet).toBeUndefined();
            expect(result.current.selectedWallet.account).toBeUndefined();
            expect(result.current.paymentLink).toBeNull();
        });
    });

    describe('handleSelectWallet', () => {
        it('should set `selectedWallet`', () => {
            const { result } = renderHook(() => useBitcoinReceive());

            act(() => result.current.handleSelectWallet({ wallet: walletsWithAccountsWithBalanceAndTxs[1] }));
            expect(result.current.selectedWallet.wallet).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[1]);
        });

        it('should set `selectedAccount`', () => {
            const { result } = renderHook(() => useBitcoinReceive());

            act(() =>
                result.current.handleSelectWallet({ account: walletsWithAccountsWithBalanceAndTxs[0].accounts[1] })
            );
            expect(result.current.selectedWallet.account).toStrictEqual(
                walletsWithAccountsWithBalanceAndTxs[0].accounts[1]
            );
        });

        it('should set `selectedFormat`', () => {
            const { result } = renderHook(() => useBitcoinReceive());

            act(() =>
                result.current.handleSelectWallet({
                    format: LightningUriFormat.ONCHAIN,
                })
            );
            expect(result.current.selectedWallet.format).toStrictEqual(LightningUriFormat.ONCHAIN);
        });
    });

    describe('handleChangeAmount', () => {
        describe("when amount is below selected wallet's balance", () => {
            it('should constrain it to 0', () => {
                const { result } = renderHook(() => useBitcoinReceive());

                act(() => result.current.handleChangeAmount(-12));
                expect(result.current.amount).toBe(0);
            });
        });

        it('should set new amount', () => {
            const { result } = renderHook(() => useBitcoinReceive());

            act(() => result.current.handleChangeAmount(124));
            expect(result.current.amount).toBe(124);
        });
    });

    describe('showAmountInput', () => {
        it('should turn `shouldShowAmountInput` to true', () => {
            const { result } = renderHook(() => useBitcoinReceive());

            act(() => result.current.showAmountInput());
            expect(result.current.shouldShowAmountInput).toBeTruthy();
        });
    });

    describe('when `defaultWalletId` is provided', () => {
        it('should select the associated wallet by default', () => {
            const { result } = renderHook(() => useBitcoinReceive(walletsWithAccountsWithBalanceAndTxs[1].Wallet.ID));

            expect(result.current.selectedWallet.wallet).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[1]);
        });
    });
});
