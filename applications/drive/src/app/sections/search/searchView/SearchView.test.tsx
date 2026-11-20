import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { useSearchResultItems } from './hooks/useSearchResultItems';
import { useSearchViewModel } from './hooks/useSearchViewModel';
import { SearchView } from './index';

vi.mock('./hooks/useSearchViewModel');

vi.mock('./hooks/useSearchResultItems', () => ({
    useSearchResultItems: vi.fn(() => ({
        sortedItemUids: [],
        loading: false,
        sortParams: { sortField: 'name', sortOrder: 'ASC' },
        handleOpenItem: vi.fn(),
        handleSorting: vi.fn(),
        handleRenderItem: vi.fn(),
        layout: 0,
        previewModal: null,
    })),
}));

vi.mock('./subscribeSearchStoreToEvents', () => ({
    subscribeSearchStoreToEvents: vi.fn(() => vi.fn()),
}));

vi.mock('@proton/components/hooks/useActiveBreakpoint', () => ({
    __esModule: true,
    default: vi.fn(() => ({ viewportWidth: { isMedium: false, isLarge: true, isSmall: false } })),
}));

vi.mock('../../../statelessComponents/ToolbarRow/ToolbarRow', async () => {
    const React = await import('react');
    return {
        ToolbarRow: () => React.createElement('div', { 'data-testid': 'toolbar-row' }),
    };
});

vi.mock('../../../statelessComponents/DriveExplorer/DriveExplorer', async () => {
    const React = await import('react');
    return {
        DriveExplorer: () => React.createElement('div', { 'data-testid': 'drive-explorer' }),
    };
});

vi.mock('./Toolbar', () => ({
    SearchResultViewToolbar: () => null,
}));

vi.mock('./SearchContextMenu', () => ({
    SearchContextMenu: () => null,
}));

const mockedUseFoundationSearchAdapter = vi.mocked(useSearchViewModel);
const mockedUseSearchResultItems = vi.mocked(useSearchResultItems);

const defaultAdapter: ReturnType<typeof useSearchViewModel> = {
    isSearchAvailable: true,
    isSearchEnabled: true,
    isSearchable: true,
    isRunningOutdatedVersion: false,
    startIndexing: vi.fn(),
    isSearching: false,
    refreshResults: vi.fn(),
    indexingProgress: { files: 0, folders: 0, albums: 0, photos: 0 },
    isIndexPartial: false,
};

const withAdapter = (overrides: Partial<ReturnType<typeof useSearchViewModel>>) => {
    mockedUseFoundationSearchAdapter.mockReturnValue({ ...defaultAdapter, ...overrides });
};

describe('SearchView', () => {
    beforeEach(() => {
        withAdapter({});
        mockedUseSearchResultItems.mockReturnValue({
            sortedItemUids: [],
            loading: false,
            sortParams: { sortField: 'name', sortOrder: 'ASC' },
            handleOpenItem: vi.fn(),
            handleSorting: vi.fn(),
            handleRenderItem: vi.fn(),
            layout: 0,
            previewModal: null,
        } as any);
    });

    it('renders nothing when search is not available', () => {
        withAdapter({ isSearchAvailable: false });
        const { container } = render(<SearchView />);
        expect(container.innerHTML).toBe('');
    });

    it('shows EnableSearchView when user has not opted in', () => {
        withAdapter({ isSearchEnabled: false, isSearchable: false });
        render(<SearchView />);
        const button = screen.getByRole('button', { name: /enable drive search/i });
        expect(button).toBeEnabled();
        expect(button).not.toHaveAttribute('aria-busy', 'true');
    });

    it('shows EnableSearchView with loading button when indexing is in progress', () => {
        withAdapter({ isSearchEnabled: true, isSearchable: false });
        render(<SearchView />);
        const button = screen.getByRole('button', { name: /enable drive search/i });
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('calls startIndexing when enable button is clicked', async () => {
        const startIndexing = vi.fn();
        withAdapter({ isSearchEnabled: false, isSearchable: false, startIndexing });
        render(<SearchView />);
        await userEvent.click(screen.getByRole('button', { name: /enable drive search/i }));
        expect(startIndexing).toHaveBeenCalledTimes(1);
    });

    it('shows NoSearchResultsView when searchable with no results and not searching', () => {
        withAdapter({ isSearchable: true, isSearching: false });
        render(<SearchView />);
        expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('adds a partial-index hint to NoSearchResultsView when the index is capped', () => {
        withAdapter({ isSearchable: true, isSearching: false, isIndexPartial: true });
        render(<SearchView />);
        expect(
            screen.getByText(/some older files aren't indexed because your drive is too large to index fully/i)
        ).toBeInTheDocument();
    });

    it('does not show the partial-index hint when the index is not capped', () => {
        withAdapter({ isSearchable: true, isSearching: false, isIndexPartial: false });
        render(<SearchView />);
        expect(
            screen.queryByText(/some older files aren't indexed because your drive is too large to index fully/i)
        ).not.toBeInTheDocument();
    });

    it('shows DriveExplorer when searching (even with empty results)', () => {
        withAdapter({ isSearchable: true, isSearching: true });
        render(<SearchView />);
        expect(screen.getByTestId('drive-explorer')).toBeInTheDocument();
    });

    it('shows DriveExplorer when there are results', () => {
        withAdapter({ isSearchable: true, isSearching: false });
        mockedUseSearchResultItems.mockReturnValue({
            sortedItemUids: ['uid-1', 'uid-2'],
            loading: false,
            sortParams: { sortField: 'name', sortOrder: 'ASC' },
            handleOpenItem: vi.fn(),
            handleSorting: vi.fn(),
            handleRenderItem: vi.fn(),
            layout: 0,
            previewModal: null,
        } as any);
        render(<SearchView />);
        expect(screen.getByTestId('drive-explorer')).toBeInTheDocument();
    });

    it('keeps showing existing results instead of EnableSearchView when deactivated as outdated', () => {
        withAdapter({ isSearchEnabled: false, isSearchable: false, isRunningOutdatedVersion: true });
        mockedUseSearchResultItems.mockReturnValue({
            sortedItemUids: ['uid-1', 'uid-2'],
            loading: false,
            sortParams: { sortField: 'name', sortOrder: 'ASC' },
            handleOpenItem: vi.fn(),
            handleSorting: vi.fn(),
            handleRenderItem: vi.fn(),
            layout: 0,
            previewModal: null,
        } as any);
        render(<SearchView />);
        expect(screen.getByTestId('drive-explorer')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /enable drive search/i })).not.toBeInTheDocument();
    });

    it('shows EnableSearchView when deactivated as outdated with no prior results', () => {
        withAdapter({ isSearchEnabled: false, isSearchable: false, isRunningOutdatedVersion: true });
        render(<SearchView />);
        expect(screen.getByRole('button', { name: /enable drive search/i })).toBeInTheDocument();
    });
});
