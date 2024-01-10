import { Key, useCallback, useMemo, useState } from 'react';

import useControlled from '@proton/hooks/useControlled';

import { generateUID } from '../../helpers';

export interface ModalStateProps {
    open: boolean;
    onClose: () => void;
    onExit: () => void;
}

type ModalStateOptions = Partial<Pick<ModalStateProps, 'open' | 'onClose' | 'onExit'>>;
type ModalStateReturnTuple = [
    modalProps: ModalStateProps,
    openModal: (newValue: boolean) => void,
    renderModal: boolean,
];
interface ModalStateReturnObj {
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

export const useModalStateObject = (options?: ModalStateOptions): ModalStateReturnObj => {
    const [modalProps, openModal, render] = useModalState(options);

    return {
        modalProps,
        openModal,
        render,
    };
};

export default useModalState;
