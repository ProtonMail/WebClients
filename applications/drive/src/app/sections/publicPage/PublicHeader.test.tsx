import { render, screen } from '@testing-library/react';

import { PublicHeader } from './PublicHeader';

let mockIsDesktop = true;
jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({
    __esModule: true,
    default: () => ({
        viewportWidth: { '<=small': !mockIsDesktop, '>=xlarge': mockIsDesktop },
    }),
}));
jest.mock('@proton/components/components/logo/MainLogo', () => ({ __esModule: true, default: () => null }));
jest.mock('./BookmarkButton', () => ({ BookmarkButton: () => null }));
jest.mock('./CreateAccountButton', () => ({ CreateAccountButton: () => null }));
jest.mock('./DownloadDropdown', () => ({ DownloadDropdown: () => null }));
jest.mock('./GoBackButton', () => ({ GoBackButton: () => null }));
jest.mock('./UserInfo', () => ({ UserInfo: () => null }));

const defaultProps = {
    breadcrumbOrName: 'Shared folder',
    onDownload: jest.fn(),
    onScanAndDownload: jest.fn(),
    onCopyLink: jest.fn(),
};

describe('PublicHeader', () => {
    describe.each([
        ['desktop', true],
        ['mobile', false],
    ])('on %s', (_, isDesktop) => {
        beforeEach(() => {
            mockIsDesktop = isDesktop;
        });

        it.each([
            ['leading right-to-left mark', '\u200Falice@example.com'],
            ['right-to-left override', '\u202Ealice@example.com'],
            ['left-to-right only', 'alice@example.com'],
        ])('isolates the sharer (%s) and keeps "Shared by" outside of it', (_, sharedBy) => {
            render(<PublicHeader {...defaultProps} sharedBy={sharedBy} />);

            const name = screen.getByText(sharedBy);
            expect(name.tagName).toBe('BDI');
            expect(getComputedStyle(name).unicodeBidi).toMatch(/isolate$/);
            expect(name.previousSibling?.textContent).toBe('Shared by ');
        });

        it('does not render "Shared by" without a sharer', () => {
            render(<PublicHeader {...defaultProps} />);

            expect(screen.queryByText(/Shared by/)).not.toBeInTheDocument();
        });
    });
});
