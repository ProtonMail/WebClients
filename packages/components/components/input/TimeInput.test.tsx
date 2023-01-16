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
});
