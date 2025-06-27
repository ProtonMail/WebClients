import { render } from '@testing-library/react';

import { Pill } from './Pill';

describe('<Pill />', () => {
    it('should render element with text content Text', () => {
        const { container } = render(<Pill>Text</Pill>);

        expect(container.textContent).toBe('Text');
    });

    it('should render with className', () => {
        const { container } = render(<Pill className="should-be-passed">Text</Pill>);

        expect(container.firstChild).toHaveClass('should-be-passed');
    });

    it('should render with default colors when no color is specified', () => {
        const { container } = render(<Pill>Text</Pill>);

        expect(container.firstChild).toHaveStyle('color: rgb(102, 69, 232)');
        expect(container.firstChild).toHaveStyle('background-color: rgb(231, 224, 255)');
    });

    it('should render with specified color and generated background color', () => {
        const { container } = render(<Pill color="#aa0867">Text</Pill>);

        expect(container.firstChild).toHaveStyle('color: rgb(170, 8, 103)');
        expect(container.firstChild).toHaveStyle('background-color: rgb(255, 224, 242)');
    });

    it('should render with specified background color and generated color', () => {
        const { container } = render(<Pill backgroundColor="#d2ffcc">Text</Pill>);

        expect(container.firstChild).toHaveStyle('color: rgb(12, 102, 0)');
        expect(container.firstChild).toHaveStyle('background-color: rgb(210, 255, 204)');
    });

    it('should render with specified background color and specified color', () => {
        const { container } = render(
            <Pill color="#aa0867" backgroundColor="#d2ffcc">
                Text
            </Pill>
        );

        expect(container.firstChild).toHaveStyle('color: rgb(170, 8, 103)');
        expect(container.firstChild).toHaveStyle('background-color: rgb(210, 255, 204)');
    });
});
