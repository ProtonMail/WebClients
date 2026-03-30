import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { useFoundationSearchAdapter } from './hooks/useFoundationSearchAdapter';
import { SearchView } from './index';

jest.mock('../../../flags/useFlagsDriveFoundationSearch', () => ({
    useFlagsDriveFoundationSearch: jest.fn(() => true),
}));

jest.mock('./hooks/useFoundationSearchAdapter');
jest.mock('./hooks/useLegacySearchAdapter');

jest.mock('./hooks/useSearchResultItems', () => ({
    useSearchResultItems: jest.fn(() => ({
        sortedItemUids: [],
        loading: false,
        sortParams: { sortField: 'name', sortOrder: 'ASC' },
        handleOpenItem: jest.fn(),
        handleSorting: jest.fn(),
        handleRenderItem: jest.fn(),
        layout: 0,
        previewModal: null,
    })),
}));

jest.mock('./hooks/useSearchViewLoader', () => ({
    useSearchViewNodesLoader: jest.fn(() => ({
        loadNodes: jest.fn(),
    })),
}));

jest.mock('./subscribeSearchStoreToEvents', () => ({
    subscribeSearchStoreToEvents: jest.fn(() => jest.fn()),
}));

jest.mock('@proton/components', () => {
    const React = require('react');
    return {
        useActiveBreakpoint: jest.fn(() => ({ viewportWidth: { isMedium: false, isLarge: true, isSmall: false } })),
        EmptyViewContainer: jest.fn((props) => React.createElement('div', null, props.children)),
    };
});

jest.mock('../../../components/FileBrowser', () => {
    const React = require('react');
    return {
        FileBrowserStateProvider: jest.fn((props) => React.createElement(React.Fragment, null, props.children)),
    };
});

jest.mock('../../../components/sections/ToolbarRow/ToolbarRow', () => {
    const React = require('react');
    return {
        __esModule: true,
        default: () => React.createElement('div', { 'data-testid': 'toolbar-row' }),
    };
});

jest.mock('../../../statelessComponents/DriveExplorer/DriveExplorer', () => {
    const React = require('react');
    return {
        DriveExplorer: () => React.createElement('div', { 'data-testid': 'drive-explorer' }),
    };
});

jest.mock('./Toolbar', () => ({
    SearchResultViewToolbar: () => null,
}));

jest.mock('./SearchContextMenu', () => ({
    SearchContextMenu: () => null,
}));

const mockedUseFoundationSearchAdapter = jest.mocked(useFoundationSearchAdapter);

const defaultAdapter: ReturnType<typeof useFoundationSearchAdapter> = {
    isSearchAvailable: true,
    isSearchEnabled: true,
    isSearchable: true,
    startIndexing: jest.fn(),
    isSearching: false,
    resultUids: [],
    refreshResults: jest.fn(),
};

const withAdapter = (overrides: Partial<ReturnType<typeof useFoundationSearchAdapter>>) => {
    mockedUseFoundationSearchAdapter.mockReturnValue({ ...defaultAdapter, ...overrides });
};

describe('SearchView', () => {
    beforeEach(() => {
        withAdapter({});
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
        const startIndexing = jest.fn();
        withAdapter({ isSearchEnabled: false, isSearchable: false, startIndexing });
        render(<SearchView />);
        await userEvent.click(screen.getByRole('button', { name: /enable drive search/i }));
        expect(startIndexing).toHaveBeenCalledTimes(1);
    });

    it('shows NoSearchResultsView when searchable with no results and not searching', () => {
        withAdapter({ isSearchable: true, resultUids: [], isSearching: false });
        render(<SearchView />);
        expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('shows DriveExplorer when searching (even with empty results)', () => {
        withAdapter({ isSearchable: true, resultUids: [], isSearching: true });
        render(<SearchView />);
        expect(screen.getByTestId('drive-explorer')).toBeInTheDocument();
    });

    it('shows DriveExplorer when there are results', () => {
        withAdapter({ isSearchable: true, resultUids: ['uid-1', 'uid-2'], isSearching: false });
        render(<SearchView />);
        expect(screen.getByTestId('drive-explorer')).toBeInTheDocument();
    });
});
