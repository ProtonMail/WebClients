import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Copy from './Copy';

describe('Copy component', () => {
    const value = 'Panda';

    document.execCommand = jest.fn();

    it('should change the title when the value is copied in the clipboard', () => {
        const { container } = render(<Copy value={value} />);
        const { firstChild } = container;

        expect(firstChild.getAttribute('class')).not.toContain('copied');
        fireEvent.click(firstChild);
        expect(firstChild.getAttribute('class')).toContain('copied');
    });
});
