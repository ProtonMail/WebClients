import { fireEvent, render, screen } from '@testing-library/react';

import { SelectionState } from '../../legacy/components/FileBrowser/hooks/useSelectionControls';
import type { DriveExplorerConditions, DriveExplorerEvents, DriveExplorerSelection } from './types';
import { useItemInteraction } from './useItemInteraction';

const ITEM_ID = 'vol-1~node-1';

const buildSelection = (): DriveExplorerSelection => ({
    selectedItems: new Set<string>(),
    selectionMethods: {
        selectionState: SelectionState.NONE,
        selectItem: jest.fn(),
        toggleSelectItem: jest.fn(),
        toggleRange: jest.fn(),
        toggleAllSelected: jest.fn(),
        clearSelections: jest.fn(),
        isSelected: () => false,
    },
});

// Mirrors how the row and grid wire the hook onto ItemA11yActivator, so the test
// drives real DOM events through the same handlers the app uses.
const Activator = ({ events, conditions }: { events: DriveExplorerEvents; conditions: DriveExplorerConditions }) => {
    const { handleDoubleClick, handleTouchStart, handleTouchMove, handleTouchCancel, handleTouchEnd } =
        useItemInteraction({
            itemId: ITEM_ID,
            isSelected: false,
            selection: buildSelection(),
            events,
            conditions,
        });

    return (
        <button
            type="button"
            aria-label="item"
            data-testid="activator"
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchCancel={handleTouchCancel}
            onTouchEnd={handleTouchEnd}
        />
    );
};

const renderActivator = (
    conditions: DriveExplorerConditions = { isDraggable: () => true, isDoubleClickable: () => true }
) => {
    const onItemDoubleClick = jest.fn();
    render(<Activator events={{ onItemDoubleClick }} conditions={conditions} />);
    return { onItemDoubleClick, activator: screen.getByTestId('activator') };
};

const tap = (
    activator: HTMLElement,
    { x = 20, y = 20, moveTo }: { x?: number; y?: number; moveTo?: [number, number] } = {}
) => {
    fireEvent.touchStart(activator, { changedTouches: [{ clientX: x, clientY: y }] });
    if (moveTo) {
        fireEvent.touchMove(activator, { changedTouches: [{ clientX: moveTo[0], clientY: moveTo[1] }] });
    }
    fireEvent.touchEnd(activator, {
        changedTouches: [{ clientX: moveTo ? moveTo[0] : x, clientY: moveTo ? moveTo[1] : y }],
    });
};

describe('useItemInteraction touch handling', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('opens the item on a double tap', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator);
        tap(activator);

        expect(onItemDoubleClick).toHaveBeenCalledTimes(1);
        expect(onItemDoubleClick).toHaveBeenCalledWith(ITEM_ID, expect.anything());
    });

    it('does not open the item on a single tap', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator);
        jest.advanceTimersByTime(1000);

        expect(onItemDoubleClick).not.toHaveBeenCalled();
    });

    it('does not open the item when the two taps are too far apart in time', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator);
        jest.advanceTimersByTime(600);
        tap(activator);

        expect(onItemDoubleClick).not.toHaveBeenCalled();
    });

    it('tolerates the small drift of a real tap', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator, { moveTo: [24, 23] });
        tap(activator, { moveTo: [26, 21] });

        expect(onItemDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('ignores a touch that moved away from where it started (scrolling)', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator, { moveTo: [20, 120] });
        tap(activator, { moveTo: [20, 220] });

        expect(onItemDoubleClick).not.toHaveBeenCalled();
    });

    it('drops a pending first tap when the next touch turns into a scroll', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator);
        tap(activator, { moveTo: [20, 200] });
        tap(activator);

        expect(onItemDoubleClick).not.toHaveBeenCalled();
    });

    it('ignores a cancelled touch', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator);
        fireEvent.touchStart(activator, { changedTouches: [{ clientX: 20, clientY: 20 }] });
        fireEvent.touchCancel(activator, { changedTouches: [{ clientX: 20, clientY: 20 }] });
        fireEvent.touchEnd(activator, { changedTouches: [{ clientX: 20, clientY: 20 }] });

        expect(onItemDoubleClick).not.toHaveBeenCalled();
    });

    it('does not open the item twice when the browser also synthesizes a dblclick', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator);
        tap(activator);
        fireEvent.doubleClick(activator);

        expect(onItemDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('accepts a mouse double click again once the touch guard has expired', () => {
        const { onItemDoubleClick, activator } = renderActivator();

        tap(activator);
        tap(activator);
        jest.advanceTimersByTime(500);
        fireEvent.doubleClick(activator);

        expect(onItemDoubleClick).toHaveBeenCalledTimes(2);
    });

    it('does not open items that are not double clickable', () => {
        const { onItemDoubleClick, activator } = renderActivator({
            isDraggable: () => true,
            isDoubleClickable: () => false,
        });

        tap(activator);
        tap(activator);
        fireEvent.doubleClick(activator);

        expect(onItemDoubleClick).not.toHaveBeenCalled();
    });
});
