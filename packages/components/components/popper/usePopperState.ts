import { useCallback, useState } from 'react';

const usePopperState = (onChange?: (state: boolean) => void) => {
    const [isOpen, setOpen] = useState(false);

    const open = useCallback(() => {
        setOpen(true);
        onChange?.(true);
    }, []);

    const close = useCallback(() => {
        setOpen(false);
        onChange?.(false);
    }, []);

    const toggle = useCallback(() => {
        return isOpen ? close() : open();
    }, [isOpen]);

    return { isOpen, toggle, open, close };
};

export default usePopperState;
