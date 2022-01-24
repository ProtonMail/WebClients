import { useCallback, useContext, useRef, useState } from 'react';

import { TooltipContext } from '../..';

const usePopperAnchor = <T extends HTMLElement>(uid?: string) => {
    const anchorRef = useRef<T>(null);
    const [isOpen, setOpen] = useState(false);
    const tooltipContext = useContext(TooltipContext);

    const open = useCallback(() => {
        if (uid && tooltipContext) {
            tooltipContext.setTooltip(uid);
        }
        setOpen(true);
    }, []);

    const close = useCallback(() => {
        if (uid && tooltipContext) {
            tooltipContext.setTooltip('');
        }
        setOpen(false);
    }, []);

    const toggle = useCallback(() => {
        return isOpen ? close() : open();
    }, [isOpen]);

    return { anchorRef, isOpen, toggle, open, close };
};

export default usePopperAnchor;
