import { useRef, useState } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { useIsMounted } from 'react-components';

export type PromiseHandlers<P> = {
    promise: Promise<P>;
    resolver: (payload: P) => void;
    rejecter: (error: any) => void;
    renew: () => void;
    isPending: boolean;
};

const initializingValue = {
    promise: Promise.resolve(),
    resolver: noop,
    rejecter: noop,
    renew: noop,
    isPending: false,
} as PromiseHandlers<any>;

/**
 * Instrument a promise to allow a component to start, resolve or reject it as will.
 * Support to be used even after component unmounting.
 * Internally use a ref for storing data but use a fake state to trigger updates.
 */
export const usePromise = <P>() => {
    const isMounted = useIsMounted();
    const [, setFakeState] = useState({});
    const promiseRef = useRef<PromiseHandlers<P>>(initializingValue);

    const renew = () => {
        let resolver: (payload: P) => void = noop;
        let rejecter: (error: any) => void = noop;
        const promise = new Promise<P>((resolve, reject) => {
            resolver = (payload) => {
                if (isMounted()) {
                    promiseRef.current.isPending = false;
                    setFakeState({});
                }
                resolve(payload);
            };
            rejecter = (error) => {
                if (isMounted()) {
                    promiseRef.current.isPending = false;
                    setFakeState({});
                }
                reject(error);
            };
        });
        promiseRef.current = { promise, resolver, rejecter, renew, isPending: true };
        if (isMounted()) {
            setFakeState({});
        }
    };

    if (promiseRef.current === initializingValue) {
        promiseRef.current = { ...initializingValue, renew };
    }

    return promiseRef.current as PromiseHandlers<P>;
};
