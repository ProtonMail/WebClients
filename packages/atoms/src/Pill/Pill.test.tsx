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

        expect(container.firstChild).toHaveStyle('color: #6645e8');
        expect(container.firstChild).toHaveStyle('background-color: #e7e0ff');
    });

    it('should render with specified color and generated background color', () => {
        const { container } = render(<Pill color="#aa0867">Text</Pill>);

        expect(container.firstChild).toHaveStyle('color: #aa0867');
        expect(container.firstChild).toHaveStyle('background-color: #ffe0f2');
    });

    it('should render with specified background color and generated color', () => {
        const { container } = render(<Pill backgroundColor="#d2ffcc">Text</Pill>);

        expect(container.firstChild).toHaveStyle('color: #0c6600');
        expect(container.firstChild).toHaveStyle('background-color: #d2ffcc');
    });

    it('should render with specified background color and specified color', () => {
        const { container } = render(
            <Pill color="#aa0867" backgroundColor="#d2ffcc">
                Text
            </Pill>
        );

        expect(container.firstChild).toHaveStyle('color: #aa0867');
        expect(container.firstChild).toHaveStyle('background-color: #d2ffcc');
    });
});
