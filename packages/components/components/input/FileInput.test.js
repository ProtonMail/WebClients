import { render, fireEvent } from '@testing-library/react';

import FileInput from './FileInput';

describe('FileInput component', () => {
    const value = 'panda';
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });

    it('should render a file input and wrap children', () => {
        const { container } = render(<FileInput>{value}</FileInput>);
        const inputNode = container.querySelector('input');

        expect(inputNode).not.toBe(null);
        expect(inputNode.getAttribute('type')).toBe('file');
        expect(container.textContent).toBe(value);
    });

    it('should upload a file', () => {
        const mockOnChange = jest.fn(({ target }) => [...target.files]);
        const { container } = render(<FileInput onChange={mockOnChange}>{value}</FileInput>);
        const inputNode = container.querySelector('input');

        Object.defineProperty(inputNode, 'files', { value: [file] });
        fireEvent.change(inputNode);
        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange.mock.results[0].value[0]).toBe(file);
    });
});
