import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { useSpotlight } from '../../../legacy/components/useSpotlight';
import useDriveNavigation from '../../../legacy/hooks/drive/useNavigate';
import { useSearchModule, useUrlSearchParams } from '../../../modules/search';
import { SearchField } from './index';

vi.mock('../../../modules/search', () => ({
    useSearchModule: vi.fn(),
    useUrlSearchParams: vi.fn(),
    tryCatchWithNotification: vi.fn((fn: () => unknown) => fn),
}));

vi.mock('../../../modules/search/internal/shared/errors', () => ({
    sendErrorReportForSearch: vi.fn(),
}));

vi.mock('../../../legacy/components/useSpotlight', () => ({
    useSpotlight: vi.fn(),
}));

vi.mock('../../../legacy/hooks/drive/useNavigate', () => ({
    __esModule: true,
    default: vi.fn(),
}));

const mockedUseSearchModule = vi.mocked(useSearchModule);
const mockedUseUrlSearchParams = vi.mocked(useUrlSearchParams);
const mockedUseSpotlight = vi.mocked(useSpotlight);
const mockedUseDriveNavigation = vi.mocked(useDriveNavigation);

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
    optIn: vi.fn(),
    start: vi.fn(),
    reset: vi.fn(),
    rebuild: vi.fn(),
    reindexPopulator: vi.fn(),
    dismissPartialIndexNotice: vi.fn().mockResolvedValue(undefined),
    search: vi.fn(),
    exportIndexEntries: vi.fn(),
    getIndexByteSize: vi.fn(),
    removeIndexEntry: vi.fn(),
    ...overrides,
});

describe('SearchField', () => {
    beforeEach(() => {
        mockedUseSearchModule.mockReturnValue(makeModule() as any);
        mockedUseUrlSearchParams.mockReturnValue(['', vi.fn()] as any);
        mockedUseSpotlight.mockReturnValue({ searchSpotlight: { close: vi.fn() } } as any);
        mockedUseDriveNavigation.mockReturnValue({ navigateToSearch: vi.fn(), navigateToRoot: vi.fn() } as any);
    });

    it('searches when Enter is pressed', () => {
        const navigateToSearch = vi.fn();
        mockedUseUrlSearchParams.mockReturnValue(['report', vi.fn()] as any);
        mockedUseDriveNavigation.mockReturnValue({ navigateToSearch, navigateToRoot: vi.fn() } as any);
        render(<SearchField />);
        fireEvent.keyDown(screen.getByPlaceholderText('Search drive'), { key: 'Enter' });
        expect(navigateToSearch).toHaveBeenCalledWith('report');
    });

    it.each([{ isComposing: true }, { keyCode: 229 }])(
        'does not search when Enter confirms an IME composition (%o)',
        (composition) => {
            const navigateToSearch = vi.fn();
            mockedUseUrlSearchParams.mockReturnValue(['報告', vi.fn()] as any);
            mockedUseDriveNavigation.mockReturnValue({ navigateToSearch, navigateToRoot: vi.fn() } as any);
            render(<SearchField />);
            fireEvent.keyDown(screen.getByPlaceholderText('Search drive'), { key: 'Enter', ...composition });
            expect(navigateToSearch).not.toHaveBeenCalled();
        }
    );

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
        const dismissPartialIndexNotice = vi.fn().mockResolvedValue(undefined);
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
