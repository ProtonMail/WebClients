import { ComponentType, useRef, useState } from 'react';

import noop from '@proton/utils/noop';

import useModalState from './useModalState';

export interface ModalTwoPromiseHandlers<Value> {
    onResolve: (value: Value) => void;
    onReject: (reason?: any) => void;
}

export const useModalTwo = function <OwnProps, Value>(
    Modal: ComponentType<any>,
    usePromise = true
): [JSX.Element | null, (ownProps: OwnProps) => Promise<Value>] {
    const [props, setOpen, render] = useModalState();
    const [ownProps, setOwnProps] = useState<OwnProps>();
    const promiseRef = useRef<{
        promise: Promise<Value>;
        resolve: (value: Value) => void;
        reject: (reason?: any) => void;
    }>();

    const createPromise = () => {
        let resolve: (value: Value) => void = noop;
        let reject: (reason?: any) => void = noop;
        const promise = new Promise<Value>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        promiseRef.current = { promise, resolve, reject };
        return promise;
    };

    const handleShowModal = (ownProps: OwnProps) => {
        setOwnProps(ownProps);
        setOpen(true);
        return createPromise();
    };

    const handleResolve = (value: Value) => {
        promiseRef.current?.resolve(value);
        props.onClose();
    };

    const handleReject = (reason?: any) => {
        promiseRef.current?.reject(reason);
        props.onClose();
    };

    const promiseHandlers: Partial<ModalTwoPromiseHandlers<Value>> = usePromise
        ? { onResolve: handleResolve, onReject: handleReject }
        : {};

    const modal = render ? <Modal {...props} {...ownProps} {...promiseHandlers} /> : null;

    return [modal, handleShowModal];
};
