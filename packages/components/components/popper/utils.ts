const DEFAULT_TOOLTIP_OFFSET = 10;

export const ALL_PLACEMENTS = [
    'bottom',
    'bottom-left',
    'bottom-right',
    'top',
    'top-left',
    'top-right',
    'left',
    'left-bottom',
    'left-top',
    'right',
    'right-bottom',
    'right-top',
];

export const CORNERS_ONLY_PLACEMENTS = [
    'bottom-left',
    'bottom-right',
    'top-left',
    'top-right',
    'left-bottom',
    'left-top',
    'right-bottom',
    'right-top',
];

const inverted: { [key: string]: string } = {
    left: 'right',
    right: 'left',
    bottom: 'top',
    top: 'bottom',
};

export type Position = { top: number; left: number };

type ElementRect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

/**
 * Tries to maintain placement as close to the original as possible.
 * Places in this order of preference:
 * - same orientation as original (e.g. bottom-left, bottom, bottom-right)
 * - same orientation as original alignment (e.g. left-bottom => bottom-*)
 * - inverted orientation than original (e.g. top => bottom)
 * - whatever is left
 *
 * always prefers alignment to be the same as original alignment or orientation.
 */
export const orderPlacements = (originalPlacement: string, placements = ALL_PLACEMENTS) => {
    const orientation = originalPlacement.split('-')[0];
    const alignment = originalPlacement.split('-')[1];

    const compareAlignment = (a: string, b: string) => {
        if (
            (b.endsWith(alignment) && !b.startsWith(alignment) && !a.endsWith(alignment)) ||
            (b.endsWith(orientation) && !b.startsWith(orientation) && !a.endsWith(orientation))
        ) {
            return 1;
        }

        if (
            (a.endsWith(alignment) && !a.startsWith(alignment) && !b.endsWith(alignment)) ||
            (a.endsWith(orientation) && !a.startsWith(orientation) && !b.endsWith(orientation))
        ) {
            return -1;
        }

        return 0;
    };

    const sameOrientation = placements.filter((placement) => placement.startsWith(orientation)).sort(compareAlignment);
    const sameOrientationAsAlignment = placements
        .filter((placement) => placement.startsWith(alignment))
        .sort(compareAlignment);
    const invertedOrientation = placements
        .filter((placement) => placement.startsWith(inverted[orientation]))
        .sort(compareAlignment);
    const preferred = [...sameOrientation, ...sameOrientationAsAlignment, ...invertedOrientation];
    const remaining = placements.filter((placement) => !preferred.includes(placement)).sort(compareAlignment);
    return [...preferred, ...remaining];
};

const calculatePosition = (
    target: ElementRect,
    tooltip: ElementRect,
    placement: string,
    offset = DEFAULT_TOOLTIP_OFFSET,
    originalPosition?: Position
): Position => {
    let alignCenter = {
        top: target.top + target.height / 2 - tooltip.height / 2,
        left: target.left + target.width / 2 - tooltip.width / 2,
    };

    let alignTop = target.top;
    let alignBottom = target.top + target.height - tooltip.height;
    let alignLeft = target.left;
    let alignRight = target.left - tooltip.width + target.width;

    let placeAbove = target.top - tooltip.height - offset;
    let placeBelow = target.top + target.height + offset;
    let placeLeft = target.left - tooltip.width - offset;
    let placeRight = target.left + target.width + offset;

    if (originalPosition) {
        alignCenter = {
            top: originalPosition.top + target.height / 2 - tooltip.height / 2,
            left: originalPosition.left + target.width / 2 - tooltip.width / 2,
        };

        alignTop = originalPosition.top;
        alignBottom = originalPosition.top + tooltip.height;
        alignLeft = originalPosition.left;
        alignRight = originalPosition.left - tooltip.width;

        placeAbove = originalPosition.top - tooltip.height - offset;
        placeBelow = originalPosition.top + offset;
        placeLeft = originalPosition.left - tooltip.width - offset;
        placeRight = originalPosition.left + offset;
    }

    const placementList: { [key: string]: Position } = {
        top: { left: alignCenter.left, top: placeAbove },
        bottom: { left: alignCenter.left, top: placeBelow },
        left: { left: placeLeft, top: alignCenter.top },
        right: { left: placeRight, top: alignCenter.top },
        'bottom-left': { left: alignLeft, top: placeBelow },
        'top-left': { left: alignLeft, top: placeAbove },
        'bottom-right': { left: alignRight, top: placeBelow },
        'top-right': { left: alignRight, top: placeAbove },
        'right-bottom': { left: placeRight, top: alignBottom },
        'right-top': { left: placeRight, top: alignTop },
        'left-bottom': { left: placeLeft, top: alignBottom },
        'left-top': { left: placeLeft, top: alignTop },
    };

    return placementList[placement];
};

const isOutOfScreen = (tooltip: ElementRect, position: Position) => {
    return (
        position.top + tooltip.height > window.innerHeight ||
        position.left + tooltip.width > window.innerWidth ||
        position.top < 0 ||
        position.left < 0
    );
};

const optimisePositionAndPlacement = (
    target: ElementRect,
    tooltip: ElementRect,
    offset: number,
    availablePlacements = ALL_PLACEMENTS,
    originalPosition?: Position
): { position: Position; placement: string } | null => {
    if (!availablePlacements.length) {
        return null;
    }

    const [placement, ...rest] = availablePlacements;
    const position = calculatePosition(target, tooltip, placement, offset, originalPosition);

    return isOutOfScreen(tooltip, position)
        ? optimisePositionAndPlacement(target, tooltip, offset, rest, originalPosition)
        : { position, placement };
};

export const adjustPosition = (
    target: ElementRect,
    tooltip: ElementRect,
    placement: string,
    offset: number,
    originalPosition?: Position,
    availablePlacements = ALL_PLACEMENTS
) => {
    const placementsByPriority = orderPlacements(placement, availablePlacements);
    const optimalLocation = optimisePositionAndPlacement(
        target,
        tooltip,
        offset,
        placementsByPriority,
        originalPosition
    );

    if (!optimalLocation) {
        // No good position on screen, fallback to original
        const position = calculatePosition(target, tooltip, placement, offset, originalPosition);
        return {
            position,
            placement,
        };
    }
    return optimalLocation;
};

export const computedSize = (stylePixels: string, boundsSize: number) => {
    const computedStyleSize = Number(stylePixels.replace('px', ''));
    return Number.isNaN(computedStyleSize) ? boundsSize : computedStyleSize;
};
