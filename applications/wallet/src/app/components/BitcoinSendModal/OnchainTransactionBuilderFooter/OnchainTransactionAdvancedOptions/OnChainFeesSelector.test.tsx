import { fireEvent, render, screen } from '@testing-library/react';
import { Mock, vi } from 'vitest';

import { MIN_FEE_RATE } from '../../../../constants';
import { OnChainFeesSelector } from './OnChainFeesSelector';
import * as useOnChainFeesSelectorModule from './useOnChainFeesSelector';

const baseMock: ReturnType<typeof useOnChainFeesSelectorModule.useOnChainFeesSelector> = {
    feesEstimations: [],
    feeRate: MIN_FEE_RATE,
    blockTarget: 1,
    isRecommended: true,
    feeRateNote: 'HIGH',
    handleFeesSelected: vi.fn(),
};

describe('OnChainFeesSelector', () => {
    let switchToFeesSelectionModal: Mock;

    beforeEach(() => {
        switchToFeesSelectionModal = vi.fn();
    });

    it('should display badge type and text corresponding to fee rate note', () => {
        const { rerender } = render(
            <OnChainFeesSelector
                feesSelectorHelpers={baseMock}
                switchToFeesSelectionModal={switchToFeesSelectionModal}
            />
        );

        screen.getByText(/High/i);

        rerender(
            <OnChainFeesSelector
                feesSelectorHelpers={{
                    ...baseMock,
                    feeRateNote: 'LOW',
                }}
                switchToFeesSelectionModal={switchToFeesSelectionModal}
            />
        );

        screen.getByText(/Low/i);
    });

    it('should not display `recommended` badge', () => {
        render(
            <OnChainFeesSelector
                feesSelectorHelpers={{
                    ...baseMock,
                    isRecommended: false,
                }}
                switchToFeesSelectionModal={switchToFeesSelectionModal}
            />
        );

        expect(screen.queryByText(/recommended/i)).not.toBeInTheDocument();
    });

    it('should display `recommended` badge', () => {
        render(
            <OnChainFeesSelector
                feesSelectorHelpers={baseMock}
                switchToFeesSelectionModal={switchToFeesSelectionModal}
            />
        );
        expect(screen.getByText(/recommended/i)).toBeInTheDocument();
    });

    it('should display fee rate and approx confirmation time', async () => {
        const updated = {
            ...baseMock,
            feeRate: 3.4,
            blockTarget: 9,
        };

        render(
            <OnChainFeesSelector
                feesSelectorHelpers={updated}
                switchToFeesSelectionModal={switchToFeesSelectionModal}
            />
        );

        expect(screen.getByText('3.40sats/vb')).toBeInTheDocument();
        expect(screen.getByText('Confirmation in ~90 minutes expected')).toBeInTheDocument();
    });

    describe('when user clicks on `Modify`', () => {
        it('should open modal', () => {
            render(
                <OnChainFeesSelector
                    feesSelectorHelpers={baseMock}
                    switchToFeesSelectionModal={switchToFeesSelectionModal}
                />
            );

            const btn = screen.getByText('Modify');
            expect(btn).toBeInTheDocument();
            fireEvent.click(btn);

            expect(switchToFeesSelectionModal).toHaveBeenCalledTimes(1);
            expect(switchToFeesSelectionModal).toHaveBeenCalledWith();
        });
    });
});
