import { render, screen } from '@testing-library/react';

import { UploadedByCell } from './UploadedByCell';

describe('UploadedByCell', () => {
    it.each([
        ['leading right-to-left mark', '\u200Falice@example.com'],
        ['right-to-left override', '\u202Ealice@example.com'],
        ['left-to-right only', 'alice@example.com'],
    ])('isolates the uploader (%s)', (_, displayName) => {
        render(<UploadedByCell displayName={displayName} />);

        const name = screen.getByText(displayName);
        expect(name.tagName).toBe('BDI');
        expect(getComputedStyle(name).unicodeBidi).toMatch(/isolate$/);
    });

    it('does not isolate the anonymous label', () => {
        const { container } = render(<UploadedByCell displayName={undefined} />);

        expect(screen.getByText('Anonymous')).toBeInTheDocument();
        expect(container.querySelector('bdi')).toBeNull();
    });
});
