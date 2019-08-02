import { classnames } from '../../helpers/component';

const DEFAULT_TOOLTIP_OFFSET = 10;

const calculatePosition = (target, tooltip, placement, offset = DEFAULT_TOOLTIP_OFFSET) => {
    const center = {
        top: target.top + target.height / 2 - tooltip.height / 2,
        left: target.left + target.width / 2 - tooltip.width / 2
    };

    const alignAbove = target.top - tooltip.height - offset;
    const alignBelow = target.top + target.height + offset;
    const alignLeft = target.left - tooltip.width - offset;
    const alignRight = target.left + target.width + offset;

    const position = {
        top: { left: center.left, top: alignAbove },
        bottom: { left: center.left, top: alignBelow },
        left: { top: center.top, left: alignLeft },
        right: { top: center.top, left: alignRight },
        'bottom-left': { left: target.left, top: alignBelow },
        'top-left': { left: target.left, top: alignAbove },
        'bottom-right': { left: target.left - tooltip.width + target.width, top: alignBelow },
        'top-right': { left: target.left - tooltip.width + target.width, top: alignBelow }
    }[placement];

    return { position, placement };
};

export const calculateAdjustedPosition = (target, tooltip, placement, offset) => {
    const alignment = placement.split('-')[1];
    const reorientTo = (orientation) =>
        calculatePosition(target, tooltip, classnames([orientation, alignment]), offset);
    const originalPosition = calculatePosition(target, tooltip, placement, offset);

    if (originalPosition.top + tooltip.height > window.innerHeight) {
        return reorientTo('top');
    }
    if (originalPosition.left + tooltip.width > window.innerWidth) {
        return reorientTo('left');
    }
    if (originalPosition.top < 0) {
        return reorientTo('bottom');
    }
    if (originalPosition.left < 0) {
        return reorientTo('right');
    }

    return originalPosition;
};

export const computedSize = (stylePixels, boundsSize) => {
    const computedStyleSize = Number(stylePixels.replace('px', ''));
    return isNaN(computedStyleSize) ? boundsSize : computedStyleSize;
};
