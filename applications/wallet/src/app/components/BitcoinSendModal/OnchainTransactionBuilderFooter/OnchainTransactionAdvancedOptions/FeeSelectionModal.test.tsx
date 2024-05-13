import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DEFAULT_TARGET_BLOCK, MIN_FEE_RATE } from '../../../../constants';
import { feesEstimations } from '../../../../tests';
import { FeeSelectionModal } from './FeeSelectionModal';
import * as useFeeSelectionModalModule from './useFeeSelectionModal';

describe('FeeSelectionModal', () => {
    let modalState = {
        open: true,
        onClose: vi.fn(),
        onExit: vi.fn(),
    };

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
                    modalState={modalState}
                    feesEstimations={feesEstimations}
                    feeRate={0}
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
                    modalState={modalState}
                    feesEstimations={feesEstimations}
                    feeRate={0}
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
            render(
                <FeeSelectionModal
                    feesEstimations={feesEstimations}
                    feeRate={0}
                    modalState={modalState}
                    onFeeRateSelected={vi.fn()}
                />
            );

            const btn = screen.getByText('Cancel');
            expect(btn).toBeInTheDocument();

            fireEvent.click(btn);

            expect(modalState.onClose).toHaveBeenCalledTimes(1);
            expect(modalState.onClose).toHaveBeenCalledWith();
        });
    });

    describe('when user clicks on confirm button', () => {
        it('should call `onFeeRateSelected`', () => {
            mockedUseFeeSelectionModal.mockReturnValue({ ...helper, tmpFeeRate: 4.61 });

            const onFeeRateSelected = vi.fn();
            render(
                <FeeSelectionModal
                    modalState={modalState}
                    feesEstimations={feesEstimations}
                    feeRate={0}
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
