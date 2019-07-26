const TOOLTIP_OFFSET = 10;

const calculatePosition = (target, tooltip, placement) => {
    const center = {
        top: target.top + target.height / 2 - tooltip.height / 2,
        left: target.left + target.width / 2 - tooltip.width / 2,
        placement
    };

    const alignAbove = target.top - tooltip.height - TOOLTIP_OFFSET;
    const alignBelow = target.top + target.height + TOOLTIP_OFFSET;
    const alignLeft = target.left - tooltip.width - TOOLTIP_OFFSET;
    const alignRight = target.left + target.width + TOOLTIP_OFFSET;

    return {
        top: { ...center, top: alignAbove },
        bottom: { ...center, top: alignBelow },
        left: { ...center, left: alignLeft },
        right: { ...center, left: alignRight }
    }[placement];
};

export const calculateAdjustedPosition = (target, tooltip, placement) => {
    const reorientTo = (orientation) => calculatePosition(target, tooltip, orientation);

    const originalPosition = calculatePosition(target, tooltip, placement);

    if (originalPosition.top + tooltip.height > window.innerHeight) {
        return reorientTo('top');
    } else if (originalPosition.top < 0) {
        return reorientTo('bottom');
    } else if (originalPosition.left + tooltip.width > window.innerWidth) {
        return reorientTo('left');
    } else if (originalPosition.left < 0) {
        return reorientTo('right');
    }

    return originalPosition;
};
