import type { ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';

interface GalleryMasonryGridProps {
    children: ReactNode;
}

/**
 * Places each item, in DOM order, at the top of the shortest column. Column count and gap come from
 * the `--gallery-columns` and `--gallery-gap` custom properties of `.gallery-grid`, whose breakpoints
 * also size the items, so this only sets their position and the grid's height.
 */
const useMasonryLayout = () => {
    const gridRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const grid = gridRef.current;
        if (!grid) {
            return;
        }

        const layout = () => {
            const style = window.getComputedStyle(grid);
            const columnCount = Math.max(1, parseInt(style.getPropertyValue('--gallery-columns'), 10) || 1);
            const gap = parseFloat(style.getPropertyValue('--gallery-gap')) || 0;
            const columnWidth = (grid.clientWidth - gap * (columnCount - 1)) / columnCount;
            const columnHeights = new Array<number>(columnCount).fill(0);

            // Read every height before writing any position: interleaving them would force a reflow
            // per item. Moving an absolutely positioned item doesn't change its height.
            const items = Array.from(grid.children) as HTMLElement[];
            // Layout box: ignores transforms such as the hover scale.
            const heights = items.map((item) => item.offsetHeight);

            items.forEach((item, index) => {
                const column = columnHeights.indexOf(Math.min(...columnHeights));
                item.style.insetInlineStart = `${column * (columnWidth + gap)}px`;
                item.style.insetBlockStart = `${columnHeights[column]}px`;
                columnHeights[column] += heights[index] + gap;
            });

            grid.style.blockSize = `${Math.max(0, Math.max(...columnHeights) - gap)}px`;
        };

        // Item sizes change when images load and when the grid's width or breakpoint changes. The
        // observer already batches every resize of a frame into one callback, run after layout and
        // before paint, so laying out here (not in a requestAnimationFrame, which would run a frame
        // later) never shows cards in their old place.
        const resizeObserver = new ResizeObserver(layout);

        // Items added later (load more): observing them is enough, as the observer reports each new
        // item's size once. Removed items resize nothing, so lay out for them directly.
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(({ addedNodes }) =>
                addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        resizeObserver.observe(node);
                    }
                })
            );
            if (mutations.some(({ removedNodes }) => removedNodes.length > 0)) {
                layout();
            }
        });
        mutationObserver.observe(grid, { childList: true });

        Array.from(grid.children).forEach((item) => resizeObserver.observe(item));
        layout();

        return () => {
            mutationObserver.disconnect();
            resizeObserver.disconnect();
        };
    }, []);

    return gridRef;
};

/**
 * Masonry layout with absolutely positioned items. Items stay flat in DOM order, which is also the
 * reading and Tab order (each goes to the shortest column), and breakpoints only change custom
 * properties, so nothing remounts.
 *
 * Not CSS multi-column (`column-count`): Safari misplaces composited layers (hover transform,
 * backdrop-filter, opacity animation) of items outside the first column, so they vanish on hover.
 * Not a grid with row spans either: browsers cap grid lines (10,000 in Firefox), which a long
 * Library would exceed.
 */
export const GalleryMasonryGrid = ({ children }: GalleryMasonryGridProps) => {
    const gridRef = useMasonryLayout();

    return (
        <div ref={gridRef} className="gallery-grid">
            {children}
        </div>
    );
};
