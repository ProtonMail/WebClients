import { useState } from 'react';

import useControlled from '@proton/hooks/useControlled';

import { generateUID } from '../../helpers';

export interface ModalStateProps {
    key: string;
    open: boolean;
    onClose: () => void;
    onExit: () => void;
}

const useModalState = (options?: { open?: boolean; onClose?: () => void; onExit?: () => void }) => {
    const { open: controlledOpen, onClose, onExit } = options || {};

    const [key, setKey] = useState(() => generateUID());
    const [open, setOpen] = useControlled(controlledOpen);
    const [render, setRender] = useState(open);

    const handleSetOpen = (newValue: boolean) => {
        if (newValue) {
            setOpen(true);
            setRender(true);
        } else {
            setOpen(false);
        }
    };

    const handleClose = () => {
        handleSetOpen(false);
        onClose?.();
    };

    const handleExit = () => {
        setRender(false);
        setKey(generateUID());
        onExit?.();
    };

    const modalProps: ModalStateProps = {
        key,
        open: !!open,
        onClose: handleClose,
        onExit: handleExit,
    };

    return [modalProps, handleSetOpen, render] as const;
};

export default useModalState;
