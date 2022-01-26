import { useCallback, useRef, useState } from 'react';

const usePopperAnchor = <T extends HTMLElement>() => {
    const anchorRef = useRef<T>(null);
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

    return { anchorRef, isOpen, toggle, open, close };
};

export default usePopperAnchor;
