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
});
