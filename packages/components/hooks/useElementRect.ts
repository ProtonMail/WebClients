import { RefObject, useLayoutEffect, useState } from 'react';
import { debounce } from '@proton/shared/lib/helpers/function';
import useInstance from './useInstance';

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

const getElementRect = (target?: HTMLElement | null) => {
    if (!target) {
        return;
    }
    return target.getBoundingClientRect();
};

type RateLimiter = <A extends any[]>(func: (...args: A) => void, wait: number) => (...args: A) => void;

const equivalentReducer = (oldRect?: DOMRect, newRect?: DOMRect) => {
    return isEquivalent(oldRect, newRect) ? oldRect : newRect;
}
const defaultReducer = (oldRect: DOMRect | undefined, newRect: DOMRect | undefined, sizeCache: (DOMRect | undefined)[]) => {
    const [prevOld, prevNew] = sizeCache;
    // If it's flipping back and forth, settle on the previous value to prevent jiggling effects
    if (isEquivalent(prevOld, newRect) && isEquivalent(prevNew, oldRect)) {
        return oldRect;
    }
    sizeCache[0] = oldRect;
    sizeCache[1] = newRect;
    return equivalentReducer(oldRect, newRect);
}
type Reducer = typeof defaultReducer;

const useElementRect = <E extends HTMLElement>(ref: RefObject<E>, rateLimiter: RateLimiter = debounce, reducer: Reducer = defaultReducer) => {
    const sizeCache = useInstance((): (DOMRect | undefined)[] => [])
    const [elementRect, setElementRect] = useState(() => getElementRect(ref.current));

    useLayoutEffect(() => {
        const target = ref.current;
        if (!target) {
            return;
        }

        if (typeof ResizeObserver === 'function') {
            const resizeObserver = new ResizeObserver(
                // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
                rateLimiter(([{ contentRect }]) => {
                    // The contentRect does not give correct global positions?
                    // setElementRect((old) => reducer(old, contentRect));
                    setElementRect((old) => reducer(old, getElementRect(target), sizeCache));
                }, 100)
            );
            resizeObserver.observe(target, { box: 'border-box' });
            setElementRect((old) => reducer(old, getElementRect(target), sizeCache));
            return () => {
                resizeObserver.disconnect();
            };
        }

        const onResize = rateLimiter(() => {
            setElementRect((old) => reducer(old, getElementRect(target), sizeCache));
        }, 100);
        window.addEventListener('resize', onResize);
        setElementRect((old) => reducer(old, getElementRect(target), sizeCache));
        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, [ref.current]);

    return elementRect;
};

export default useElementRect;
