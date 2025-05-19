import { render } from '@testing-library/react';

import Avatar from './Avatar';

describe('<Avatar />', () => {
    it('accepts a custom class attribute', () => {
        const child = 'MJ';

        const { getByText } = render(<Avatar className="custom">{child}</Avatar>);

        const element = getByText(child);

        expect(element).toHaveClass('custom');
        expect(element.getAttribute('class')).not.toBe('custom');
    });
});
