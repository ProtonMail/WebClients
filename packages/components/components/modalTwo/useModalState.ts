import { useState } from 'react';

import { useControlled } from '../../hooks';

const useModalState = (options?: { open?: boolean; onClose?: () => void; onExit?: () => void }) => {
    const { open: controlledOpen, onClose, onExit } = options || {};

    const [key, setKey] = useState(0);

    const [open, setOpen] = useControlled(controlledOpen);

    const handleClose = () => {
        setOpen(false);
        onClose?.();
    };

    const handleExit = () => {
        setKey(key + 1);
        onExit?.();
    };

    const modalProps = {
        key,
        open,
        onClose: handleClose,
        onExit: handleExit,
    };

    return [modalProps, setOpen] as const;
};

export default useModalState;
