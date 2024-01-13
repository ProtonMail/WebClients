import { useCallback, useMemo, useState } from 'react';

import useControlled from '@proton/hooks/useControlled';

import { generateUID } from '../../helpers';

export interface ModalStateProps {
    key: string;
    open: boolean;
    onClose: () => void;
    onExit: () => void;
}

interface ModalPropsReturnedValues {
    key: string;
    open: boolean;
    onClose: () => void;
    onExit: () => void;
}

const useModalState = (options?: {
    open?: boolean;
    onClose?: () => void;
    onExit?: () => void;
}): [modalProps: ModalPropsReturnedValues, openModal: (newValue: boolean) => void, renderModal: boolean] => {
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

    const modalProps: ModalStateProps = useMemo(
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

export default useModalState;
