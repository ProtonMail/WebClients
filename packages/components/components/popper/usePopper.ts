import { RefObject, useLayoutEffect, useMemo } from 'react';

import { UseFloatingReturn, autoUpdate, flip, hide, offset, shift, useFloating } from '@floating-ui/react-dom';

import { PopperArrow, PopperPlacement, PopperPosition } from './interface';
import {
    allPopperPlacements,
    anchorOffset,
    arrowOffset,
    getClickRect,
    getFallbackPlacements,
    rtlPlacement,
} from './utils';

const hiddenPosition: PopperPosition = {
    top: -9999,
    left: -9999,
};

interface PopperReturnValue {
    floating: UseFloatingReturn['floating'] | null;
    reference: UseFloatingReturn['reference'] | null;
    position: PopperPosition;
    arrow: PopperArrow;
    placement: PopperPlacement | 'hidden';
}

interface Props {
    isOpen?: boolean;
    originalPlacement?: PopperPlacement;
    availablePlacements?: PopperPlacement[];
    reference?:
        | {
              mode: 'element';
              value: HTMLElement | null | undefined;
          }
        | {
              mode: 'position';
              value: PopperPosition | null;
              anchor?: HTMLElement | null;
          };
    relativeReference?: RefObject<HTMLElement>;
    offset?: number;
    updateAnimationFrame?: boolean;
}

const usePopper = ({
    isOpen = false,
    originalPlacement = 'top',
    availablePlacements = allPopperPlacements,
    offset: offsetPx = 10,
    relativeReference,
    reference: anchorReference,
    updateAnimationFrame = false,
}: Props): PopperReturnValue => {
    const fallbackPlacements = useMemo(() => {
        return getFallbackPlacements(originalPlacement, availablePlacements);
    }, []);
    const { reference, floating, x, y, middlewareData, placement } = useFloating({
        strategy: 'fixed',
        placement: originalPlacement,
        middleware: [
            anchorOffset(relativeReference),
            offset(offsetPx),
            flip({ fallbackPlacements }),
            shift(),
            hide(),
            arrowOffset(),
            rtlPlacement(),
        ],
        whileElementsMounted: (reference, floating, update) => {
            const unsubscribe = autoUpdate(reference, floating, update, {
                animationFrame: updateAnimationFrame,
            });
            let relativeUnsubscribe: (() => void) | undefined;
            if (relativeReference?.current) {
                relativeUnsubscribe = autoUpdate(relativeReference.current, floating, update, {
                    animationFrame: updateAnimationFrame,
                });
            }
            return () => {
                unsubscribe();
                relativeUnsubscribe?.();
            };
        },
    });

    useLayoutEffect(() => {
        if (!isOpen) {
            reference(null);
            floating(null);
        }
    }, [isOpen]);

    useLayoutEffect(() => {
        if (!anchorReference) {
            return;
        }
        if (!isOpen) {
            reference(null);
            return;
        }
        if (anchorReference.mode === 'element') {
            reference(anchorReference.value || null);
            return;
        }
        if (anchorReference.mode === 'position') {
            if (!anchorReference.value) {
                reference(null);
                return;
            }
            const clickRect = getClickRect(anchorReference.value);
            reference({
                getBoundingClientRect: () => {
                    return clickRect;
                },
            });
            return;
        }
    }, [reference, anchorReference?.value, anchorReference?.mode, isOpen]);

    // x and y are null initially, before the layout effect has fired
    const hidden = Boolean(middlewareData.hide?.referenceHidden) || x === null || y === null;
    const arrowOffsetValue: string | number = middlewareData.arrowOffset?.value;
    const adjustedPlacement: PopperPlacement = middlewareData.rtlPlacement?.placement || placement;

    return {
        reference: isOpen ? reference : null,
        floating: isOpen ? floating : null,
        position: hidden
            ? hiddenPosition
            : {
                  top: y || 0,
                  left: x || 0,
              },
        arrow: {
            '--arrow-offset': !arrowOffsetValue ? 0 : `${arrowOffsetValue}px`,
        },
        placement: hidden ? 'hidden' : adjustedPlacement,
    };
};

export default usePopper;
