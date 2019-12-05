import { useEffect } from 'react';

const useUnload = (message) => {
    useEffect(() => {
        if (!message) {
            return;
        }
        const handleUnload = (event) => {
            event.preventDefault();
            event.returnValue = message;
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        }
    }, [message]);
};

export default useUnload;
