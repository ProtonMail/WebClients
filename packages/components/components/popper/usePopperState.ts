import { useCallback, useState } from 'react';

import useIsMounted from '@proton/hooks/useIsMounted';

const usePopperState = (onChange?: (state: boolean) => void) => {
    const [isOpen, setOpen] = useState(false);
    const isMounted = useIsMounted();

    const open = useCallback(() => {
        // setState should not occur when the component is unmounted
        if (isMounted()) {
            setOpen(true);
        }
        onChange?.(true);
    }, []);

    const close = useCallback(() => {
        // setState should not occur when the component is unmounted
        if (isMounted()) {
            setOpen(false);
        }
        onChange?.(false);
    }, []);

    const toggle = useCallback(() => {
        return isOpen ? close() : open();
    }, [isOpen]);

    return { isOpen, toggle, open, close };
};

export default usePopperState;
