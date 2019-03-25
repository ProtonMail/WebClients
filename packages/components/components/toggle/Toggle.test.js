import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import Toggle from './Toggle';

describe('Toggle component', () => {
    const id = 'pref';
    const mockOnChange = jest.fn();
    const getInput = (container) => container.querySelector('.pm-toggle-checkbox');

    it('should be checked', () => {
        const { container } = render(<Toggle id={id} checked={true} onChange={mockOnChange} />);
        const inputNode = getInput(container);

        expect(inputNode.checked).toBeTruthy();
    });

    it('should be unchecked', () => {
        const { container } = render(<Toggle id={id} checked={false} onChange={mockOnChange} />);
        const inputNode = getInput(container);

        expect(inputNode.checked).toBeFalsy();
    });

    it('should call onChange', () => {
        const { container } = render(<Toggle id={id} checked={false} onChange={mockOnChange} />);

        fireEvent.click(container.firstChild);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
});
