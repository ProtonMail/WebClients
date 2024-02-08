import { createLogStore } from '@proton/pass/lib/logger/store';
import { registerLoggerEffect } from '@proton/pass/utils/logger';

export const logStore = createLogStore(localStorage);

registerLoggerEffect(logStore.push);
window.addEventListener('beforeunload', () => logStore.flush());
