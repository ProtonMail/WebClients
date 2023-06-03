import { rootFontSize } from '@proton/shared/lib/helpers/dom';

export const calculateCellDimensions = (areaWidth: number) => {
    const itemWidth = 13.5 * rootFontSize(); // 13.5 * 16 = we want 216px by default
    const itemHeight = 12.25 * rootFontSize(); // 12.25 * 16 = we want 196px by default

    const rowItemCount = Math.floor(areaWidth / itemWidth);
    const expandedItemWidth = areaWidth / rowItemCount;
    const squishedItemWidth = areaWidth / (rowItemCount + 1);
    const oversizing = expandedItemWidth - itemWidth;
    const oversquishing = itemWidth - squishedItemWidth;
    const ratio = itemHeight / itemWidth;

    // If expanded width is less imperfect than squished width
    if (oversizing <= oversquishing) {
        return {
            cellWidth: expandedItemWidth,
            cellHeight: expandedItemWidth * ratio,
        };
    }

    return {
        cellWidth: squishedItemWidth,
        cellHeight: squishedItemWidth * ratio,
    };
};
