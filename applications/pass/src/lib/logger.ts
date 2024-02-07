import { createLogStore } from '@proton/pass/lib/logger/store';
import { logger } from '@proton/pass/utils/logger';

export const logStore = createLogStore(localStorage);

logger.setLogOptions({
    onLog: async (log, originalLog) => {
        if (ENV === 'development') originalLog(log);
        logStore.push(log);
    },
});

window.addEventListener('beforeunload', () => logStore.flush());
