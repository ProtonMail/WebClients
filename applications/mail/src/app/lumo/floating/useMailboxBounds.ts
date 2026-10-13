import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

export const MAILBOX_BOUNDS_CLASS = 'lumo-floating-panel-bounds';

/** The mailbox between the folder sidebar and the drawer rail, found inside `PrivateMainArea` by its marker class. */
export const useMailboxBounds = (mainAreaRef: RefObject<HTMLElement>) => {
    const [bounds, setBounds] = useState<DOMRect | null>(null);

    useEffect(() => {
        const element = mainAreaRef.current?.querySelector(`.${MAILBOX_BOUNDS_CLASS}`);
        if (!element) {
            return;
        }

        const measure = () => {
            setBounds(element.getBoundingClientRect());
        };
        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(element);
        window.addEventListener('resize', measure);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [mainAreaRef]);

    return bounds;
};
