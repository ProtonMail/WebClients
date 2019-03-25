import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import Copy from './Copy';

describe('Copy component', () => {
    const value = 'Panda';

    document.execCommand = jest.fn();

    it('should change the title when the value is copied in the clipboard', () => {
        const { container } = render(<Copy value={value} />);
        const { firstChild } = container;

        expect(firstChild.getAttribute('title')).toBe('Copy');
        fireEvent.click(firstChild);
        expect(firstChild.getAttribute('title')).toBe('Copied');
    });
});
