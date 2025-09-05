import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import type { MeetAppStartListening } from './store';

export const start = (startListening: MeetAppStartListening) => {
    startSharedListening(startListening);
};
