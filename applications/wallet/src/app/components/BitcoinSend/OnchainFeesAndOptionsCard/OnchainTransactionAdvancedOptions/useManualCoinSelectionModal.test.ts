import { act } from 'react-dom/test-utils';

import { renderHook } from '@testing-library/react-hooks';

import { WasmOutPoint } from '../../../../../pkg';
import { AccountWithBlockchainData } from '../../../../types';
import { useManualCoinSelectionModal } from './useManualCoinSelectionModal';

const outpointA = '89e48f05368f62c554f5e945d5a337550dbd2387fb74f7437302074feac04455:0';
const outpointB = '405f80381da6a3b4408c62fbe49af3d3f8db2eb828021c0d2b6de3831f2ed1b1:1';

describe('useManualCoinSelectionModal', () => {
    describe('toggleUtxoSelection', () => {
        describe('when coin is not selected yet', () => {
            it('should add it to the list', () => {
                const { result } = renderHook(() =>
                    useManualCoinSelectionModal(true, [], vi.fn(), {
                        utxos: [],
                    } as unknown as AccountWithBlockchainData)
                );

                act(() => result.current.toggleUtxoSelection(outpointA));
                expect(result.current.tmpSelectedUtxos).toStrictEqual([outpointA]);
            });
        });

        describe('when coin is already selected', () => {
            it('should remove it from the list', () => {
                const { result } = renderHook(() =>
                    useManualCoinSelectionModal(true, [], vi.fn(), {
                        utxos: [],
                    } as unknown as AccountWithBlockchainData)
                );

                act(() => result.current.toggleUtxoSelection(outpointA));
                act(() => result.current.toggleUtxoSelection(outpointA));
                expect(result.current.tmpSelectedUtxos).toStrictEqual([]);
            });
        });
    });

    describe('confirmCoinSelection', () => {
        it('should `onCoinSelected` with selected coins', () => {
            const mockedOnCoinSelected = vi.fn();
            const { result } = renderHook(() =>
                useManualCoinSelectionModal(true, [], mockedOnCoinSelected, {
                    utxos: [],
                } as unknown as AccountWithBlockchainData)
            );

            act(() => result.current.toggleUtxoSelection(outpointA));
            act(() => result.current.toggleUtxoSelection(outpointB));

            act(() => result.current.confirmCoinSelection());

            expect(mockedOnCoinSelected).toHaveBeenCalledTimes(1);

            const serialisedArg = mockedOnCoinSelected.mock.calls[0][0].map((o: [string]) => o[0]);
            expect(serialisedArg).toMatchObject([
                WasmOutPoint.fromRawTs(outpointA)[0],
                WasmOutPoint.fromRawTs(outpointB)[0],
            ]);
        });
    });

    describe('when modal closed', () => {
        it('should clear tmp selected', () => {
            let isOpen = true;
            const { result, rerender } = renderHook(() =>
                useManualCoinSelectionModal(isOpen, [], vi.fn(), {
                    utxos: [],
                } as unknown as AccountWithBlockchainData)
            );

            act(() => result.current.toggleUtxoSelection(outpointA));

            isOpen = false;
            rerender();
            expect(result.current.tmpSelectedUtxos).toStrictEqual([]);
        });
    });

    describe('when modal open', () => {
        it('should clear tmp selected', () => {
            let isOpen = false;
            const { result, rerender } = renderHook(() =>
                useManualCoinSelectionModal(
                    isOpen,
                    [WasmOutPoint.fromRawTs(outpointA), WasmOutPoint.fromRawTs(outpointB)],
                    vi.fn(),
                    {
                        utxos: [],
                    } as unknown as AccountWithBlockchainData
                )
            );

            isOpen = true;
            rerender();
            expect(result.current.tmpSelectedUtxos).toStrictEqual([outpointA, outpointB]);
        });
    });
});
