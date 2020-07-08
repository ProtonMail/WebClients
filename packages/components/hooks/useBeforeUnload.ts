import { useEffect } from 'react';

const useBeforeUnload = (message: string) => {
    useEffect(() => {
        if (!message) {
            return;
        }
        const handleUnload = (event: BeforeUnloadEvent) => {
            if (event) {
                event.preventDefault();
                event.returnValue = message;
            }
            return message;
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [message]);
};

export default useBeforeUnload;
