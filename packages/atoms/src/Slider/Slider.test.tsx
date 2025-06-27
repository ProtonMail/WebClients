import { fireEvent, render } from '@testing-library/react';

import { Slider } from './Slider';

describe('<Slider />', () => {
    it('renders min and max mark labels', () => {
        const { getByTestId } = render(<Slider marks min={10} max={100} />);

        expect(getByTestId('slider-mark-min').textContent).toBe('10');
        expect(getByTestId('slider-mark-max').textContent).toBe('100');
    });

    /**
     * Again, rather a safeguard than a recommended use-case
     */
    it("inverts directionality (and doesn't break) if min is larger than max", () => {
        const { getByTestId } = render(<Slider marks min={100} max={10} />);

        expect(getByTestId('slider-mark-min').textContent).toBe('100');
        expect(getByTestId('slider-mark-max').textContent).toBe('10');
    });

    it('restricts a value to stay within min & max bounds', () => {
        const min = 10;
        const max = 100;

        const { getByTestId } = render(<Slider value={50} min={min} max={max} />);

        const input = getByTestId('slider-input');

        fireEvent.input(input, { target: { value: '0' } });

        expect(getByTestId('slider-input').getAttribute('aria-valuenow')).toEqual(String(min));

        fireEvent.input(input, { target: { value: '110' } });

        expect(getByTestId('slider-input').getAttribute('aria-valuenow')).toEqual(String(max));
    });
});
