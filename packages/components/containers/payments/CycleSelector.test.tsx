import { render, screen } from '@testing-library/react';

import { CYCLE } from '@proton/payments';

import CycleSelector from './CycleSelector';

describe('CycleSelector', () => {
    const defaultProps = {
        onSelect: jest.fn(),
        cycle: CYCLE.YEARLY,
    };

    it('should render buttons', () => {
        const { container } = render(<CycleSelector {...defaultProps} mode="buttons" />);
        expect(container).not.toBeEmptyDOMElement();
    });

    describe('when maximum cycle is set', () => {
        it('should not render options above the maximum cycle', () => {
            const { container } = render(
                <CycleSelector {...defaultProps} mode="buttons" maximumCycle={CYCLE.YEARLY} />
            );
            expect(container).not.toBeEmptyDOMElement();
            expect(screen.queryByText('24 months')).toBeNull();
        });
    });

    describe('when minimum cycle is set', () => {
        it('should not render options below the minimum cycle', () => {
            const { container } = render(
                <CycleSelector {...defaultProps} mode="buttons" minimumCycle={CYCLE.YEARLY} />
            );
            expect(container).not.toBeEmptyDOMElement();
            expect(screen.queryByText('1 month')).toBeNull();
        });
    });

    describe('when disabled', () => {
        it('should disable the buttons', () => {
            const { container } = render(<CycleSelector {...defaultProps} mode="buttons" disabled />);
            expect(container).not.toBeEmptyDOMElement();
            expect(screen.getByText('Monthly')).toBeDisabled();
            expect(screen.getByText('Annually')).toBeDisabled();
            expect(screen.getByText('Two-year')).toBeDisabled();
        });
    });
});
