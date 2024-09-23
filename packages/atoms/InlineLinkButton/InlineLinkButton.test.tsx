import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { InlineLinkButton } from '@proton/atoms';

describe('<InlineLinkButton />', () => {
    it('should render with default classnames', () => {
        const { container } = render(<InlineLinkButton />);

        expect(container.firstChild).toHaveClass('link');
        expect(container.firstChild).toHaveClass('link-focus');
        expect(container.firstChild).toHaveClass('align-baseline');
        expect(container.firstChild).toHaveClass('text-left');
    });

    it('should render with className', () => {
        const { container } = render(<InlineLinkButton className="should-be-passed" />);

        expect(container.firstChild).toHaveClass('should-be-passed');
    });

    it('should render element with text content', () => {
        const { container } = render(<InlineLinkButton>Text content</InlineLinkButton>);

        expect(container.textContent).toBe('Text content');
    });

    it('forwards the ref to the button element', () => {
        const ref = React.createRef<HTMLButtonElement>();
        render(<InlineLinkButton ref={ref}>Click Me</InlineLinkButton>);

        expect(ref.current).toBeTruthy();

        if (ref.current) {
            expect(ref.current.tagName).toBe('BUTTON');
        }
    });

    it('passes extra props to the button element', () => {
        const handleClick = jest.fn();
        const { getByRole } = render(
            <InlineLinkButton onClick={handleClick} aria-label="I am a button">
                Click Me
            </InlineLinkButton>
        );

        const button = getByRole('button', { name: 'I am a button' });
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalled();
        expect(button).toHaveAttribute('aria-label', 'I am a button');
    });
});
