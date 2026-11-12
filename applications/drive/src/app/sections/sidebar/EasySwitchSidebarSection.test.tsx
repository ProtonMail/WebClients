import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat';

import { fireEvent, render, screen } from '@testing-library/react';

import { EasySwitchSidebarSection } from './EasySwitchSidebarSection';
import { useDriveImportStatus } from './useDriveImportStatus';

jest.mock('@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit', () => ({
    useProductSelectionSubmit: () => ({ handleSubmit: jest.fn() }),
}));
jest.mock('@proton/components/components/link/useSettingsLink', () => ({
    __esModule: true,
    default: () => jest.fn(),
}));
jest.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: () => ({ feature: undefined, update: jest.fn() }),
}));
jest.mock('./useDriveImportStatus', () => ({ useDriveImportStatus: jest.fn() }));
jest.mock('./useEasySwitchSidebarUserType', () => ({
    useEasySwitchSidebarUserType: () => jest.requireActual('./getEasySwitchSidebarUserType').NO_USER_INFO,
}));

const IMPORT_FOLDER_UID = 'volume-id~link-id';

const clearOutcome = jest.fn();

const renderWithFinishedImport = (importFolderUid?: string) => {
    jest.mocked(useDriveImportStatus).mockReturnValue({
        isLoaded: true,
        isImporting: false,
        isPaused: false,
        pausedImport: undefined,
        hasCompletedImport: true,
        outcome: 'success',
        importFolderUid,
        clearOutcome,
    });
    render(
        <MemoryRouter initialEntries={['/']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<EasySwitchSidebarSection collapsed={false} />} />
                <Route path="volume-id/link-id" element={<div>Volume link route</div>} />
            </Routes>
        </MemoryRouter>
    );
};

beforeEach(() => {
    jest.clearAllMocks();
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
});
