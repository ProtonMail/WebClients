import { fireEvent, render } from '@testing-library/react';

import Toggle from './Toggle';

describe('Toggle component', () => {
    const id = 'pref';
    const getInput = (container) => container.querySelector('.toggle-checkbox');

    it('should be checked', () => {
        const mockOnChange = vi.fn();
        const { container } = render(<Toggle id={id} checked onChange={mockOnChange} />);
        const inputNode = getInput(container);

        expect(inputNode.checked).toBeTruthy();
    });

    it('should be unchecked', () => {
        const mockOnChange = vi.fn();
        const { container } = render(<Toggle id={id} checked={false} onChange={mockOnChange} />);
        const inputNode = getInput(container);

        expect(inputNode.checked).toBeFalsy();
    });

    it('should call onChange', () => {
        const mockOnChange = vi.fn();
        const { container } = render(<Toggle id={id} checked={false} onChange={mockOnChange} />);

        expect(mockOnChange).toHaveBeenCalledTimes(0);
        fireEvent.click(container.firstChild);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("should not call onChange since it's disabled", () => {
        const mockOnChange = vi.fn();
        const { container } = render(<Toggle id={id} checked={false} disabled onChange={mockOnChange} />);

        fireEvent.click(container.firstChild);
        expect(mockOnChange).toHaveBeenCalledTimes(0);
    });

    it('should use the id passed by the caller', () => {
        const { container } = render(<Toggle id={id} />);
        const inputNode = getInput(container);

        expect(inputNode.id).toBe(id);
        expect(container.querySelector('label').htmlFor).toBe(id);
    });

    it('should link the label to the input when no id is passed', () => {
        const { container } = render(<Toggle />);
        const inputNode = getInput(container);

        expect(inputNode.id).not.toBe('');
        expect(container.querySelector('label').htmlFor).toBe(inputNode.id);
    });

    it('should give each toggle a unique id when no id is passed', () => {
        const { container } = render(
            <>
                <Toggle />
                <Toggle />
            </>
        );
        const [first, second] = container.querySelectorAll('.toggle-checkbox');

        expect(first.id).not.toBe(second.id);
    });

    it('should not use the former shared default id', () => {
        const { container } = render(<Toggle />);

        expect(container.querySelector('#toggle')).toBeNull();
    });
});
