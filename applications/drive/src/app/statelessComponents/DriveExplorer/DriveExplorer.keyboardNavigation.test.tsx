import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { SelectionState } from '../../modules/selection/types';
import { DriveExplorer } from './DriveExplorer';
import type { CellDefinition, DriveExplorerEvents, DriveExplorerSelection, SelectionMethods } from './types';

function makeSelectionMethods(overrides: Partial<SelectionMethods> = {}): SelectionMethods {
    return {
        selectionState: SelectionState.NONE,
        selectItem: jest.fn(),
        toggleSelectItem: jest.fn(),
        toggleRange: jest.fn(),
        toggleAllSelected: jest.fn(),
        clearSelections: jest.fn(),
        isSelected: jest.fn(() => false),
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
    render: (uid) => <span>{uid}</span>,
};

function renderExplorer(opts: {
    itemIds: string[];
    layout?: LayoutSetting;
    selection?: DriveExplorerSelection;
    events?: DriveExplorerEvents;
}) {
    const selection = opts.selection ?? makeSelection();
    return {
        selection,
        ...render(
            <DriveExplorer
                itemIds={opts.itemIds}
                layout={opts.layout ?? LayoutSetting.List}
                cells={[nameCell]}
                selection={selection}
                events={opts.events}
                caption="test"
            />
        ),
    };
}

function getActivator(uid: string): HTMLElement {
    const row = document.querySelector(`[data-drive-explorer-item-uid="${CSS.escape(uid)}"]`);
    if (!row) {
        throw new Error(`Row not found for uid ${uid}`);
    }
    const activator = row.querySelector('[data-testid="item-a11y-activator"]');
    if (!activator) {
        throw new Error(`Activator not found for uid ${uid}`);
    }
    return activator as HTMLElement;
}

describe('DriveExplorer keyboard navigation', () => {
    beforeAll(() => {
        Element.prototype.scrollIntoView = jest.fn();
        // @tanstack/virtual-core reads offsetWidth/offsetHeight to size the viewport;
        // jsdom returns 0 for both so without this the virtualizer renders no rows.
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1024 });
    });

    beforeEach(() => {
        (Element.prototype.scrollIntoView as jest.Mock).mockClear();
    });

    it('ArrowDown moves focus to the next row activator', async () => {
        const ids = ['a', 'b', 'c'];
        renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        getActivator('a').focus();
        await user.keyboard('{ArrowDown}');

        expect(document.activeElement).toBe(getActivator('b'));
    });

    it('ArrowUp moves focus to the previous row activator', async () => {
        const ids = ['a', 'b', 'c'];
        renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        getActivator('c').focus();
        await user.keyboard('{ArrowUp}');

        expect(document.activeElement).toBe(getActivator('b'));
    });

    it('multiple ArrowDown then ArrowUp presses walk focus down then back up', async () => {
        const ids = ['a', 'b', 'c', 'd', 'e'];
        renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        getActivator('a').focus();

        await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
        expect(document.activeElement).toBe(getActivator('d'));

        await user.keyboard('{ArrowUp}{ArrowUp}');
        expect(document.activeElement).toBe(getActivator('b'));
    });

    it('ArrowDown on the last row clamps and keeps focus on the last row', async () => {
        const ids = ['a', 'b', 'c'];
        renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        getActivator('c').focus();
        await user.keyboard('{ArrowDown}');

        expect(document.activeElement).toBe(getActivator('c'));
    });

    it('Home jumps focus to the first row and scrolls it to center', async () => {
        const ids = ['a', 'b', 'c', 'd', 'e'];
        renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        getActivator('d').focus();
        (Element.prototype.scrollIntoView as jest.Mock).mockClear();
        await user.keyboard('{Home}');

        expect(document.activeElement).toBe(getActivator('a'));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    });

    it('End jumps focus to the last row and scrolls it to center', async () => {
        const ids = ['a', 'b', 'c', 'd', 'e'];
        renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        getActivator('a').focus();
        (Element.prototype.scrollIntoView as jest.Mock).mockClear();
        await user.keyboard('{End}');

        expect(document.activeElement).toBe(getActivator('e'));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });
    });

    it('Space on a focused row toggles selection without losing focus', async () => {
        const ids = ['a', 'b', 'c'];
        const { selection } = renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        const activator = getActivator('b');
        activator.focus();

        await user.keyboard(' ');

        expect(selection.selectionMethods.toggleSelectItem).toHaveBeenCalledWith('b');
        expect(document.activeElement).toBe(activator);
    });

    it('Arrow-navigating row to row and pressing Space toggles each item in turn (multi-select)', async () => {
        const ids = ['a', 'b', 'c'];
        const { selection } = renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        getActivator('a').focus();

        await user.keyboard(' ');
        await user.keyboard('{ArrowDown}');
        await user.keyboard(' ');
        await user.keyboard('{ArrowDown}');
        await user.keyboard(' ');

        expect(selection.selectionMethods.toggleSelectItem).toHaveBeenCalledTimes(3);
        expect(selection.selectionMethods.toggleSelectItem).toHaveBeenNthCalledWith(1, 'a');
        expect(selection.selectionMethods.toggleSelectItem).toHaveBeenNthCalledWith(2, 'b');
        expect(selection.selectionMethods.toggleSelectItem).toHaveBeenNthCalledWith(3, 'c');
        expect(document.activeElement).toBe(getActivator('c'));
    });

    it('Enter on a focused row triggers onItemDoubleClick', async () => {
        const ids = ['a', 'b', 'c'];
        const onItemDoubleClick = jest.fn();
        renderExplorer({ itemIds: ids, events: { onItemDoubleClick } });
        const user = userEvent.setup();

        getActivator('b').focus();
        await user.keyboard('{Enter}');

        expect(onItemDoubleClick).toHaveBeenCalledWith('b', expect.anything());
    });

    it('Arrow keys do not call any selection method', async () => {
        const ids = ['a', 'b', 'c'];
        const { selection } = renderExplorer({ itemIds: ids });
        const user = userEvent.setup();

        getActivator('a').focus();
        await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');

        expect(selection.selectionMethods.selectItem).not.toHaveBeenCalled();
        expect(selection.selectionMethods.toggleSelectItem).not.toHaveBeenCalled();
        expect(selection.selectionMethods.toggleRange).not.toHaveBeenCalled();
        expect(selection.selectionMethods.clearSelections).not.toHaveBeenCalled();
    });
});
