import { render } from '@testing-library/react';

import { Card } from './Card';

describe('<Card />', () => {
    it('renders with a border and background by default', () => {
        const { container } = render(<Card>Lorem ipsum dolor sit amet consectetur adipisicing elit.</Card>);

        expect(container.firstChild).toHaveClass('border');
        expect(container.firstChild).toHaveClass('bg-weak');
    });

    it('renders without a border and background if explicitly specified', () => {
        const { container } = render(
            <Card bordered={false} background={false}>
                Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </Card>
        );

        expect(container.firstChild).not.toHaveClass('border');
        expect(container.firstChild).not.toHaveClass('bg-weak');
    });

    it('renders rounded', () => {
        const { container } = render(<Card rounded>Lorem ipsum dolor sit amet consectetur adipisicing elit.</Card>);

        expect(container.firstChild).toHaveClass('rounded');
    });

    it.each([
        ['sm', 'rounded-sm'],
        ['md', 'rounded'],
        ['lg', 'rounded-lg'],
        ['xl', 'rounded-xl'],
        ['xxl', 'rounded-xxl'],
    ] as const)('renders rounded with size %s', (size, className) => {
        const { container } = render(<Card rounded={size}>Lorem ipsum</Card>);

        expect(container.firstChild).toHaveClass(className);
    });

    it('is not rounded when rounded is false', () => {
        const { container } = render(<Card rounded={false}>Lorem ipsum</Card>);

        expect(container.firstChild).not.toHaveClass('rounded');
    });
});
