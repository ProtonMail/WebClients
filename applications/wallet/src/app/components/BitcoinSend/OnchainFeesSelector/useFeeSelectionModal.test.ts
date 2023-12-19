import { renderHook } from '@testing-library/react-hooks';
import { describe } from 'vitest';

import { feesEstimations } from '../../../tests';
import { MAX_BLOCK_TARGET, MIN_FEE_RATE } from './constant';
import { useFeeSelectionModal } from './useFeeSelectionModal';

describe('useFeeSelectionModal', () => {
    describe('handleBlockTargetChange', () => {
        describe('exact match', () => {
            it('should find nearest block target in fee estimations and set feeRate with it', () => {
                const { result } = renderHook(() => useFeeSelectionModal(feesEstimations, MIN_FEE_RATE, true));

                result.current.handleBlockTargetChange(8);
                expect(result.current.tmpFeeRate).toBe(12);
                expect(result.current.tmpBlockTarget).toBe(8);
            });
        });

        describe('below match', () => {
            it('should find nearest block target in fee estimations and set feeRate with it', () => {
                // below match
                const { result } = renderHook(() => useFeeSelectionModal(feesEstimations, MIN_FEE_RATE, true));

                result.current.handleBlockTargetChange(10);
                expect(result.current.tmpFeeRate).toBe(6);
                expect(result.current.tmpBlockTarget).toBe(12);
            });
        });

        describe('above match', () => {
            it('should find nearest block target in fee estimations and set feeRate with it', () => {
                // below match
                const { result } = renderHook(() => useFeeSelectionModal(feesEstimations, MIN_FEE_RATE, true));

                result.current.handleBlockTargetChange(67);
                expect(result.current.tmpFeeRate).toBe(2);
                expect(result.current.tmpBlockTarget).toBe(86);
            });
        });

        describe('when feeEstimations is empty', () => {
            it('should use default block target', () => {
                const { result } = renderHook(() => useFeeSelectionModal([], MIN_FEE_RATE, true));

                expect(result.current.tmpFeeRate).toBe(MIN_FEE_RATE);
                expect(result.current.tmpBlockTarget).toBe(MAX_BLOCK_TARGET);

                result.current.handleBlockTargetChange(67);
                expect(result.current.tmpBlockTarget).toBe(MAX_BLOCK_TARGET);
            });
        });
    });

    describe('handleFeeRateChange', () => {
        it('should set raw fee target as provided value', () => {
            const { result } = renderHook(() => useFeeSelectionModal(feesEstimations, MIN_FEE_RATE, true));

            result.current.handleFeeRateChange('24.3');
            expect(result.current.tmpFeeRate).toBe(24.3);
        });

        it('should find lowest block target in fee estimations and set blockTarget with it', () => {
            const { result } = renderHook(() => useFeeSelectionModal(feesEstimations, MIN_FEE_RATE, true));

            result.current.handleFeeRateChange('24.3');
            expect(result.current.tmpBlockTarget).toBe(6);
        });

        describe('when feeEstimations is empty', () => {
            it('should set fees normally', () => {
                const { result } = renderHook(() => useFeeSelectionModal([], MIN_FEE_RATE, true));

                expect(result.current.tmpFeeRate).toBe(MIN_FEE_RATE);
                expect(result.current.tmpBlockTarget).toBe(MAX_BLOCK_TARGET);

                result.current.handleFeeRateChange('24.3');
                expect(result.current.tmpFeeRate).toBe(24.3);
            });
        });
    });

    describe('when modal is closed', () => {
        it('should clear state', () => {
            let isOpen = true;
            const { result, rerender } = renderHook(() => useFeeSelectionModal(feesEstimations, MIN_FEE_RATE, isOpen));

            result.current.handleFeeRateChange('24.3');

            isOpen = false;
            rerender();

            expect(result.current.tmpFeeRate).toBe(MIN_FEE_RATE);
        });
    });

    describe('when modal is open', () => {
        it('should set state to current submitted values', () => {
            let isOpen = false;
            const { result, rerender } = renderHook(() => useFeeSelectionModal(feesEstimations, 24.3, isOpen));

            result.current.handleFeeRateChange('24.3');

            isOpen = true;
            rerender();

            expect(result.current.tmpFeeRate).toBe(24.3);
            expect(result.current.tmpBlockTarget).toBe(6);
        });
    });
});
