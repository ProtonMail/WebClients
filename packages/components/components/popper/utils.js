const DEFAULT_TOOLTIP_OFFSET = 10;

export const ALL_PLACEMENTS = [
    'bottom',
    'bottom-left',
    'bottom-right',
    'top',
    'top-left',
    'top-right',
    'left',
    'right'
];

// First checks the same orientation (all bottom-* if bottom, etc.) then alignment
const orderPlacements = (originalPlacement, placements = ALL_PLACEMENTS) => {
    const orientation = originalPlacement.split('-')[0];
    const alignment = originalPlacement.split('-')[1];
    return [...placements].sort((a, b) => {
        if (a.startsWith(orientation) && !b.startsWith(orientation)) {
            return -1;
        }
        if (a.endsWith(alignment) && !a.startsWith(alignment) && !b.endsWith(alignment)) {
            return -1;
        }
        return 0;
    });
};

const calculatePosition = (target, tooltip, placement, offset = DEFAULT_TOOLTIP_OFFSET) => {
    const center = {
        top: target.top + target.height / 2 - tooltip.height / 2,
        left: target.left + target.width / 2 - tooltip.width / 2
    };

    const alignAbove = target.top - tooltip.height - offset;
    const alignBelow = target.top + target.height + offset;
    const alignLeft = target.left - tooltip.width - offset;
    const alignRight = target.left + target.width + offset;

    return {
        top: { left: center.left, top: alignAbove },
        bottom: { left: center.left, top: alignBelow },
        left: { top: center.top, left: alignLeft },
        right: { top: center.top, left: alignRight },
        'bottom-left': { left: target.left, top: alignBelow },
        'top-left': { left: target.left, top: alignAbove },
        'bottom-right': { left: target.left - tooltip.width + target.width, top: alignBelow },
        'top-right': { left: target.left - tooltip.width + target.width, top: alignAbove }
    }[placement];
};

const isOutOfScreen = (tooltip, position) => {
    return (
        position.top + tooltip.height > window.innerHeight ||
        position.left + tooltip.width > window.innerWidth ||
        position.top < 0 ||
        position.left < 0
    );
};

const optimisePositionAndPlacement = (target, tooltip, offset, availablePlacements = ALL_PLACEMENTS) => {
    if (!availablePlacements.length) {
        return null;
    }
    const [placement, ...rest] = availablePlacements;
    const position = calculatePosition(target, tooltip, placement, offset);

    return isOutOfScreen(tooltip, position)
        ? optimisePositionAndPlacement(target, tooltip, offset, rest)
        : { position, placement };
};

export const adjustPosition = (target, tooltip, placement, offset, availablePlacements = ALL_PLACEMENTS) => {
    const placementsByPriority = orderPlacements(placement, availablePlacements);
    const optimalLocation = optimisePositionAndPlacement(target, tooltip, offset, placementsByPriority);
    if (!optimalLocation) {
        // No good position on screen, fallback to original
        const position = calculatePosition(target, tooltip, placement, offset);
        return {
            position,
            placement
        };
    }
    return optimalLocation;
};

export const computedSize = (stylePixels, boundsSize) => {
    const computedStyleSize = Number(stylePixels.replace('px', ''));
    return isNaN(computedStyleSize) ? boundsSize : computedStyleSize;
};
