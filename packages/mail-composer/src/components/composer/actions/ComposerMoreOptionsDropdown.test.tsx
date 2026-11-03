import { fireEvent, render, screen } from '@testing-library/react';

import ComposerMoreOptionsDropdown from './ComposerMoreOptionsDropdown';

describe('ComposerMoreOptionsDropdown', () => {
    const mockOnOpen = jest.fn();

    const setupTest = () => {
        return render(
            <ComposerMoreOptionsDropdown content="More" onOpen={mockOnOpen}>
                <div>Dropdown content</div>
            </ComposerMoreOptionsDropdown>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call onOpen when the dropdown opens', () => {
        setupTest();

        fireEvent.click(screen.getByTestId('composer:more-options-button'));

        expect(mockOnOpen).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Dropdown content')).toBeInTheDocument();
    });

    it('should not call onOpen when the dropdown closes', () => {
        setupTest();

        const button = screen.getByTestId('composer:more-options-button');
        fireEvent.click(button);
        fireEvent.click(button);

        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(mockOnOpen).toHaveBeenCalledTimes(1);
    });
});
