import { fireEvent, render, screen } from '@testing-library/react';

import noop from '@proton/utils/noop';

import TimeInput from './TimeInput';

describe('TimeInput component', () => {
    it('should display a time input of type text', () => {
        const date = new Date(2023, 0, 11, 12);
        const { container } = render(<TimeInput value={date} onChange={noop} />);
        const inputNode = container.querySelector('input');

        expect(inputNode).not.toBe(null);
        expect(inputNode?.getAttribute('type')).toBe('text');
    });

    it('should display the time with duration', () => {
        const date = new Date(2023, 0, 1, 12);
        render(<TimeInput value={date} min={date} onChange={noop} displayDuration />);

        const input = screen.getByDisplayValue(/12/);
        expect(input).toHaveValue('12:00 PM');

        fireEvent.click(input);

        // display duration options
        screen.getByText('0 min');
        screen.getByText('30 min');
        screen.getByText('30 min');
        screen.getByText('1 h');
        screen.getByText('1.5 h');
        screen.getByText('2 h');
        screen.getByText('2.5 h');
    });

    it('should select values on click', () => {
        const onChange = jest.fn();
        const date = new Date(2023, 0, 11, 12);
        const { container } = render(<TimeInput value={date} onChange={onChange} />);
        const input = container.querySelector('input');

        if (!input) {
            throw new Error('Time input not found');
        }

        fireEvent.click(input);
        const desiredTimeNode = screen.getByText('11:30 AM');
        expect(desiredTimeNode?.className).not.toContain('dropdown-item--is-selected');
        fireEvent.click(desiredTimeNode);
        expect(onChange).toHaveBeenCalledWith(new Date(2023, 0, 11, 11, 30));
    });

    it('should "autocomplete" to highlighted values', () => {
        const date = new Date(2023, 0, 11, 12);
        const { container } = render(<TimeInput value={date} onChange={noop} />);
        const input = container.querySelector('input');

        if (!input) {
            throw new Error('Time input not found');
        }

        fireEvent.click(input);
        fireEvent.input(input, { target: { value: '8:3' } });
        const highlightedNode = screen.getByText('8:30 AM');
        expect(highlightedNode?.className).toContain('dropdown-item--is-selected');
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
        expect(input).toHaveValue('8:30 AM');
    });

    it('should allow to enter values not displayed in the dropdown', () => {
        const date = new Date(2023, 0, 11, 12);
        const { container } = render(<TimeInput value={date} onChange={noop} />);
        const input = container.querySelector('input');

        if (!input) {
            throw new Error('Time input not found');
        }

        fireEvent.click(input);
        const nonExistingOption = screen.queryByText('8:11 AM');
        expect(nonExistingOption).toBe(null);
        fireEvent.input(input, { target: { value: '8:11 AM' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
        expect(input).toHaveValue('8:11 AM');
    });

    it('should "reset" the value when the input is invalid', () => {
        const date = new Date(2023, 0, 11, 12);
        const { container } = render(<TimeInput value={date} onChange={noop} />);
        const input = container.querySelector('input');

        if (!input) {
            throw new Error('Time input not found');
        }

        fireEvent.click(input);
        fireEvent.input(input, { target: { value: '8:1' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
        expect(input).toHaveValue('12:00 PM');
    });
});
