import { render, screen } from '@testing-library/react';

import { EmptyRootFolder } from './EmptyRootFolder';

let mockIsB2B = false;
let mockLoadingEntitlements = false;
vi.mock('@proton/activation/src/components/Modals/OAuth/Drive/useIsDriveImportRestricted', () => ({
    useIsDriveImportRestricted: () => mockIsB2B || mockLoadingEntitlements,
}));
vi.mock('@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit', () => ({
    useProductSelectionSubmit: () => ({ handleSubmit: vi.fn() }),
}));
vi.mock('./EmptyFolderIllustration', () => ({ EmptyFolderIllustration: () => null }));

describe('EmptyRootFolder', () => {
    beforeEach(() => {
        mockIsB2B = false;
        mockLoadingEntitlements = false;
    });

    it('offers the Google Drive import for non B2B users', () => {
        render(<EmptyRootFolder />);

        expect(screen.getByText('Or import your files from')).toBeInTheDocument();
        expect(screen.getByText('Google Drive')).toBeInTheDocument();
    });

    it('hides the Google Drive import for B2B users', () => {
        mockIsB2B = true;
        render(<EmptyRootFolder />);

        expect(screen.queryByText('Or import your files from')).toBeNull();
        expect(screen.queryByText('Google Drive')).toBeNull();
    });

    it('hides the Google Drive import while the B2B status is loading', () => {
        mockLoadingEntitlements = true;
        render(<EmptyRootFolder />);

        expect(screen.queryByText('Or import your files from')).toBeNull();
    });
});
