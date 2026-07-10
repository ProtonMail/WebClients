import { render, screen } from '@testing-library/react';

import type { NavSectionResolved } from '@proton/nav/types/section';

import { NavSections } from './NavSections';

// Light stub so the test asserts ordering/selection, not SubSettingsSection internals.
vi.mock('@proton/components/containers/layout/SubSettingsSection', () => ({
    __esModule: true,
    default: ({ id, children }: any) => (
        <section data-testid="section" data-id={id}>
            {children}
        </section>
    ),
}));

const section = (id: string, to: string, text?: string): NavSectionResolved => ({
    id,
    to,
    text,
    beta: false,
    variant: 'default' as NavSectionResolved['variant'],
});

describe('NavSections', () => {
    it('renders sections in nav-definition order, not in content-key order', () => {
        const navItem = { sections: [section('a', '#a', 'A'), section('b', '#b', 'B'), section('c', '#c', 'C')] };

        render(
            // content keys are deliberately scrambled relative to the definition order
            <NavSections navItem={navItem} content={{ c: <div>c</div>, a: <div>a</div>, b: <div>b</div> }} />
        );

        const order = screen.getAllByTestId('section').map((el) => el.getAttribute('data-id'));
        expect(order).toEqual(['#a', '#b', '#c']);
    });

    it('renders nothing when the navItem has no sections', () => {
        const { container } = render(<NavSections navItem={undefined} content={{}} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('throws when a section id has no content', () => {
        const navItem = { sections: [section('a', '#a'), section('b', '#b')] };

        expect(() => render(<NavSections navItem={navItem} content={{ a: <div>a</div> }} />)).toThrow(
            'NavSections: no content added for section id "b"'
        );
    });
});
