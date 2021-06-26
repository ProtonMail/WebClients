import React from 'react';
import { render } from '@testing-library/react';

import Icon from './Icon';

describe('Icon component', () => {
    it('should render the icon and the screen reader helper', () => {
        const name = 'account';
        const alt = 'Account';
        const { container } = render(<Icon name={name} alt={alt} />);
        const svgNode = container.querySelector(`[xlink:href="#shape-${name}"]`);
        const srpNode = container.querySelector('.sr-only');

        expect(svgNode).toBeDefined();
        expect(srpNode).toBeDefined();
        expect(srpNode.textContent).toBe(alt);
    });
});
