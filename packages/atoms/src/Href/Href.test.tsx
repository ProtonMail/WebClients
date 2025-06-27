import { render } from '@testing-library/react';

import { Href } from './Href';

describe('<Href />', () => {
    it('defaults href to #', () => {
        const { container } = render(<Href>Link text</Href>);

        expect(container.firstChild).toHaveAttribute('href', '#');
    });

    it('allows setting of href', () => {
        const href = 'hello';
        const { container } = render(<Href href={href}>Link text</Href>);

        expect(container.firstChild).toHaveAttribute('href', href);
    });

    it(`defaults target to '_blank'`, () => {
        const { container } = render(<Href>Link text</Href>);

        expect(container.firstChild).toHaveAttribute('target', '_blank');
    });

    it('allows setting of target', () => {
        const target = 'target';

        const { container } = render(<Href target={target}>Link text</Href>);

        expect(container.firstChild).toHaveAttribute('target', target);
    });

    it(`defaults rel to 'noopener noreferrer nofollow'`, () => {
        const { container } = render(<Href>Link text</Href>);

        expect(container.firstChild).toHaveAttribute('rel', 'noopener noreferrer nofollow');
    });

    it('allows setting of rel', () => {
        const rel = 'rel';

        const { container } = render(<Href rel={rel}>Link text</Href>);

        expect(container.firstChild).toHaveAttribute('rel', rel);
    });

    it('forwards anchor props', () => {
        const className = 'className';
        const childText = 'Link text';
        const { container } = render(<Href className={className}>{childText}</Href>);

        expect(container.firstChild).toHaveClass(className);
        expect(container.firstChild?.textContent).toBe(childText);
    });
});
