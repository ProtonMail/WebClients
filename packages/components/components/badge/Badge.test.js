import React from 'react';
import { render } from 'react-testing-library';

import Badge from './Badge';

describe('Badge component', () => {
    const text = 'Panda';
    const { container } = render(<Badge>{text}</Badge>);
    const { firstChild: badge } = container;

    it('renders children', () => {
        expect(badge.textContent).toBe(text);
    });

    it('has default class', () => {
        expect(badge).toHaveClass('badgeLabel');
    });

    it('should have success class', () => {
        const { container } = render(<Badge type="success">{text}</Badge>);
        expect(container.firstChild).toHaveClass('badgeLabel-success');
    });
});
