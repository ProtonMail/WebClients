import { render, screen } from '@testing-library/react';

import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { SelectionState } from '../../modules/selection/types';
import { SortField } from '../../modules/sorting/types';
import { DriveExplorer } from './DriveExplorer';
import type { CellDefinition, DriveExplorerSelection, SelectionMethods } from './types';

function makeSelectionMethods(overrides: Partial<SelectionMethods> = {}): SelectionMethods {
    return {
        selectionState: SelectionState.NONE,
        selectItem: vi.fn(),
        toggleSelectItem: vi.fn(),
        toggleRange: vi.fn(),
        toggleAllSelected: vi.fn(),
        clearSelections: vi.fn(),
        isSelected: vi.fn(() => false),
        ...overrides,
    };
}

function makeSelection(selected: string[] = []): DriveExplorerSelection {
    const set = new Set(selected);
    return {
        selectedItems: set,
        selectionMethods: makeSelectionMethods({ isSelected: (uid) => set.has(uid) }),
    };
}

const nameCell: CellDefinition = {
    id: 'name',
    headerText: 'Name',
    sortField: SortField.name,
    render: (uid) => <span>{uid}</span>,
};

const headerActions = <button data-testid="layout-toggle">toggle</button>;

function renderExplorer(opts: { layout?: LayoutSetting; selection?: DriveExplorerSelection } = {}) {
    return render(
        <DriveExplorer
            itemIds={['a', 'b']}
            layout={opts.layout ?? LayoutSetting.List}
            cells={[nameCell]}
            selection={opts.selection ?? makeSelection()}
            sort={{ sortBy: SortField.name, onSort: vi.fn() }}
            caption="test"
            headerActions={headerActions}
        />
    );
}

describe('DriveExplorer headerActions', () => {
    it('renders headerActions in the list header', () => {
        renderExplorer({ layout: LayoutSetting.List });
        expect(screen.getByTestId('layout-toggle')).toBeInTheDocument();
    });

    it('renders headerActions in the grid header', () => {
        renderExplorer({ layout: LayoutSetting.Grid });
        expect(screen.getByTestId('layout-toggle')).toBeInTheDocument();
    });

    it('hides headerActions while items are selected', () => {
        renderExplorer({ layout: LayoutSetting.List, selection: makeSelection(['a']) });
        expect(screen.queryByTestId('layout-toggle')).not.toBeInTheDocument();
    });
});
