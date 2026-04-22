import { type RefObject, useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

class BoundedMap<K, V> {
    private map;
    private maxSize: number;

    constructor(maxSize: number = 50) {
        this.maxSize = maxSize;
        this.map = new Map<K, V>();
    }

    get(key: K): V | undefined {
        return this.map.get(key);
    }

    set(key: K, value: V): void {
        this.map.set(key, value);
        if (this.map.size > this.maxSize) {
            // Map iterates in insertion order, so the first key is always the oldest
            this.map.delete(this.map.keys().next().value as K);
        }
    }
}

const scrollPositions = new BoundedMap<string, number>();

export const useScrollRestoration = (mainAreaRef: RefObject<HTMLDivElement>) => {
    const { pathname, key, hash } = useLocation();

    useLayoutEffect(() => {
        const el = mainAreaRef.current;
        if (
            !el ||
            !key ||
            /* Ignore fragments since there's a hook to auto-scroll to fragments when defined. */
            hash
        ) {
            return;
        }
        const savedPosition = scrollPositions.get(key);
        el.scrollTop = savedPosition ?? 0;
        return () => {
            // Runs while page is still mounted.
            scrollPositions.set(key, el.scrollTop);
        };
    }, [pathname, key, hash]);
};
