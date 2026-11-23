import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type * as DomHelpers from '@proton/shared/lib/helpers/dom';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { SelectionState } from '../../modules/selection/types';
import { DriveExplorer } from './DriveExplorer';
import type { DriveExplorerSelection, GridDefinition } from './types';

const layout = vi.hoisted(() => ({ rootFontSize: 16, width: 0 }));

vi.mock('@proton/hooks/useElementRect', () => ({ default: () => ({ width: layout.width }) }));
vi.mock('@proton/shared/lib/helpers/dom', async (importOriginal) => ({
    ...(await importOriginal<typeof DomHelpers>()),
    rootFontSize: () => layout.rootFontSize,
}));

const selection: DriveExplorerSelection = {
    selectedItems: new Set(),
    selectionMethods: {
        selectionState: SelectionState.NONE,
        selectItem: vi.fn(),
        toggleSelectItem: vi.fn(),
        toggleRange: vi.fn(),
        toggleAllSelected: vi.fn(),
        clearSelections: vi.fn(),
        isSelected: () => false,
    },
};

const grid: GridDefinition = {
    name: (uid) => <span>{uid}</span>,
    mainContent: () => null,
};

const ITEMS_PER_ROW = 4;

// Wide enough for exactly four 13.5rem tiles
const renderGrid = (itemIds: string[], rootFontSize = 16) => {
    layout.rootFontSize = rootFontSize;
    layout.width = ITEMS_PER_ROW * 13.5 * rootFontSize;
    render(
        <DriveExplorer
            itemIds={itemIds}
            layout={LayoutSetting.Grid}
            cells={[]}
            grid={grid}
            selection={selection}
            caption="test"
        />
    );
    return userEvent.setup();
};

const makeIds = (count: number) => Array.from({ length: count }, (_, index) => `item-${index}`);

const getGridRows = () =>
    Array.from(screen.getByTestId('drive-explorer-scroll').querySelectorAll<HTMLElement>('[style*="translateY"]'));

const getActivator = (uid: string) => {
    const item = screen.getAllByTestId('grid-item').find((element) => within(element).queryByText(uid));
    if (!item) {
        throw new Error(`Grid item not found for uid ${uid}`);
    }
    return within(item).getByTestId('item-a11y-activator');
};

describe('DriveExplorer grid', () => {
    beforeAll(() => {
        // @tanstack/virtual-core reads offsetWidth/offsetHeight to size the viewport
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1024 });
    });

    it.each([14, 16, 20])('sizes tiles and the gap between rows in rem at a %ipx root font size', (rootFontSize) => {
        renderGrid(makeIds(10), rootFontSize);

        const rows = getGridRows();
        expect(rows).toHaveLength(3);
        expect(within(rows[0]).getAllByTestId('grid-item')).toHaveLength(ITEMS_PER_ROW);
        // A tile is 12.25rem tall and rows are 1rem apart
        expect(rows[0].style.getPropertyValue('--h-custom')).toBe(`${12.25 * rootFontSize}px`);
        expect(rows[1].style.transform).toBe(`translateY(${13.25 * rootFontSize}px)`);
        expect(rows[2].style.transform).toBe(`translateY(${2 * 13.25 * rootFontSize}px)`);
    });

    it('moves focus to the next item on ArrowRight and to the item below on ArrowDown', async () => {
        const user = renderGrid(makeIds(10));

        getActivator('item-0').focus();
        await user.keyboard('{ArrowRight}');
        expect(getActivator('item-1')).toHaveFocus();

        await user.keyboard('{ArrowDown}');
        expect(getActivator('item-5')).toHaveFocus();
    });

    it('moves focus to the last item on End and back to the first on Home', async () => {
        const user = renderGrid(makeIds(10));

        getActivator('item-0').focus();
        await user.keyboard('{End}');
        expect(getActivator('item-9')).toHaveFocus();

        await user.keyboard('{Home}');
        expect(getActivator('item-0')).toHaveFocus();
    });
});
