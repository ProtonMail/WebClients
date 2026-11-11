import { render, screen } from '@testing-library/react';

import { SharedByCell } from './SharedByCell';

describe('SharedByCell', () => {
    it.each([
        ['leading right-to-left mark', '\u200Falice'],
        ['right-to-left override', '\u202Ealice'],
        ['Arabic', 'محمد'],
        ['left-to-right only', 'alice'],
    ])('isolates the display name (%s)', (_, displayName) => {
        render(<SharedByCell displayName={displayName} />);

        const name = screen.getByText(displayName);
        expect(name.tagName).toBe('BDI');
        expect(getComputedStyle(name).unicodeBidi).toMatch(/isolate$/);
    });

    it('does not isolate the public link label', () => {
        const { container } = render(<SharedByCell displayName="alice" isPublicLink />);

        expect(screen.getByText('Public link')).toBeInTheDocument();
        expect(container.querySelector('bdi')).toBeNull();
    });
});
