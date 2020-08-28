import { useRef, useEffect } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';

export const usePromiseFromState = (state: boolean) => {
    const newPromise = () => {
        let resolver: () => void = noop;
        const promise = new Promise<void>((resolve) => {
            resolver = resolve;
            if (state) {
                resolve();
            }
        });
        return { promise, resolver };
    };

    const privateRef = useRef<{ promise: Promise<void>; resolver: () => void }>(newPromise());
    const publicRef = useRef<Promise<void>>(privateRef.current.promise);

    useEffect(() => {
        if (state) {
            privateRef.current.resolver();
        } else {
            privateRef.current = newPromise();
            publicRef.current = privateRef.current.promise;
        }
    }, [state]);

    return publicRef;
};
