import { act, renderHook } from '@testing-library/react-hooks';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { walletsWithAccountsWithBalanceAndTxs } from '../../tests';
import { BitcoinUnit } from '../../types';
import { getAccountBalance } from '../../utils';
import { useOnchainTransactionBuilder } from './useOnchainTransactionBuilder';

describe('useOnchainTransactionBuilder', () => {
    describe('handleSelectWallet', () => {
        it('should set `selectedWallet`', () => {
            const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));

            act(() => result.current.handleSelectWallet({ value: 1 } as SelectChangeEvent<number>));
            expect(result.current.selectedWallet).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[1]);
        });

        describe("when some recipients had balance allocated and newly selected wallet's balance is below cumulated", () => {
            it('should allocate new balance and then set remaining amounts to 0', () => {
                const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));

                // wallet #1 / account #2 balance is 11,783,999
                act(() => result.current.handleSelectAccount({ value: 9 } as SelectChangeEvent<number>));

                // share balance between 3 recipients
                act(() => result.current.addRecipient());
                act(() => result.current.addRecipient());
                // cumulated balance = 11,680,503 -> below wallet #2 balance -> OK
                act(() => result.current.updateRecipientAmount(0, 7767877));
                act(() => result.current.updateRecipientAmount(1, 2018900));
                act(() => result.current.updateRecipientAmount(2, 1893726));

                // new wallet balance is 8,287,263
                act(() => result.current.handleSelectWallet({ value: 1 } as SelectChangeEvent<number>));

                expect(result.current.recipients).toMatchObject([
                    // recipient #1 still has previous allocated amount
                    {
                        address: '',
                        amount: 7767877,
                        unit: 'SATS',
                    },
                    // recipient #2 previous allocated amount was partially matched
                    {
                        address: '',
                        amount: 519386,
                        unit: 'SATS',
                    },
                    // nothing remained for recipient #3
                    {
                        address: '',
                        amount: 0,
                        unit: 'SATS',
                    },
                ]);

                const cumulativeBalance = result.current.recipients.reduce(
                    (acc, recipient) => acc + recipient.amount,
                    0
                );

                expect(cumulativeBalance).toBe(getAccountBalance(result.current.selectedAccount));
            });
        });
    });

    describe('handleSelectAccount', () => {
        it('should set `selectedAccount`', () => {
            const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));

            act(() => result.current.handleSelectAccount({ value: 9 } as SelectChangeEvent<number>));
            expect(result.current.selectedAccount).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[0].accounts[1]);
        });
    });

    describe('addRecipient', () => {
        it('should push a new empty recipient to `recipients`', () => {
            const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));
            act(() => result.current.addRecipient());

            // Don't check uuid to avoid flakiness
            expect(result.current.recipients).toMatchObject([
                {
                    address: '',
                    amount: 0,
                    unit: 'SATS',
                },
                {
                    address: '',
                    amount: 0,
                    unit: 'SATS',
                },
            ]);
        });
    });

    describe('removeRecipient', () => {
        it('should remove recipient at given index', () => {
            const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));
            act(() => result.current.addRecipient());
            act(() => result.current.addRecipient());
            act(() => result.current.addRecipient());

            expect(result.current.recipients).toHaveLength(4);
            act(() => result.current.removeRecipient(2));

            expect(result.current.recipients).toHaveLength(3);
        });

        describe("when recipient doesn't exist at index", () => {
            it('should do nothing', () => {
                const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));

                const before = { ...result.current };
                act(() => result.current.removeRecipient(4));

                expect(result.current.recipients).toStrictEqual(before.recipients);
            });
        });
    });

    describe('updateRecipient', () => {
        it('should update recipient at given index', () => {
            const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));
            act(() => result.current.addRecipient());
            act(() => result.current.addRecipient());
            act(() => result.current.addRecipient());

            expect(result.current.recipients).toHaveLength(4);
            act(() => result.current.updateRecipient(2, { address: 'bc1....helloworld', unit: BitcoinUnit.BTC }));

            expect(result.current.recipients).toMatchObject([
                {
                    address: '',
                    amount: 0,
                    unit: 'SATS',
                },
                {
                    address: '',
                    amount: 0,
                    unit: 'SATS',
                },
                {
                    address: 'bc1....helloworld',
                    amount: 0,
                    unit: 'BTC',
                },
                {
                    address: '',
                    amount: 0,
                    unit: 'SATS',
                },
            ]);
        });

        describe("when recipient doesn't exist at index", () => {
            it('should do nothing', () => {
                const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));

                const before = { ...result.current };
                act(() => result.current.updateRecipient(4, { address: 'bc1....helloworld', unit: BitcoinUnit.SATS }));

                expect(result.current.recipients).toStrictEqual(before.recipients);
            });
        });
    });

    describe('updateRecipientAmount', () => {
        it('should update recipient amount at given index', () => {
            const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));
            act(() => result.current.addRecipient());
            act(() => result.current.addRecipient());
            act(() => result.current.addRecipient());

            expect(result.current.recipients).toHaveLength(4);
            act(() => result.current.updateRecipientAmount(2, 102));

            expect(result.current.recipients).toMatchObject([
                {
                    address: '',
                    amount: 0,
                    unit: 'SATS',
                },
                {
                    address: '',
                    amount: 0,
                    unit: 'SATS',
                },
                {
                    address: '',
                    amount: 102,
                    unit: 'SATS',
                },
                {
                    address: '',
                    amount: 0,
                    unit: 'SATS',
                },
            ]);
        });

        describe('when cumulated amount is above selected wallet balance', () => {
            it('simple case - should not allocate more than total balance', () => {
                const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));
                // Selected wallet has balance of 100067sats
                act(() => result.current.updateRecipientAmount(0, 190067));

                expect(result.current.recipients).toMatchObject([
                    {
                        address: '',
                        amount: 100067,
                        unit: 'SATS',
                    },
                ]);
            });

            describe('when some recipients already have part of wallet balance allocated', () => {
                it('complex case - should not allocate more than total balance', () => {
                    // Selected wallet has balance of 100067sats
                    const { result } = renderHook(() =>
                        useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs)
                    );
                    act(() => result.current.addRecipient());
                    act(() => result.current.addRecipient());

                    // 100067-8673-56743 = 34651
                    act(() => result.current.updateRecipientAmount(0, 8673));
                    act(() => result.current.updateRecipientAmount(2, 56743));
                    expect(result.current.recipients).toMatchObject([
                        {
                            address: '',
                            amount: 8673,
                            unit: 'SATS',
                        },
                        {
                            address: '',
                            amount: 0,
                            unit: 'SATS',
                        },
                        {
                            address: '',
                            amount: 56743,
                            unit: 'SATS',
                        },
                    ]);

                    // If we try to allocate more than 34651sats to recipient #2, then amount will be constrained to 34651
                    act(() => result.current.updateRecipientAmount(1, 44500));
                    expect(result.current.recipients).toMatchObject([
                        {
                            address: '',
                            amount: 8673,
                            unit: 'SATS',
                        },
                        {
                            address: '',
                            amount: 34651,
                            unit: 'SATS',
                        },
                        {
                            address: '',
                            amount: 56743,
                            unit: 'SATS',
                        },
                    ]);

                    // We can still reduce recipient #3 amount
                    act(() => result.current.updateRecipientAmount(2, 20986));
                    expect(result.current.recipients).toMatchObject([
                        {
                            address: '',
                            amount: 8673,
                            unit: 'SATS',
                        },
                        {
                            address: '',
                            amount: 34651,
                            unit: 'SATS',
                        },
                        {
                            address: '',
                            amount: 20986,
                            unit: 'SATS',
                        },
                    ]);

                    // Then we can update recipient #2 amount to desired amount
                    act(() => result.current.updateRecipientAmount(1, 44500));
                    expect(result.current.recipients).toMatchObject([
                        {
                            address: '',
                            amount: 8673,
                            unit: 'SATS',
                        },
                        {
                            address: '',
                            amount: 44500,
                            unit: 'SATS',
                        },
                        {
                            address: '',
                            amount: 20986,
                            unit: 'SATS',
                        },
                    ]);
                });
            });
        });

        describe("when recipient doesn't exist at index", () => {
            it('should do nothing', () => {
                const { result } = renderHook(() => useOnchainTransactionBuilder(walletsWithAccountsWithBalanceAndTxs));

                const before = { ...result.current };
                act(() => result.current.updateRecipientAmount(4, 102));

                expect(result.current.recipients).toStrictEqual(before.recipients);
            });
        });
    });

    describe('when `defaultWalletId` is provided', () => {
        it('should select the associated wallet by default', () => {
            const { result } = renderHook(() =>
                useOnchainTransactionBuilder(
                    walletsWithAccountsWithBalanceAndTxs,
                    walletsWithAccountsWithBalanceAndTxs[1].WalletID
                )
            );

            expect(result.current.selectedWallet).toStrictEqual(walletsWithAccountsWithBalanceAndTxs[1]);
        });
    });
});
