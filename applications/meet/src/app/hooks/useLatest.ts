import { useRef } from 'react';

export function useLatest<T>(value: T) {
    const ref = useRef(value);
    ref.current = value;

    return ref;
}
