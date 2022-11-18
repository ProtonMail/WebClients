import { RefObject, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
    Placement,
    Strategy,
    VirtualElement,
    autoUpdate,
    computePosition,
    flip,
    hide,
    offset,
    shift,
} from '@floating-ui/dom';

import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { PopperArrow, PopperPlacement, PopperPosition } from './interface';
import {
    allPopperPlacements,
    anchorOffset,
    arrowOffset,
    getClickRect,
    getFallbackPlacements,
    rtlPlacement,
} from './utils';

type ReferenceType = Element | VirtualElement;

const hiddenPosition: PopperPosition = {
    top: -9999,
    left: -9999,
};

interface Data {
    x: number | null;
    y: number | null;
    strategy: Strategy;
    placement: Placement;
    middlewareData: any;
}

interface PopperReturnValue {
    reference: ((el: ReferenceType | null) => void) | null;
    floating: ((el: HTMLElement | null) => void) | null;
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

const defaultState: Data = {
    x: null,
    y: null,
    strategy: 'fixed',
    placement: 'top',
    middlewareData: {},
};

const usePopper = ({
    isOpen = false,
    originalPlacement = 'top',
    availablePlacements = allPopperPlacements,
    offset: offsetPx = 10,
    relativeReference,
    reference: anchorReference,
    updateAnimationFrame = false,
}: Props): PopperReturnValue => {
    const [data, setData] = useState<Data>(defaultState);

    const reference = useRef<ReferenceType | null>(null);
    const floating = useRef<HTMLElement | null>(null);
    const cleanupRef = useRef<(() => void) | void | null>(null);
    const isMountedRef = useRef(false);

    const fallbackPlacements = useMemo(() => {
        return getFallbackPlacements(originalPlacement, availablePlacements);
    }, []);

    const update = useCallback(() => {
        const referenceEl = reference.current;
        const floatingEl = floating.current;
        if (!referenceEl || !floatingEl) {
            return;
        }

        // NOTE: This hook assumes that props never change during the lifetime of the component.
        computePosition(referenceEl, floatingEl, {
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
            strategy: 'fixed',
        }).then((data) => {
            if (!isMountedRef.current) {
                return;
            }
            setData((oldData) => {
                if (isDeepEqual(oldData, data)) {
                    return oldData;
                }
                return data;
            });
        });
    }, []);

    useLayoutEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const runElementMountCallback = useCallback(() => {
        cleanupRef.current?.();
        cleanupRef.current = null;

        const referenceEl = reference.current;
        const floatingEl = floating.current;

        if (!referenceEl || !floatingEl) {
            return;
        }

        const autoUpdater = () => {
            const unsubscribe = autoUpdate(referenceEl, floatingEl, update, {
                animationFrame: updateAnimationFrame,
            });
            let relativeUnsubscribe: (() => void) | undefined;
            if (relativeReference?.current) {
                relativeUnsubscribe = autoUpdate(relativeReference.current, floatingEl, update, {
                    animationFrame: updateAnimationFrame,
                });
            }
            return () => {
                unsubscribe();
                relativeUnsubscribe?.();
            };
        };

        cleanupRef.current = autoUpdater();
    }, []);

    const setReference = useCallback((node: ReferenceType | null) => {
        reference.current = node;
        runElementMountCallback();
    }, []);

    const setFloating = useCallback((node: HTMLElement | null) => {
        floating.current = node;
        runElementMountCallback();
    }, []);

    useLayoutEffect(() => {
        if (!isOpen) {
            setReference(null);
            setFloating(null);
            setData(defaultState);
        }
        if (!anchorReference) {
            return;
        }
        if (anchorReference.mode === 'element') {
            setReference(anchorReference.value || null);
            return;
        }
        if (anchorReference.mode === 'position') {
            if (!anchorReference.value) {
                setReference(null);
                return;
            }
            const clickRect = getClickRect(anchorReference.value);
            setReference({
                getBoundingClientRect: () => {
                    return clickRect;
                },
            });
            return;
        }
    }, [anchorReference?.value, anchorReference?.mode, isOpen]);

    // x and y are null initially, before the layout effect has fired
    const hidden = Boolean(data.middlewareData.hide?.referenceHidden) || data.x === null || data.y === null;
    const arrowOffsetValue: string | number = data.middlewareData.arrowOffset?.value;
    const adjustedPlacement: PopperPlacement = data.middlewareData.rtlPlacement?.placement || data.placement;

    return {
        reference: isOpen ? setReference : null,
        floating: isOpen ? setFloating : null,
        position: hidden
            ? hiddenPosition
            : {
                  top: data.y || 0,
                  left: data.x || 0,
              },
        arrow: {
            '--arrow-offset': !arrowOffsetValue ? 0 : `${arrowOffsetValue}px`,
        },
        placement: hidden ? 'hidden' : adjustedPlacement,
    };
};

export default usePopper;
