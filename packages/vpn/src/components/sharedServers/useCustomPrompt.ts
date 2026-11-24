import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

export const useCustomPrompt = (when: boolean, onConfirmNavigation: (path: string) => void) => {
    const history = useHistory();

    useEffect(() => {
        if (!when) {
            return;
        }

        const unblock = history.block((tx) => {
            onConfirmNavigation(tx.pathname);
            return false;
        });

        return () => unblock();
    }, [when, history, onConfirmNavigation]);
};
