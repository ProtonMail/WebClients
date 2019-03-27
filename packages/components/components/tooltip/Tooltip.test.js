import React from 'react';
import { render } from 'react-testing-library';

import Tooltip from './Tooltip';

describe('Tooltip component', () => {
    it('should add a tooltip around the children', async () => {
        const title = 'panda';
        const { container } = render(
            <Tooltip title={title}>
                <button />
            </Tooltip>
        );
        const buttonNode = container.querySelector('button');

        expect(buttonNode).toBeDefined();
        expect(container.firstChild.classList.contains('tooltip-container')).toBeTruthy();
    });
});
