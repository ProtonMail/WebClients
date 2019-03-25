import React from 'react';
import { render, waitForElement } from 'react-testing-library';

import Button from './Button';

describe('Button component', () => {
    const text = 'Panda';

    it('should render a loading button', async () => {
        const { container, getByText } = render(<Button loading={true}>{text}</Button>);
        const { firstChild } = container;

        await waitForElement(() => getByText(text));
        expect(firstChild.getAttribute('aria-busy')).toBe('true');
    });

    it('should render a disabled button', async () => {
        const { container, getByText } = render(<Button disabled={true}>{text}</Button>);
        const { firstChild } = container;

        await waitForElement(() => getByText(text));
        expect(firstChild).toHaveAttribute('disabled');
        expect(firstChild.getAttribute('tabIndex')).toBe('-1');
    });
});
