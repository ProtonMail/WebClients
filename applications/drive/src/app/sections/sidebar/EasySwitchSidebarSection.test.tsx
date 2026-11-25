import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat';

import { fireEvent, render, screen } from '@testing-library/react';

import { PRODUCT_NAMES } from '@proton/shared/lib/constants';

import { EasySwitchSidebarSection } from './EasySwitchSidebarSection';
import { type EasySwitchSidebarUserInfo, EasySwitchUserType, NO_USER_INFO } from './getEasySwitchSidebarUserType';
import { useDriveImportStatus } from './useDriveImportStatus';

vi.mock('@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit', () => ({
    useProductSelectionSubmit: () => ({ handleSubmit: vi.fn() }),
}));
let mockIsB2B = false;
let mockLoadingEntitlements = false;
vi.mock('@proton/activation/src/components/Modals/OAuth/Drive/useIsDriveImportRestricted', () => ({
    useIsDriveImportRestricted: () => mockIsB2B || mockLoadingEntitlements,
}));
vi.mock('@proton/components/components/link/useSettingsLink', () => ({
    __esModule: true,
    default: () => vi.fn(),
}));
vi.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: () => ({ feature: undefined, update: vi.fn() }),
}));
vi.mock('./useDriveImportStatus', () => ({ useDriveImportStatus: vi.fn() }));
let mockUserInfo: EasySwitchSidebarUserInfo = NO_USER_INFO;
vi.mock('./useEasySwitchSidebarUserType', () => ({
    useEasySwitchSidebarUserType: () => mockUserInfo,
}));

const IMPORT_FOLDER_UID = 'volume-id~link-id';

const clearOutcome = vi.fn();

const renderSection = () =>
    render(
        <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<EasySwitchSidebarSection collapsed={false} />} />
                <Route path="volume-id/link-id" element={<div>Volume link route</div>} />
            </Routes>
        </MemoryRouter>
    );

const renderWithFinishedImport = (importFolderUid?: string) => {
    vi.mocked(useDriveImportStatus).mockReturnValue({
        isLoaded: true,
        isImporting: false,
        isPaused: false,
        pausedImport: undefined,
        hasCompletedImport: true,
        outcome: 'success',
        importFolderUid,
        clearOutcome,
    });
    renderSection();
};

const renderWithImport = (isImporting: boolean) => {
    vi.mocked(useDriveImportStatus).mockReturnValue({
        isLoaded: true,
        isImporting,
        isPaused: false,
        pausedImport: undefined,
        hasCompletedImport: false,
        outcome: undefined,
        importFolderUid: undefined,
        clearOutcome,
    });
    renderSection();
};

beforeEach(() => {
    vi.clearAllMocks();
    mockIsB2B = false;
    mockLoadingEntitlements = false;
    mockUserInfo = NO_USER_INFO;
});

describe('EasySwitchSidebarSection', () => {
    it('opens the import folder through the volume link and closes the success modal from "Go to folder"', () => {
        renderWithFinishedImport(IMPORT_FOLDER_UID);

        fireEvent.click(screen.getByText('Go to folder'));

        expect(clearOutcome).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Volume link route')).toBeInTheDocument();
    });

    it('hides "Go to folder" when the import folder is unknown', () => {
        renderWithFinishedImport();

        expect(screen.getByText('Your import is finished!')).toBeInTheDocument();
        expect(screen.queryByText('Go to folder')).toBeNull();
    });

    describe('without an ongoing import', () => {
        beforeEach(() => {
            mockUserInfo = { userType: EasySwitchUserType.HighUsageUser, showNewBadge: false };
        });

        it('shows the import entry to eligible non B2B users', () => {
            renderWithImport(false);

            expect(screen.getByText('Import from Google')).toBeInTheDocument();
        });

        it('hides the import entry from B2B users', () => {
            mockIsB2B = true;
            renderWithImport(false);

            expect(screen.queryByText('Import from Google')).toBeNull();
            expect(screen.queryByText(PRODUCT_NAMES.EASY_SWITCH)).toBeNull();
        });

        it('hides the import entry while the B2B status is loading', () => {
            mockLoadingEntitlements = true;
            renderWithImport(false);

            expect(screen.queryByText('Import from Google')).toBeNull();
        });
    });

    it('keeps showing an ongoing import to B2B users', () => {
        mockIsB2B = true;
        renderWithImport(true);

        expect(screen.getByText('Importing from Google')).toBeInTheDocument();
    });
});
