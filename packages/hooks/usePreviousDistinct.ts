import { useRef } from 'react';

export type Predicate<T> = (prev: T | undefined, next: T) => boolean;

const strictEquals = <T>(prev: T | undefined, next: T) => prev === next;

export default function usePreviousDistinct<T>(value: T, compare: Predicate<T> = strictEquals): T | undefined {
    const prevRef = useRef<T>();
    const curRef = useRef<T>(value);
    const isFirstMount = useRef(true);

    if (isFirstMount.current) {
        isFirstMount.current = false;
    } else if (!compare(curRef.current, value)) {
        prevRef.current = curRef.current;
        curRef.current = value;
    }

    return prevRef.current;
}
