import React from 'react';
import { render, fireEvent } from '@testing-library/react';

import Button from './Button';

describe('Button component', () => {
    const text = 'Panda';

    it('should render a loading button', () => {
        const { container } = render(<Button loading>{text}</Button>);
        const buttonNode = container.querySelector('button');

        expect(buttonNode.getAttribute('aria-busy')).toBe('true');
    });

    it('should render a disabled button', () => {
        const mockOnClick = jest.fn();
        const { container } = render(
            <Button disabled onClick={mockOnClick}>
                {text}
            </Button>
        );
        const buttonNode = container.querySelector('button');

        expect(buttonNode).toHaveAttribute('disabled');
        expect(buttonNode.getAttribute('tabIndex')).toBe('-1');
        fireEvent.click(buttonNode);
        expect(mockOnClick).toHaveBeenCalledTimes(0);
    });

    it('should show an icon when icon prop is passed', () => {
        const { getByRole, getByText } = render(<Button icon="trash">{text}</Button>);
        const svgNode = getByRole('img');
        const textNode = getByText(text);

        expect(svgNode).toBeDefined();
        expect(textNode).toBeDefined();
    });

    it('should add icon button class when no children are passed with icon', () => {
        const { getByRole } = render(<Button icon="trash" />);
        const buttonNode = getByRole('button');

        expect(buttonNode.classList.contains('button-for-icon')).toBe(true);
    });
});
