import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Mock } from 'vitest';

import { WasmTxBuilder } from '@proton/andromeda';

import { getFeesEstimationMap, mockUseBitcoinBlockchainContext } from '../../../../tests';
import { useFeesInput } from './useFeesInput';

describe('useFeesInput', () => {
    let updateTxBuilder: Mock;
    let txBuilder: WasmTxBuilder;

    beforeEach(() => {
        updateTxBuilder = vi.fn().mockImplementation(async (updater) => {
            txBuilder = await updater(txBuilder);
            return txBuilder;
        });

        txBuilder = new WasmTxBuilder();

        mockUseBitcoinBlockchainContext({ feesEstimation: getFeesEstimationMap() });
    });

    describe('on mount', () => {
        it('should set default fee to target next 5th block', async () => {
            renderHook(() => useFeesInput(txBuilder, updateTxBuilder));

            await waitFor(() => {
                expect(txBuilder.getFeeRate()).toBe(BigInt(29));
            });
        });

        it('should keep isRecommended to true', async () => {
            const { result } = renderHook(() => useFeesInput(txBuilder, updateTxBuilder));

            expect(result.current.isRecommended).toBeTruthy();
        });
    });

    describe('handleFeesSelected', () => {
        describe('should set fee rate', () => {
            it('use lower block target', async () => {
                const { result } = renderHook(() => useFeesInput(txBuilder, updateTxBuilder));
                result.current.handleFeesSelected(4);

                await waitFor(() => {
                    expect(txBuilder.getFeeRate()).toBe(BigInt(4));
                });
            });

            it('should turn isRecommended to false by default', () => {
                const { result } = renderHook(() => useFeesInput(txBuilder, updateTxBuilder));
                result.current.handleFeesSelected(4);
                expect(result.current.isRecommended).toBeFalsy();
            });
        });
    });

    describe('feeRateNote', () => {
        describe('when below 5th next block', () => {
            it('should `HIGH` note', async () => {
                txBuilder = await txBuilder.setFeeRate(BigInt(165));
                const { result } = renderHook(() => useFeesInput(txBuilder, updateTxBuilder));
                expect(result.current.note).toBe('high');
            });
        });

        describe('when below 10th next block', () => {
            it('should `MODERATE` note', async () => {
                txBuilder = await txBuilder.setFeeRate(BigInt(15));
                const { result } = renderHook(() => useFeesInput(txBuilder, updateTxBuilder));
                expect(result.current.note).toBe('moderate');
            });
        });

        describe('when above 10th next block', () => {
            it('should `LOW` note', async () => {
                txBuilder = await txBuilder.setFeeRate(BigInt(1));
                const { result } = renderHook(() => useFeesInput(txBuilder, updateTxBuilder));
                expect(result.current.note).toBe('low');
            });
        });
    });
});
