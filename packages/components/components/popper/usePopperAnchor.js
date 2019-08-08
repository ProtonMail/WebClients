import { useRef, useState } from 'react';

const usePopperAnchor = () => {
    const anchorRef = useRef();
    const [isOpen, setOpen] = useState(false);

    const open = () => setOpen(true);
    const close = () => setOpen(false);
    const toggle = () => (isOpen ? close() : open());

    return { anchorRef, isOpen, toggle, open, close };
};

export default usePopperAnchor;
