import React from 'react';
import { render } from 'react-testing-library';

import Alert from './Alert';

describe('Alert component', () => {
    const text = 'Panda';
    const learnMoreText = 'Learn more';
    const { container } = render(<Alert learnMore="https://protonmail.com">{text}</Alert>);
    const { firstChild } = container;

    it('renders children and should contain "Learn more" link', () => {
        expect(firstChild.textContent).toBe(`${text}${learnMoreText}`);
    });

    it('has default class', () => {
        expect(firstChild).toHaveClass('block-info');
    });

    it('should have error class for warning type', () => {
        const { container } = render(<Alert type="warning">{text}</Alert>);
        expect(container.firstChild).toHaveClass('block-info-error');
    });
});
