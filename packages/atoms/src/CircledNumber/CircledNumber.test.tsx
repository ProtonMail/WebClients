import { render } from '@testing-library/react';

import { CircledNumber } from './CircledNumber';

describe('<CircledNumber />', () => {
    it('should render with base classes and additional className', () => {
        const { container } = render(<CircledNumber number={1} className="should-be-passed" />);

        expect(container.firstChild).toHaveClass('color-primary');
        expect(container.firstChild).toHaveClass('should-be-passed');
    });

    it('should render with color className', () => {
        const { container } = render(<CircledNumber number={1} colorClassName="color-weak" />);

        expect(container.firstChild).toHaveClass('color-weak');
    });

    it('should render element with number as text content', () => {
        const { container } = render(<CircledNumber number={3} />);

        expect(container.textContent).toBe('3');
    });

    it('should render different numbers correctly', () => {
        const { container, rerender } = render(<CircledNumber number={1} />);
        expect(container.textContent).toBe('1');

        rerender(<CircledNumber number={4} />);
        expect(container.textContent).toBe('4');
    });
});
