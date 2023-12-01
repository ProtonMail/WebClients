import { act, renderHook } from '@testing-library/react-hooks';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { walletsWithAccountsWithBalanceAndTxs } from '../../tests';
import { LightningUriFormat } from '../../types';
import { useBitcoinReceiveInfoGenerator } from './useBitcoinReceiveInfoGenerator';

describe('useBitcoinReceiveInfoGenerator', () => {
    describe('walletOptions', () => {
        it('should return walletsOptions', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(walletsWithAccountsWithBalanceAndTxs));
            expect(result.current.walletsOptions).toStrictEqual([
                { disabled: false, label: 'Bitcoin 01', value: 0 },
                { disabled: false, label: 'Savings on Jade', value: 1 },
                { disabled: false, label: 'Savings on Electrum', value: 2 },
                { disabled: false, label: 'Lightning 01', value: 3 },
            ]);
        });

        describe('when a wallet has no account', () => {
            it('should disable the option', () => {
                const [walletA, walletB, walletC, walletD] = walletsWithAccountsWithBalanceAndTxs;
                const wallets = [walletA, walletB, { ...walletC, accounts: [] }, walletD];

                const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(wallets));
                expect(result.current.walletsOptions).toStrictEqual([
                    { disabled: false, label: 'Bitcoin 01', value: 0 },
                    { disabled: false, label: 'Savings on Jade', value: 1 },
                    { disabled: true, label: 'Savings on Electrum', value: 2 },
                    { disabled: false, label: 'Lightning 01', value: 3 },
                ]);
            });
        });
    });

    describe('accountsOption', () => {
        it('should return account options', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(walletsWithAccountsWithBalanceAndTxs));
            expect(result.current.accountsOptions).toStrictEqual([
                { label: 'Account 1', value: 8 },
                { label: 'Account 2', value: 9 },
            ]);
        });
    });

    describe('when wallets is empty', () => {
        it('should return undefined wallet and account', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator([]));

            expect(result.current.accountsOptions).toBeUndefined();
            expect(result.current.walletsOptions).toHaveLength(0);
            expect(result.current.selectedWallet).toBeUndefined();
            expect(result.current.selectedAccount).toBeUndefined();
            expect(result.current.serializedPaymentInformation).toBeNull();
        });
    });

    describe('handleSelectWallet', () => {
        it('should set `selectedWallet`', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(walletsWithAccountsWithBalanceAndTxs));

            act(() => result.current.handleSelectWallet({ value: 1 } as SelectChangeEvent<number>));
            expect(result.current.selectedWallet).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[1]);
        });
    });

    describe('handleSelectAccount', () => {
        it('should set `selectedAccount`', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(walletsWithAccountsWithBalanceAndTxs));

            act(() => result.current.handleSelectAccount({ value: 9 } as SelectChangeEvent<number>));
            expect(result.current.selectedAccount).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[0].accounts[1]);
        });
    });

    describe('handleSelectFormat', () => {
        it('should set `selectedFormat`', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(walletsWithAccountsWithBalanceAndTxs));

            act(() =>
                result.current.handleSelectFormat({
                    value: LightningUriFormat.ONCHAIN,
                } as SelectChangeEvent<LightningUriFormat>)
            );
            expect(result.current.selectedFormat).toStrictEqual({ name: 'Onchain', value: LightningUriFormat.ONCHAIN });
        });
    });

    describe('handleChangeAmount', () => {
        describe("when amount is below selected wallet's balance", () => {
            it('should constrain it to 0', () => {
                const { result } = renderHook(() =>
                    useBitcoinReceiveInfoGenerator(walletsWithAccountsWithBalanceAndTxs)
                );

                act(() => result.current.handleChangeAmount(-12));
                expect(result.current.amount).toBe(0);
            });
        });

        it('should set new amount', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(walletsWithAccountsWithBalanceAndTxs));

            act(() => result.current.handleChangeAmount(124));
            expect(result.current.amount).toBe(124);
        });
    });

    describe('showAmountInput', () => {
        it('should turn `shouldShowAmountInput` to true', () => {
            const { result } = renderHook(() => useBitcoinReceiveInfoGenerator(walletsWithAccountsWithBalanceAndTxs));

            act(() => result.current.showAmountInput());
            expect(result.current.shouldShowAmountInput).toBeTruthy();
        });
    });

    describe('when `defaultWalletId` is provided', () => {
        it('should select the associated wallet by default', () => {
            const { result } = renderHook(() =>
                useBitcoinReceiveInfoGenerator(
                    walletsWithAccountsWithBalanceAndTxs,
                    walletsWithAccountsWithBalanceAndTxs[1].WalletID
                )
            );

            expect(result.current.selectedWallet).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[1]);
        });
    });
});
