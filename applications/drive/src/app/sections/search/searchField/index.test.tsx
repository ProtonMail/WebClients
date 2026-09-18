import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { useSpotlight } from '../../../legacy/components/useSpotlight';
import useDriveNavigation from '../../../legacy/hooks/drive/useNavigate';
import { useSearchModule, useUrlSearchParams } from '../../../modules/search';
import { SearchField } from './index';

jest.mock('../../../modules/search', () => ({
    useSearchModule: jest.fn(),
    useUrlSearchParams: jest.fn(),
    tryCatchWithNotification: jest.fn((fn: () => unknown) => fn),
}));

jest.mock('../../../modules/search/internal/shared/errors', () => ({
    sendErrorReportForSearch: jest.fn(),
}));

jest.mock('../../../legacy/components/useSpotlight', () => ({
    useSpotlight: jest.fn(),
}));

jest.mock('../../../legacy/hooks/drive/useNavigate', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockedUseSearchModule = jest.mocked(useSearchModule);
const mockedUseUrlSearchParams = jest.mocked(useUrlSearchParams);
const mockedUseSpotlight = jest.mocked(useSpotlight);
const mockedUseDriveNavigation = jest.mocked(useDriveNavigation);

const makeModule = (overrides: Record<string, unknown> = {}) => ({
    isAvailable: true,
    isSearchable: true,
    isIndexing: false,
    isRunningOutdatedVersion: false,
    permanentError: null,
    isUserOptIn: true,
    isIndexPartial: false,
    isPartialIndexNoticeDismissed: false,
    indexingProgress: { files: 0, folders: 0, albums: 0, photos: 0 },
    optIn: jest.fn(),
    start: jest.fn(),
    reset: jest.fn(),
    rebuild: jest.fn(),
    reindexPopulator: jest.fn(),
    dismissPartialIndexNotice: jest.fn().mockResolvedValue(undefined),
    search: jest.fn(),
    exportIndexEntries: jest.fn(),
    getIndexByteSize: jest.fn(),
    removeIndexEntry: jest.fn(),
    ...overrides,
});

describe('SearchField', () => {
    beforeEach(() => {
        mockedUseSearchModule.mockReturnValue(makeModule() as any);
        mockedUseUrlSearchParams.mockReturnValue(['', jest.fn()] as any);
        mockedUseSpotlight.mockReturnValue({ searchSpotlight: { close: jest.fn() } } as any);
        mockedUseDriveNavigation.mockReturnValue({ navigateToSearch: jest.fn(), navigateToRoot: jest.fn() } as any);
    });

    it('shows "Search drive" placeholder when the index is complete', () => {
        render(<SearchField />);
        expect(screen.getByPlaceholderText('Search drive')).toBeInTheDocument();
    });

    it('shows "Search recent items" placeholder when the index is partial', () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ isIndexPartial: true }) as any);
        render(<SearchField />);
        expect(screen.getByPlaceholderText('Search recent items')).toBeInTheDocument();
    });

    it('shows "Search is unavailable" placeholder on a permanent error, even if the index is partial', () => {
        mockedUseSearchModule.mockReturnValue(
            makeModule({ isIndexPartial: true, permanentError: 'quota_exceeded' }) as any
        );
        render(<SearchField />);
        expect(screen.getByPlaceholderText('Search is unavailable')).toBeInTheDocument();
    });

    it('opens the partial-index notice once on focus when capped and not dismissed', async () => {
        mockedUseSearchModule.mockReturnValue(makeModule({ isIndexPartial: true }) as any);
        render(<SearchField />);
        await userEvent.click(screen.getByPlaceholderText('Search recent items'));
        expect(screen.getByText('Search covers your recent items')).toBeInTheDocument();
    });

    it('does not open the partial-index notice when already dismissed', async () => {
        mockedUseSearchModule.mockReturnValue(
            makeModule({ isIndexPartial: true, isPartialIndexNoticeDismissed: true }) as any
        );
        render(<SearchField />);
        await userEvent.click(screen.getByPlaceholderText('Search recent items'));
        expect(screen.queryByText('Search covers your recent items')).not.toBeInTheDocument();
    });

    it('calls dismissPartialIndexNotice when "Got it" is clicked on the partial-index notice', async () => {
        const dismissPartialIndexNotice = jest.fn().mockResolvedValue(undefined);
        mockedUseSearchModule.mockReturnValue(makeModule({ isIndexPartial: true, dismissPartialIndexNotice }) as any);
        render(<SearchField />);
        await userEvent.click(screen.getByPlaceholderText('Search recent items'));
        await userEvent.click(screen.getByRole('button', { name: 'Got it' }));
        expect(dismissPartialIndexNotice).toHaveBeenCalledTimes(1);
    });

    it('does not show the partial-index notice when the dropdown opens for another reason after dismissal', async () => {
        // Capped from a previous session (isIndexPartial) and already dismissed, but not yet
        // searchable this session (a fresh incremental walk in progress) - this opens the dropdown
        // via the "not searchable yet" branch, not the once-per-session partial-notice branch.
        mockedUseSearchModule.mockReturnValue(
            makeModule({ isIndexPartial: true, isPartialIndexNoticeDismissed: true, isSearchable: false }) as any
        );
        render(<SearchField />);
        await userEvent.click(screen.getByPlaceholderText('Search recent items'));
        expect(screen.queryByText('Search covers your recent items')).not.toBeInTheDocument();
    });

    it('shows indexing progress, not the partial-index notice, while a capped index is still indexing', async () => {
        // isIndexing && !isSearchable: the initial walk hasn't finished yet. The notice is more
        // useful once the user can actually search, so progress takes precedence.
        mockedUseSearchModule.mockReturnValue(
            makeModule({
                isIndexPartial: true,
                isIndexing: true,
                isSearchable: false,
                indexingProgress: { files: 3, folders: 1, albums: 0, photos: 0 },
            }) as any
        );
        render(<SearchField />);
        await userEvent.click(screen.getByPlaceholderText('Search recent items'));
        expect(screen.getByText('Enabling drive search')).toBeInTheDocument();
        expect(screen.queryByText('Search covers your recent items')).not.toBeInTheDocument();
    });
});
