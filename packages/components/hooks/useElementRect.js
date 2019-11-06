import { useLayoutEffect, useState } from 'react';
import { debounce } from 'proton-shared/lib/helpers/function';

// Can't loop over DOMRect keys with getOwnPropertyNames.
const keys = ['bottom', 'height', 'left', 'right', 'top', 'width', 'x', 'y'];
const isEquivalent = (aRect, bRect) => {
    if (!aRect && bRect) {
        return false;
    }
    if (aRect && !bRect) {
        return false;
    }
    for (const key of keys) {
        if (aRect[key] !== bRect[key]) {
            return false;
        }
    }
    return true;
};

const getElementRect = (target) => {
    if (!target) {
        return;
    }
    return target.getBoundingClientRect();
};

const useElementRect = (ref) => {
    const [elementRect, setElementRect] = useState(() => getElementRect(ref.current));

    useLayoutEffect(() => {
        const target = ref.current;
        if (!target) {
            return;
        }
        const reducer = (old, newRect) => {
            if (isEquivalent(old, newRect)) {
                return old;
            }
            return newRect;
        };

        if (typeof ResizeObserver === 'function') {
            // eslint-disable-next-line no-unused-vars
            const onResize = debounce(([{ contentRect }]) => {
                // The contentRect does not give correct global positions?
                //setElementRect((old) => reducer(old, contentRect));
                setElementRect((old) => reducer(old, getElementRect(target)));
            }, 100);
            const resizeObserver = new ResizeObserver(onResize, { box: 'border-box' });
            resizeObserver.observe(target);
            setElementRect((old) => reducer(old, getElementRect(target)));
            return () => {
                resizeObserver.disconnect(target);
            };
        }

        const onResize = debounce(() => {
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
