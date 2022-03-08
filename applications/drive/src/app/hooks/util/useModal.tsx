import { useState } from 'react';

export const useModal = (onCancel?: () => void) => {
    const [isOpen, setOpen] = useState(true);
    const handleClose = () => {
        setOpen(false);
        onCancel?.();
    };

    return {
        isOpen,
        onClose: handleClose,
    };
};
