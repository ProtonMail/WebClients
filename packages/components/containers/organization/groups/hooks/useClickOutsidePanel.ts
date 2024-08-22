import { useEffect } from 'react';
import type { RefObject, TouchEvent } from 'react';

import { useHandler } from '@proton/components/hooks';

const useClickOutsidePanel = (ref: RefObject<HTMLElement>, callback: () => void) => {
    const handler = useHandler((event: MouseEvent | TouchEvent) => {
        const target = event.target as Node;

        if (target instanceof HTMLElement && (target.closest('.dropdown') || target.closest('.modal-two'))) {
            return;
        }

        if (ref.current && !ref.current.contains(event.target as Node)) {
            callback();
        }
    });

    useEffect(() => {
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
        };
    }, []);
};

export default useClickOutsidePanel;
