import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { feesEstimations } from '../../../../tests';
import { FeeSelectionModal } from './FeeSelectionModal';
import { DEFAULT_TARGET_BLOCK, MIN_FEE_RATE } from './constant';
import * as useFeeSelectionModalModule from './useFeeSelectionModal';

describe('FeeSelectionModal', () => {
    let helper = {
        handleBlockTargetChange: vi.fn(),
        handleFeeRateChange: vi.fn(),
        tmpBlockTarget: DEFAULT_TARGET_BLOCK,
        tmpFeeRate: MIN_FEE_RATE,
    };

    const mockedUseFeeSelectionModal = vi.spyOn(useFeeSelectionModalModule, 'useFeeSelectionModal');

    beforeEach(() => {
        helper = {
            handleBlockTargetChange: vi.fn(),
            handleFeeRateChange: vi.fn(),
            tmpBlockTarget: DEFAULT_TARGET_BLOCK,
            tmpFeeRate: MIN_FEE_RATE,
        };

        mockedUseFeeSelectionModal.mockReturnValue(helper);
    });

    describe('when user change block target slider', () => {
        it('should call `handleBlockTargetChange`', async () => {
            render(
                <FeeSelectionModal
                    isOpen={true}
                    feeEstimations={feesEstimations}
                    feeRate={0}
                    onClose={vi.fn()}
                    onFeeRateSelected={vi.fn()}
                />
            );

            const input = screen.getByTestId('slider-input');
            fireEvent.change(input, { target: { value: 9 } });

            expect(helper.handleBlockTargetChange).toHaveBeenCalledTimes(1);
            expect(helper.handleBlockTargetChange).toHaveBeenCalledWith(9);
        });
    });

    describe('when user change fee rate input', () => {
        it('should call `handleFeeRateChange`', async () => {
            render(
                <FeeSelectionModal
                    isOpen={true}
                    feeEstimations={feesEstimations}
                    feeRate={0}
                    onClose={vi.fn()}
                    onFeeRateSelected={vi.fn()}
                />
            );

            const input = screen.getByTestId('fee-rate-input');
            await userEvent.type(input, '7');

            await waitFor(() => {
                expect(helper.handleFeeRateChange).toHaveBeenCalledTimes(1);
            });

            expect(helper.handleFeeRateChange).toHaveBeenCalledWith('17');
        });
    });

    describe('when user clicks on close button', () => {
        it('should call `onClose`', () => {
            const onClose = vi.fn();
            render(
                <FeeSelectionModal
                    isOpen={true}
                    feeEstimations={feesEstimations}
                    feeRate={0}
                    onClose={onClose}
                    onFeeRateSelected={vi.fn()}
                />
            );

            const btn = screen.getByText('Cancel');
            expect(btn).toBeInTheDocument();

            fireEvent.click(btn);

            expect(onClose).toHaveBeenCalledTimes(1);
            expect(onClose).toHaveBeenCalledWith();
        });
    });

    describe('when user clicks on confirm button', () => {
        it('should call `onFeeRateSelected`', () => {
            mockedUseFeeSelectionModal.mockReturnValue({ ...helper, tmpFeeRate: 4.61 });

            const onFeeRateSelected = vi.fn();
            render(
                <FeeSelectionModal
                    isOpen={true}
                    feeEstimations={feesEstimations}
                    feeRate={0}
                    onClose={vi.fn()}
                    onFeeRateSelected={onFeeRateSelected}
                />
            );

            const btn = screen.getByText('Done');
            expect(btn).toBeInTheDocument();

            fireEvent.click(btn);

            expect(onFeeRateSelected).toHaveBeenCalledTimes(1);
            expect(onFeeRateSelected).toHaveBeenCalledWith(4.61);
        });
    });
});
