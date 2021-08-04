import { render, fireEvent } from '@testing-library/react';

import Toggle from './Toggle';

describe('Toggle component', () => {
    const id = 'pref';
    const getInput = (container) => container.querySelector('.toggle-checkbox');

    it('should be checked', () => {
        const mockOnChange = jest.fn();
        const { container } = render(<Toggle id={id} checked onChange={mockOnChange} />);
        const inputNode = getInput(container);

        expect(inputNode.checked).toBeTruthy();
    });

    it('should be unchecked', () => {
        const mockOnChange = jest.fn();
        const { container } = render(<Toggle id={id} checked={false} onChange={mockOnChange} />);
        const inputNode = getInput(container);

        expect(inputNode.checked).toBeFalsy();
    });

    it('should call onChange', () => {
        const mockOnChange = jest.fn();
        const { container } = render(<Toggle id={id} checked={false} onChange={mockOnChange} />);

        expect(mockOnChange).toHaveBeenCalledTimes(0);
        fireEvent.click(container.firstChild);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("should not call onChange since it's disabled", () => {
        const mockOnChange = jest.fn();
        const { container } = render(<Toggle id={id} checked={false} disabled onChange={mockOnChange} />);

        fireEvent.click(container.firstChild);
        expect(mockOnChange).toHaveBeenCalledTimes(0);
    });
});
