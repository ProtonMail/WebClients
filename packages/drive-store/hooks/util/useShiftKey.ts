import { useEffect, useRef } from 'react';

export const useShiftKey = () => {
    const shiftRef = useRef(false);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                shiftRef.current = true;
            }
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') {
                shiftRef.current = false;
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    return () => shiftRef.current;
};
