import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Mock } from 'vitest';

import { WasmTxBuilder } from '../../../../pkg';
import { getFeesEstimationMap, mockUseBlockchainContext } from '../../../tests';
import { useOnChainFeesSelector } from './useOnChainFeesSelector';

describe('useOnChainFeesSelector', () => {
    let updateTxBuilder: Mock;
    let txBuilder: WasmTxBuilder;

    beforeEach(() => {
        updateTxBuilder = vi.fn().mockImplementation(async (updater) => {
            txBuilder = await updater(txBuilder);
            return txBuilder;
        });

        txBuilder = new WasmTxBuilder();

        mockUseBlockchainContext({ fees: getFeesEstimationMap() });
    });

    it('should open modal', () => {
        const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
        result.current.openModal();
        expect(result.current.isModalOpen).toBeTruthy();
    });

    it('should close modal', () => {
        const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
        result.current.openModal();
        result.current.closeModal();
        expect(result.current.isModalOpen).toBeFalsy();
    });

    describe('on mount', () => {
        it('should set default fee to target next 5th block', async () => {
            renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));

            await waitFor(() => {
                expect(txBuilder.getFeeRate()).toBe(29);
            });
        });

        it('should keep isRecommended to true', async () => {
            const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));

            expect(result.current.isRecommended).toBeTruthy();
        });
    });

    describe('handleFeesSelected', () => {
        describe('should set fee rate', () => {
            it('use lower block target', async () => {
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                result.current.handleFeesSelected(4);

                await waitFor(() => {
                    expect(txBuilder.getFeeRate()).toBe(4);
                });
            });

            it('should turn isRecommended to false by default', () => {
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                result.current.handleFeesSelected(4);
                expect(result.current.isRecommended).toBeFalsy();
            });
        });
    });

    describe('feeRateNote', () => {
        describe('when below 5th next block', () => {
            it('should `HIGH` note', async () => {
                txBuilder = await txBuilder.setFeeRate(165);
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                expect(result.current.feeRateNote).toBe('HIGH');
            });
        });

        describe('when below 10th next block', () => {
            it('should `MODERATE` note', async () => {
                txBuilder = await txBuilder.setFeeRate(15);
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                expect(result.current.feeRateNote).toBe('MODERATE');
            });
        });

        describe('when above 10th next block', () => {
            it('should `LOW` note', async () => {
                txBuilder = await txBuilder.setFeeRate(1);
                const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));
                expect(result.current.feeRateNote).toBe('LOW');
            });
        });
    });
});
