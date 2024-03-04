import { act, renderHook } from '@testing-library/react-hooks';

import { mockUseBitcoinBlockchainContext } from '../../tests';
import { apiWalletsData } from '../../tests/fixtures/api';
import { LightningUriFormat } from '../../types';
import { useBitcoinReceive } from './useBitcoinReceive';

describe('useBitcoinReceive', () => {
    beforeEach(() => {
        mockUseBitcoinBlockchainContext();
    });

    describe('when wallets is empty', () => {
        it('should return undefined wallet and account', () => {
            const { result } = renderHook(() => useBitcoinReceive([]));

            expect(result.current.selectedWallet.apiWalletData).toBeUndefined();
            expect(result.current.selectedWallet.apiAccount).toBeUndefined();
            expect(result.current.paymentLink).toBeNull();
        });
    });

    describe('handleSelectWallet', () => {
        it('should set `selectedWallet`', () => {
            const { result } = renderHook(() => useBitcoinReceive(apiWalletsData));

            act(() => result.current.handleSelectWallet({ apiWalletData: apiWalletsData[1] }));
            expect(result.current.selectedWallet.apiWalletData).toStrictEqual(apiWalletsData[1]);
        });

        it('should set `selectedAccount`', () => {
            const { result } = renderHook(() => useBitcoinReceive(apiWalletsData));

            act(() => result.current.handleSelectWallet({ apiAccount: apiWalletsData[0].WalletAccounts[1] }));
            expect(result.current.selectedWallet.apiAccount).toStrictEqual(apiWalletsData[0].WalletAccounts[1]);
        });

        it('should set `selectedFormat`', () => {
            const { result } = renderHook(() => useBitcoinReceive(apiWalletsData));

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
                const { result } = renderHook(() => useBitcoinReceive(apiWalletsData));

                act(() => result.current.handleChangeAmount(-12));
                expect(result.current.amount).toBe(0);
            });
        });

        it('should set new amount', () => {
            const { result } = renderHook(() => useBitcoinReceive(apiWalletsData));

            act(() => result.current.handleChangeAmount(124));
            expect(result.current.amount).toBe(124);
        });
    });

    describe('showAmountInput', () => {
        it('should turn `shouldShowAmountInput` to true', () => {
            const { result } = renderHook(() => useBitcoinReceive(apiWalletsData));

            act(() => result.current.showAmountInput());
            expect(result.current.shouldShowAmountInput).toBeTruthy();
        });
    });

    describe('when `defaultWalletId` is provided', () => {
        it('should select the associated wallet by default', () => {
            const { result } = renderHook(() => useBitcoinReceive(apiWalletsData, apiWalletsData[1].Wallet.ID));

            expect(result.current.selectedWallet.apiWalletData).toStrictEqual(apiWalletsData[1]);
        });
    });
});
