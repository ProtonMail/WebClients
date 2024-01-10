import { ComponentType, useCallback, useRef, useState } from 'react';

import noop from '@proton/utils/noop';

import useModalState, { ModalStateProps } from './useModalState';

type PartialModalStateProps = Partial<ModalStateProps>;

export const useModalTwoStatic = <
    OwnProps extends PartialModalStateProps,
    PassedProps = Omit<OwnProps, keyof PartialModalStateProps> & PartialModalStateProps,
>(
    Modal: ComponentType<OwnProps & PartialModalStateProps>
) => {
    const [modalStateProps, setOpen, render] = useModalState();
    const [ownProps, setOwnProps] = useState<PassedProps | undefined>(undefined);

    const handleShowModal = useCallback((ownProps: PassedProps) => {
        setOwnProps(ownProps);
        setOpen(true);
    }, []);

    const props = {
        ...modalStateProps,
        ...ownProps,
    } as unknown as OwnProps;

    return [render ? <Modal {...props} /> : null, handleShowModal] as const;
};

export interface ModalTwoPromiseHandlers<Value> {
    onResolve: (() => void) | ((value: Value) => void);
    onReject: (reason?: any) => void;
}

type RequiredModalTwoProps<Value> = ModalTwoPromiseHandlers<Value> & PartialModalStateProps;

export const useModalTwo = <
    OwnProps extends RequiredModalTwoProps<Value>,
    Value = void,
    PassedProps = Omit<OwnProps, keyof PartialModalStateProps | 'onResolve' | 'onReject'> & PartialModalStateProps,
>(
    Modal: ComponentType<OwnProps & RequiredModalTwoProps<Value>>
) => {
    const [modalStateProps, setOpen, render] = useModalState();
    const [ownProps, setOwnProps] = useState<PassedProps | undefined>(undefined);
    const promiseRef = useRef<{
        promise: Promise<Value>;
        resolve: (value?: Value) => void;
        reject: (reason?: any) => void;
    }>();

    const handleShowModal = useCallback((ownProps: PassedProps) => {
        promiseRef.current?.reject();

        let resolve: (value?: Value) => void = noop;
        let reject: (reason?: any) => void = noop;
        const promise = new Promise<Value>((res, rej) => {
            resolve = res as any;
            reject = rej;
        });
        promiseRef.current = { promise, resolve, reject };

        setOwnProps(ownProps);
        setOpen(true);

        return promise;
    }, []);

    const handleResolve: OwnProps['onResolve'] = (value) => {
        promiseRef.current?.resolve(value);
        promiseRef.current = undefined;
        modalStateProps.onClose();
    };

    const handleReject: OwnProps['onReject'] = (reason) => {
        promiseRef.current?.reject(reason);
        promiseRef.current = undefined;
        modalStateProps.onClose();
    };

    const promiseHandlers: Pick<OwnProps, 'onResolve' | 'onReject'> = {
        onResolve: handleResolve,
        onReject: handleReject,
    };

    const props = {
        ...modalStateProps,
        ...ownProps,
        ...promiseHandlers,
    } as unknown as OwnProps;

    return [render ? <Modal {...props} /> : null, handleShowModal] as const;
};
