import type { Key } from 'react';
import { useCallback, useMemo, useState } from 'react';

import useControlled from '@proton/hooks/useControlled';

import { generateUID } from '../../helpers';

export interface ModalStateProps {
    open: boolean;
    onClose: () => void;
    onExit: () => void;
}

type ModalStateOptions = Partial<Pick<ModalStateProps, 'open' | 'onClose' | 'onExit'>>;
type ModalStateReturnTuple = [
    modalProps: ModalStateProps & { key: Key },
    openModal: (newValue: boolean) => void,
    renderModal: boolean,
];
export interface ModalStateReturnObj {
    modalProps: ModalStateReturnTuple[0];
    openModal: ModalStateReturnTuple[1];
    render: ModalStateReturnTuple[2];
}

const useModalState = (options?: ModalStateOptions): ModalStateReturnTuple => {
    const { open: controlledOpen, onClose, onExit } = options || {};

    const [key, setKey] = useState(() => generateUID());
    const [open, setOpen] = useControlled(controlledOpen);
    const [render, setRender] = useState(!!open);

    const handleSetOpen = useCallback((newValue: boolean) => {
        if (newValue) {
            setOpen(true);
            setRender(true);
        } else {
            setOpen(false);
        }
    }, []);

    const handleClose = useCallback(() => {
        handleSetOpen(false);
        onClose?.();
    }, [handleSetOpen, onClose]);

    const handleExit = useCallback(() => {
        setRender(false);
        setKey(generateUID());
        onExit?.();
    }, [onExit]);

    const modalProps: ModalStateProps & { key: Key } = useMemo(
        () => ({
            key,
            open: !!open,
            onClose: handleClose,
            onExit: handleExit,
        }),
        [key, open, handleClose, handleExit]
    );

    return [modalProps, handleSetOpen, render] as const;
};

export type ModalPropsWithData<T> = ModalStateProps & { data?: T };

type ModalStateWithDataReturnTuple<T> = [
    modalProps: ModalPropsWithData<T>,
    openModal: (data: T) => void,
    renderModal: boolean,
];

export const useModalStateWithData = <T>(options?: ModalStateOptions): ModalStateWithDataReturnTuple<T> => {
    const [modalData, setModalData] = useState<T>();

    const [modalCoreProps, handleSetOpen, render] = useModalState({
        ...options,
        onExit: () => {
            options?.onExit?.();
            setModalData(undefined);
        },
    });

    const openModal = useCallback(
        (data: T) => {
            setModalData(data);
            handleSetOpen(true);
        },
        [handleSetOpen]
    );

    const modalProps = useMemo(() => ({ ...modalCoreProps, data: modalData }), [modalData, modalCoreProps]);

    return [modalProps, openModal, render] as const;
};

export const useModalStateObject = (options?: ModalStateOptions): ModalStateReturnObj => {
    const [modalProps, openModal, render] = useModalState(options);

    return {
        modalProps,
        openModal,
        render,
    };
};

export default useModalState;
