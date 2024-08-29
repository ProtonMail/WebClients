import { useEffect } from 'react';
import type { TouchEvent } from 'react';

import { useHandler } from '@proton/components/hooks';

const useTriggerDiscardModal = (callback: () => void) => {
    const handler = useHandler((event: MouseEvent | TouchEvent) => {
        const target = event.target as Node;

        if (target instanceof HTMLElement && (target.closest('.sidebar') || target.closest('.group-button'))) {
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

export default useTriggerDiscardModal;
