import type { ComponentType, ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import noop from '@proton/utils/noop';

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

export interface ModalTwoPromiseHandlers<ReturnValue> {
    onResolve: (value: ReturnValue) => void;
    onReject: (reason?: any) => void;
}

type Return<PassedProps, ReturnValue> = [
    (cb: (props: PassedProps & ModalTwoPromiseHandlers<ReturnValue> & ModalStateProps) => ReactNode) => ReactNode,
    (props: PassedProps) => Promise<ReturnValue>,
];

type PromiseRef<ReturnValue> = ModalTwoPromiseHandlers<ReturnValue> & {
    promise: Promise<ReturnValue>;
};

const getPromiseRef = <ReturnValue,>(): PromiseRef<ReturnValue> => {
    let onResolve: (value: ReturnValue) => void = noop;
    let onReject: (reason?: any) => void = noop;
    const promise = new Promise<ReturnValue>((_resolve, _reject) => {
        onResolve = _resolve;
        onReject = _reject;
    });
    return {
        promise,
        onResolve,
        onReject,
    };
};

export function useModalTwoPromise<PassedProps, ReturnValue = void>(
    initialState: PassedProps | (() => PassedProps)
): Return<PassedProps, ReturnValue>;

export function useModalTwoPromise<PassedProps = undefined, ReturnValue = void>(
    initialState?: PassedProps | undefined
): [
    (
        cb: (
            props: PassedProps extends undefined
                ? ModalTwoPromiseHandlers<ReturnValue> & ModalStateProps
                : PassedProps & ModalTwoPromiseHandlers<ReturnValue> & ModalStateProps
        ) => ReactNode
    ) => ReactNode,
    PassedProps extends undefined ? () => Promise<ReturnValue> : (props: PassedProps) => Promise<ReturnValue>,
];

export function useModalTwoPromise<PassedProps, ReturnValue = void>(
    initialState: PassedProps | (() => PassedProps)
): Return<PassedProps, ReturnValue> {
    const [modalStateProps, setOpen, render] = useModalState();
    const [passedProps, setPassedProps] = useState(initialState);
    type PromiseRefValue = PromiseRef<ReturnValue>;
    const promiseRef = useRef<PromiseRefValue>();

    const handleShowModal = useCallback((passedProps: PassedProps) => {
        promiseRef.current?.onReject();
        promiseRef.current = getPromiseRef<ReturnValue>();

        setPassedProps(passedProps);
        setOpen(true);

        return promiseRef.current.promise;
    }, []);

    const handleResolve: PromiseRefValue['onResolve'] = useCallback(
        (value) => {
            promiseRef.current?.onResolve(value);
            promiseRef.current = undefined;
            modalStateProps.onClose();
        },
        [modalStateProps.onClose]
    );

    const handleReject: PromiseRefValue['onReject'] = useCallback(
        (reason) => {
            promiseRef.current?.onReject(reason);
            promiseRef.current = undefined;
            modalStateProps.onClose();
        },
        [modalStateProps.onClose]
    );

    const renderProps = {
        ...modalStateProps,
        ...passedProps,
        onResolve: handleResolve,
        onReject: handleReject,
    };

    return [
        (cb) => {
            if (!render) {
                return null;
            }
            return cb(renderProps);
        },
        handleShowModal,
    ] as const;
}

type RequiredModalTwoProps<Value> = ModalTwoPromiseHandlers<Value> & PartialModalStateProps;

export const useModalTwo = <
    OwnProps extends RequiredModalTwoProps<ReturnValue>,
    ReturnValue = void,
    PassedProps = Omit<OwnProps, keyof PartialModalStateProps | 'onResolve' | 'onReject'> & PartialModalStateProps,
>(
    Modal: ComponentType<OwnProps & RequiredModalTwoProps<ReturnValue>>
) => {
    const [renderCallback, handleShowModal] = useModalTwoPromise<PassedProps, ReturnValue>();
    return [
        renderCallback((props: any) => {
            return <Modal {...props} />;
        }),
        handleShowModal,
    ] as const;
};
