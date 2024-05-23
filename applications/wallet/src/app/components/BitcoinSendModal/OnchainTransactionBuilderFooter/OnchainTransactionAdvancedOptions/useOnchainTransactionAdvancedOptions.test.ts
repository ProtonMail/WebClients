import { ChangeEvent } from 'react';

import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';

import { WasmChangeSpendPolicy, WasmCoinSelection, WasmLockTime, WasmOutPoint, WasmTxBuilder } from '@proton/andromeda';

import { useOnchainTransactionAdvancedOptions } from './useOnchainTransactionAdvancedOptions';

const outpointA = '89e48f05368f62c554f5e945d5a337550dbd2387fb74f7437302074feac04455:0';
const outpointB = '405f80381da6a3b4408c62fbe49af3d3f8db2eb828021c0d2b6de3831f2ed1b1:1';

describe('useOnchainTransactionAdvancedOptions', () => {
    let txBuilder: WasmTxBuilder = new WasmTxBuilder();
    const updater = vi.fn(async (update: (txBuilder: WasmTxBuilder) => WasmTxBuilder | Promise<WasmTxBuilder>) => {
        txBuilder = await update(txBuilder);
        return txBuilder;
    });

    it('should return correct coinSelectionOptions', () => {
        const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

        expect(result.current.coinSelectionOptions).toStrictEqual([
            { label: 'Minimized Fees', value: 0 },
            { label: 'Largest first', value: 1 },
            { label: 'Oldest first', value: 2 },
            { label: 'Manual', value: 3 },
        ]);
    });

    describe('handleCoinSelectionOptionSelect', () => {
        it('update txBuilder coinSelection', async () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

            act(() => {
                result.current.handleCoinSelectionOptionSelect(WasmCoinSelection.OldestFirst);
            });

            await waitFor(() => {
                expect(txBuilder.getCoinSelection()).toBe(WasmCoinSelection.OldestFirst);
            });
        });
    });

    it('should return correct changePolicyOptions', () => {
        const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

        expect(result.current.changePolicyOptions).toStrictEqual([
            { label: 'Only use non-change outputs', value: 2 },
            { label: 'Use both', value: 0 },
            { label: 'Only use change outputs', value: 1 },
        ]);
    });

    describe('handleChangePolicySelect', () => {
        it('should set selectedChangePolicy', async () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

            act(() =>
                result.current.handleChangePolicySelect({
                    value: WasmChangeSpendPolicy.ChangeForbidden,
                    selectedIndex: 2,
                })
            );

            await waitFor(() => {
                expect(txBuilder.getChangePolicy()).toBe(WasmChangeSpendPolicy.ChangeForbidden);
            });

            act(() =>
                result.current.handleChangePolicySelect({
                    value: WasmChangeSpendPolicy.ChangeAllowed,
                    selectedIndex: 0,
                })
            );

            await waitFor(() => {
                expect(txBuilder.getChangePolicy()).toBe(WasmChangeSpendPolicy.ChangeAllowed);
            });
        });
    });

    describe('handleManualCoinSelection', () => {
        it('should set coins with provided ones', async () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

            act(() => {
                void result.current.handleManualCoinSelection([
                    WasmOutPoint.fromString(outpointA),
                    WasmOutPoint.fromString(outpointB),
                ]);
            });

            await waitFor(() => {
                const serialised = txBuilder.getUtxosToSpend().map((value) => value[0]);
                // fixes flakiness since getUtxosToSpend()'s sorter doesn't seem to be deterministic
                serialised.sort();
                expect(serialised).toStrictEqual([outpointB, outpointA]);
            });
        });
    });

    describe('toggleEnableRBF', () => {
        it('should set enableRBF', async () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

            act(() => result.current.toggleEnableRBF());
            // true by default
            await waitFor(() => {
                expect(txBuilder.getRbfEnabled()).toBeFalsy();
            });

            act(() => result.current.toggleEnableRBF());
            await waitFor(() => {
                expect(txBuilder.getRbfEnabled()).toBeTruthy();
            });
        });
    });

    describe('toggleUseLocktime', () => {
        it('should turn useLocktime to true', () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

            act(() => result.current.toggleUseLocktime());
            expect(result.current.useLocktime).toBeTruthy();
        });

        it('should turn useLocktime to false and remove locktime previously set', async () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

            act(() => result.current.toggleUseLocktime());
            txBuilder = txBuilder.addLocktime(WasmLockTime.fromHeight(26));

            act(() => result.current.toggleUseLocktime());
            expect(result.current.useLocktime).toBeFalsy();
            await waitFor(() => {
                expect(txBuilder.getLocktime()).toBeFalsy();
            });
        });
    });

    describe('handleLocktimeValueChange', () => {
        it('should change locktime value', async () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));

            act(() => result.current.toggleUseLocktime());
            act(() =>
                result.current.handleLocktimeValueChange({
                    target: { value: 13 },
                } as unknown as ChangeEvent<HTMLInputElement>)
            );

            await waitFor(() => {
                expect(txBuilder.getLocktime()?.toConsensusU32()).toBe(13);
            });
        });
    });

    describe('fees', () => {
        it('should open fee selection modal', () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));
            result.current.switchToFeesSelectionModal();
            expect(result.current.feesSelectionModal.open).toBeTruthy();
        });

        it('should close fee selection modal', () => {
            const { result } = renderHook(() => useOnchainTransactionAdvancedOptions(txBuilder, updater));
            result.current.switchToFeesSelectionModal();
            result.current.feesSelectionModal.onClose();
            expect(result.current.feesSelectionModal.open).toBeFalsy();
        });
    });
});
