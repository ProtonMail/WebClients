import { render } from '@testing-library/react';

import Alert from './Alert';

describe('Alert component', () => {
    const text = 'Panda';
    const { container } = render(<Alert className="mb-4">{text}</Alert>);
    const { firstChild } = container;

    it('renders children', () => {
        expect(firstChild?.textContent).toBe(text);
    });

    it('has default class', () => {
        expect(firstChild).toHaveClass('mb-4 alert-block');
    });

    it('should have error class for warning type', () => {
        const { container } = render(
            <Alert className="mb-4" type="warning">
                {text}
            </Alert>
        );
        expect(container.firstChild).toHaveClass('mb-4 alert-block--warning');
    });
});
