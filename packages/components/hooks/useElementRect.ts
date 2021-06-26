import { RefObject, useLayoutEffect, useState } from 'react';
import { debounce } from 'proton-shared/lib/helpers/function';

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

const useElementRect = <E extends HTMLElement>(ref: RefObject<E>, rateLimiter: RateLimiter = debounce) => {
    const [elementRect, setElementRect] = useState(() => getElementRect(ref.current));

    useLayoutEffect(() => {
        const target = ref.current;
        if (!target) {
            return;
        }
        const reducer = (old?: DOMRect, newRect?: DOMRect) => (isEquivalent(old, newRect) ? old : newRect);

        if (typeof ResizeObserver === 'function') {
            const resizeObserver = new ResizeObserver(
                // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
                rateLimiter(([{ contentRect }]) => {
                    // The contentRect does not give correct global positions?
                    // setElementRect((old) => reducer(old, contentRect));
                    setElementRect((old) => reducer(old, getElementRect(target)));
                }, 100)
            );
            resizeObserver.observe(target, { box: 'border-box' });
            setElementRect((old) => reducer(old, getElementRect(target)));
            return () => {
                resizeObserver.disconnect();
            };
        }

        const onResize = rateLimiter(() => {
            setElementRect((old) => reducer(old, getElementRect(target)));
        }, 100);
        window.addEventListener('resize', onResize);
        setElementRect((old) => reducer(old, getElementRect(target)));
        return () => {
            window.removeEventListener('resize', onResize);
        };
    }, [ref.current]);

    return elementRect;
};

export default useElementRect;
