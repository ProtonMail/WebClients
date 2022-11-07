import { useCallback, useState } from 'react';

const usePopperState = () => {
    const [isOpen, setOpen] = useState(false);

    const open = useCallback(() => {
        setOpen(true);
    }, []);

    const close = useCallback(() => {
        setOpen(false);
    }, []);

    const toggle = useCallback(() => {
        return isOpen ? close() : open();
    }, [isOpen]);

    return { isOpen, toggle, open, close };
};

export default usePopperState;
