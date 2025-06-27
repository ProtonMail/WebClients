import { render } from '@testing-library/react';

import { Kbd } from './Kbd';

describe('<Kbd />', () => {
    it('should render with className kbd and additional className', () => {
        const { container } = render(<Kbd shortcut="N" className="should-be-passed" />);

        expect(container.firstChild).toHaveClass('kbd');
        expect(container.firstChild).toHaveClass('should-be-passed');
    });

    it('should render element with text content N', () => {
        const { container } = render(<Kbd shortcut="N" />);

        expect(container.textContent).toBe('N');
    });
});
