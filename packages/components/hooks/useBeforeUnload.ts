import { useEffect } from 'react';
import busy from '@proton/shared/lib/busy'

const useBeforeUnload = (message?: string | boolean) => {
    useEffect(() => {
        if (!message) {
            return;
        }

        const handleUnload = (event: BeforeUnloadEvent) => {
            const computedMessage = message === true ? '' : message
            if (event) {
                event.preventDefault();
                event.returnValue = computedMessage;
            }
            return computedMessage;
        };
        const unregister = busy.register()
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            unregister()
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [message]);
};

export default useBeforeUnload;
