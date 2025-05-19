import { render } from '@testing-library/react';

import { Button } from './Button';

describe('<Button />', () => {
    it('has button root', () => {
        const { container } = render(<Button />);
        const button = container.querySelector('button');

        expect(button).toBeVisible();
    });

    it('has type="button" attribute', () => {
        const { container } = render(<Button />);
        const rootElement = container.firstChild;

        expect(rootElement).toHaveAttribute('type', 'button');
    });
});
