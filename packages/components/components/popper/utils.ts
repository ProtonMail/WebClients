import { RefObject } from 'react';

import { Middleware, MiddlewareArguments, MiddlewareReturn, size } from '@floating-ui/react-dom';

import { ArrowOffset, PopperPlacement, PopperPosition } from './interface';

export const allPopperPlacements: PopperPlacement[] = [
    'top-start',
    'top',
    'top-end',
    'right-start',
    'right',
    'right-end',
    'bottom-end',
    'bottom',
    'bottom-start',
    'left-end',
    'left',
    'left-start',
];

export const getInvertedRTLPlacement = (placement: PopperPlacement, rtl: boolean): PopperPlacement => {
    if (!rtl) {
        return placement;
    }
    if (placement.startsWith('top') || placement.startsWith('bottom')) {
        return placement.endsWith('-start')
            ? (placement.replace('-start', '-end') as PopperPlacement)
            : (placement.replace('-end', '-start') as PopperPlacement);
    }
    return placement;
};

const getInvertedPlacement = (placement: PopperPlacement): PopperPlacement => {
    const position = placement.split('-')[0];
    if (position === 'top') {
        return 'bottom';
    }
    if (position === 'bottom') {
        return 'top';
    }
    if (position === 'left') {
        return 'right';
    }
    if (position === 'right') {
        return 'left';
    }
    return 'top';
};

export const cornerPopperPlacements: PopperPlacement[] = [
    'top-start',
    'top-end',
    'right-start',
    'right-end',
    'bottom-end',
    'bottom-start',
    'left-end',
    'left-start',
];

const getPlacements = (value: PopperPlacement) => {
    return value.split('-') as [PopperPlacement, PopperPlacement | undefined];
};
/**
 * Tries to maintain placement as close to the original as possible. In order of
 * 1. Same position
 * 2. Inverted position
 * 3. Remaining
 */
export const getFallbackPlacements = (
    originalPlacement: PopperPlacement,
    placements = allPopperPlacements
): PopperPlacement[] => {
    const groupedPlacements = placements.reduce<Partial<{ [key in PopperPlacement]: PopperPlacement[] }>>(
        (acc, cur) => {
            const [position] = getPlacements(cur);
            let prev = acc[position];
            if (!prev) {
                prev = acc[position] = [];
            }
            prev.push(cur);
            return acc;
        },
        {}
    );
    const [originalPosition, originalAlignment] = getPlacements(originalPlacement);
    const invertedPosition = getInvertedPlacement(originalPosition);
    const groupedOriginalPlacements = groupedPlacements[originalPosition];
    const groupedInvertedPlacements = groupedPlacements[invertedPosition];
    if (!groupedOriginalPlacements || !groupedInvertedPlacements) {
        return placements;
    }
    return [
        ...groupedOriginalPlacements.filter((placement) => placement !== originalPlacement),
        ...groupedInvertedPlacements.sort((a, b) => {
            const [, alignmentA] = a.split('-');
            const [, alignmentB] = b.split('-');
            if (alignmentA === alignmentB) {
                return 0;
            }
            if (alignmentA === originalAlignment) {
                return -1;
            }
            if (alignmentB === originalAlignment) {
                return 1;
            }
            return 0;
        }),
        ...Object.keys(groupedPlacements).flatMap((placement) => {
            if (placement === originalPosition || placement === invertedPosition) {
                return [];
            }
            const placements = groupedPlacements[placement as keyof typeof groupedPlacements];
            if (!placements) {
                return [];
            }
            return placements;
        }),
    ];
};

export const shouldShowSideRadius = (
    arrowOffset: ArrowOffset,
    placement: PopperPlacement | 'hidden',
    radiusSize = 8,
    arrowSize = 10
) => {
    if (placement === 'hidden') {
        return false;
    }
    const offset = arrowOffset === 0 ? arrowOffset : Number(arrowOffset.replace('px', ''));
    return !cornerPopperPlacements.includes(placement) || offset > radiusSize + arrowSize;
};

export const getClickRect = (position: PopperPosition) => {
    return {
        x: position.left,
        y: position.top,
        top: position.top,
        bottom: position.top,
        left: position.left,
        right: position.left,
        width: 0,
        height: 0,
    };
};

export const arrowOffset = (): Middleware => {
    return {
        name: 'arrowOffset',
        fn({ rects, placement }: MiddlewareArguments): MiddlewareReturn {
            const minHeight = Math.min(rects.reference.height, rects.floating.height);
            const minWidth = Math.min(rects.reference.width, rects.floating.width);
            const horizontalOffset = (minWidth || 0) / 2;
            const verticalOffset = (minHeight || 0) / 2;
            const placementList: { [key in PopperPlacement]: number } = {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                'bottom-start': horizontalOffset,
                'top-start': horizontalOffset,
                'bottom-end': horizontalOffset,
                'top-end': horizontalOffset,
                'right-end': verticalOffset,
                'right-start': verticalOffset,
                'left-end': verticalOffset,
                'left-start': verticalOffset,
            } as const;

            return {
                data: { value: placementList[placement] || 0 },
            };
        },
    };
};

export const anchorOffset = (ref: RefObject<HTMLElement> | undefined): Middleware => {
    return {
        name: 'anchorOffset',
        fn({ x, y }: MiddlewareArguments): MiddlewareReturn {
            if (!ref?.current) {
                return {};
            }
            const position = ref.current.getBoundingClientRect();
            return {
                x: x + position.x,
                y: y + position.y,
            };
        },
    };
};

export const availableSize = (): Middleware => {
    let availableSize = { width: 0, height: 0 };

    const sizeMiddleWare = size({
        apply(args: MiddlewareArguments & { availableWidth: number; availableHeight: number }) {
            availableSize.width = args.availableWidth;
            availableSize.height = args.availableHeight;
        },
    });

    return {
        name: 'availableSize',
        async fn(middlewareArguments: MiddlewareArguments): Promise<MiddlewareReturn> {
            // Hack to get the result of the size middleware to be returned.
            await sizeMiddleWare.fn(middlewareArguments);
            return { data: availableSize };
        },
    };
};

export const rects = (): Middleware => {
    return {
        name: 'rects',
        async fn(middlewareArguments: MiddlewareArguments): Promise<MiddlewareReturn> {
            return { data: middlewareArguments.rects };
        },
    };
};

export const rtlPlacement = (): Middleware => {
    return {
        name: 'rtlPlacement',
        async fn({ placement, elements, platform }: MiddlewareArguments): Promise<MiddlewareReturn> {
            // Floating ui transparently handles RTL internally in the x,y values. But we expect the classnames to
            // reflect where it's placed so this is just flipping it in the same way that floating ui happens.
            const rtl = Boolean(await platform.isRTL?.(elements.floating));
            return { data: { placement: getInvertedRTLPlacement(placement, rtl) } };
        },
    };
};
