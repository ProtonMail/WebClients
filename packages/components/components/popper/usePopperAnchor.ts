import { useRef, useState } from 'react';

const usePopperAnchor = <T extends HTMLElement>() => {
    const anchorRef = useRef<T>(null);
    const [isOpen, setOpen] = useState(false);

    const open = () => setOpen(true);
    const close = () => setOpen(false);
    const toggle = () => (isOpen ? close() : open());

    return { anchorRef, isOpen, toggle, open, close };
};

export default usePopperAnchor;
