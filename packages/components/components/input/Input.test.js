import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Input from './Input';

describe('Input component', () => {
    const value = 'panda';
    const error = 'hahaha';

    it('should display an input', () => {
        const { container } = render(<Input value={value} />);
        const inputNode = container.querySelector('input');

        expect(inputNode).not.toBe(null);
        expect(inputNode.value).toBe(value);
    });

    it('should display an error', () => {
        const { container } = render(<Input value={value} error={error} isSubmitted />);
        const inputNode = container.querySelector('input');
        const errorZoneNode = container.querySelector('.error-zone');
        const uid = inputNode.getAttribute('aria-describedby');

        expect(uid).not.toBe(null);
        expect(errorZoneNode).not.toBe(null);
        fireEvent.change(inputNode, { target: { value: 'bar' } });
        expect(errorZoneNode.textContent).toBe(error);
    });
});
