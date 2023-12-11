import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Mock } from 'vitest';

import { WasmTxBuilder } from '../../../pkg';
import { feesEstimations, getFeesEstimationMap } from '../../tests';
import { useOnChainFeesSelector } from './useOnChainFeesSelector';
import * as getFeesEstimationModule from './utils';

describe('useOnChainFeesSelector', () => {
    let updateTxBuilder: Mock;
    let txBuilder: WasmTxBuilder;
    const getFeesEstimation = vi
        .spyOn(getFeesEstimationModule, 'getFeesEstimation')
        .mockResolvedValue(getFeesEstimationMap());

    beforeEach(() => {
        updateTxBuilder = vi.fn().mockImplementation((updater) => {
            txBuilder = updater(txBuilder);
            return txBuilder;
        });

        txBuilder = new WasmTxBuilder();

        getFeesEstimation.mockClear();
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
        it('should fetch and set fee estimations', async () => {
            const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));

            await waitFor(() => {
                expect(getFeesEstimation).toHaveBeenCalledTimes(1);
            });

            expect(getFeesEstimation).toHaveBeenCalledWith();

            expect(result.current.feeEstimations).toStrictEqual(feesEstimations);
        });

        it('should set default fee to target next 5th block', async () => {
            renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));

            await waitFor(() => {
                expect(getFeesEstimation).toHaveBeenCalledTimes(1);
            });

            expect(txBuilder.get_fee_rate()).toBe(29);
        });

        it('should keep isRecommended to true', async () => {
            const { result } = renderHook(() => useOnChainFeesSelector(txBuilder, updateTxBuilder));

            await waitFor(() => {
                expect(getFeesEstimation).toHaveBeenCalledTimes(1);
            });

            expect(result.current.isRecommended).toBeTruthy();
        });
    });

    describe('handleFeesSelected', () => {
        describe('when a lower block target is available for same feeRate', () => {
            it.todo('use lower block target', () => {});
            it.todo('should turn isRecomended to false by default');
        });
    });

    describe('feeRateNote', () => {
        describe('when below 5th next block', () => {
            it.todo('should `HIGH` note');
        });

        describe('when below 10th next block', () => {
            it.todo('should `MODERATE` note');
        });

        describe('when above 10th next block', () => {
            it.todo('should `MODERATE` note');
        });
    });
});
