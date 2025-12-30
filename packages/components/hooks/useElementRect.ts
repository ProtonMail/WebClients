import type { RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

import throttle from 'lodash/throttle';

import noop from '@proton/utils/noop';

// Can't loop over DOMRect keys with getOwnPropertyNames.
const keys = ['bottom', 'height', 'left', 'right', 'top', 'width', 'x', 'y'];
const isEquivalent = (aRect?: DOMRect, bRect?: DOMRect) => {
    if (!aRect && bRect) {
        return false;
    }
    if (aRect && !bRect) {
        return false;
    }
    for (const key of keys) {
        if (aRect?.[key as keyof DOMRect] !== bRect?.[key as keyof DOMRect]) {
            return false;
        }
    }
    return true;
};

function getElementRect(target: HTMLElement): DOMRect;
function getElementRect(target?: HTMLElement | null) {
    if (!target) {
        return;
    }
    return target.getBoundingClientRect();
}

type RateLimiter = <A extends any[]>(func: (...args: A) => void) => ((...args: A) => void) & { cancel: () => void };

/**
 * It might be helpful if you have `ResizeObserver loop limit exceeded` error.
 * The error can also manifest itself as `ResizeObserver loop completed with undelivered notifications.`
 *
 * Simply toss it as the second argument:
 *
 * ```typescript
 *
 * const elementRect = useElementRect(ref, requestAnimationFrameRateLimiter);
 *
 * ```
 */
export const requestAnimationFrameRateLimiter: RateLimiter = <A extends any[]>(func: (...args: A) => void) => {
    const cb = (...args: A) => requestAnimationFrame(() => func(...args));
    cb.cancel = noop;
    return cb;
};

export const equivalentReducer = (oldRect?: DOMRect, newRect?: DOMRect) => {
    return isEquivalent(oldRect, newRect) ? oldRect : newRect;
};

export const createObserver = (
    target: HTMLElement,
    onResize: (rect: DOMRect) => void,
    maybeRateLimiter?: RateLimiter | null
) => {
    if (maybeRateLimiter === undefined) {
        maybeRateLimiter = (cb) => throttle(cb, 16, { leading: true, trailing: true });
    }

    let cache = {} as DOMRect;
    const handleResizeCallback = (rect: DOMRect) => {
        if (isEquivalent(cache, rect)) {
            return;
        }
        cache = rect;
        onResize(rect);
    };
    handleResizeCallback.cancel = noop;

    const handleResize = maybeRateLimiter ? maybeRateLimiter(handleResizeCallback) : handleResizeCallback;

    const handleResizeObserver = () => {
        handleResize(getElementRect(target));
    };
    const resizeObserver = new ResizeObserver(handleResizeObserver);
    resizeObserver.observe(target, { box: 'border-box' });
    handleResizeObserver();
    return () => {
        handleResize?.cancel?.();
        resizeObserver.disconnect();
    };
};

const useElementRect = <E extends HTMLElement>(ref: RefObject<E> | null, maybeRateLimiter?: RateLimiter | null) => {
    const [elementRect, setElementRect] = useState<DOMRect | null>(null);

    useLayoutEffect(() => {
        const target = ref?.current;
        if (!target) {
            return;
        }
        return createObserver(
            target,
            (rect: DOMRect) => {
                setElementRect(rect);
            },
            maybeRateLimiter
        );
    }, [ref, ref?.current]);

    return elementRect;
};

export default useElementRect;
