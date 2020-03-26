import { useEffect } from 'react';

const useUnload = (message: string) => {
    useEffect(() => {
        if (!message) {
            return;
        }
        const handleUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = message;
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [message]);
};

export default useUnload;
