import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import PasswordInput from './PasswordInput';

describe('PasswordInput component', () => {
    const value = 'panda';

    it('should display a password input with a toggle button', () => {
        const { container } = render(<PasswordInput value={value} />);
        const inputNode = container.querySelector('input');
        const buttonNode = container.querySelector('button');

        expect(inputNode).not.toBe(null);
        expect(buttonNode).not.toBe(null);
        expect(inputNode.getAttribute('type')).toBe('password');
    });

    it('should display the password', () => {
        const { container } = render(<PasswordInput value={value} />);
        const inputNode = container.querySelector('input');
        const buttonNode = container.querySelector('button');

        fireEvent.click(buttonNode);
        expect(inputNode.getAttribute('type')).toBe('text');
    });
});
