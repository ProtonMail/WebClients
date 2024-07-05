import { useEffect, useRef } from 'react';

export const useMirroredRef = <T>(state: T, init: T) => {
    const ref = useRef<T>(init);
    useEffect(() => {
        ref.current = state;
    }, [state]);

    return ref;
};
