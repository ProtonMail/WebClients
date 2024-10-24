import { useEffect } from 'react';

import { c } from 'ttag';

// Prevent loss of unsaved data
const usePreventCloseTab = (condition: boolean): void => {
    const messageAlert = c('Alert')
        .t`Please do not close this tab. Some requests are still being processed in the background.`;

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (condition) {
                event.preventDefault();
                // Browsers do not allow custom messages anymore
                event.returnValue = messageAlert;
                return messageAlert;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [condition]);
};

export default usePreventCloseTab;
