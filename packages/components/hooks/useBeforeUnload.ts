import { useEffect } from 'react';

const useBeforeUnload = (message: string) => {
    useEffect(() => {
        const handleUnload = (event: BeforeUnloadEvent) => {
            if (event) {
                event.preventDefault();
                event.returnValue = message;
            }
            return message;
        };
        if (!message) {
            window.removeEventListener('beforeunload', handleUnload);
            return;
        }
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [message]);
};

export default useBeforeUnload;
