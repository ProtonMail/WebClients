import { useEffect } from 'react';
import useMailSettings from './useMailSettings';

const useHotKeys = (callback: () => void) => {
    const [{ Hotkeys }] = useMailSettings();

    useEffect(() => {
        if (Hotkeys) {
            document.addEventListener('keydown', callback, true);
        }

        return () => {
            if (Hotkeys) {
                document.removeEventListener('keydown', callback, true);
            }
        };
    }, [Hotkeys]);

    return null;
};

export default useHotKeys;
