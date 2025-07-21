import { bootstrapEvent } from '@proton/account/bootstrap/action';
import type { SharedStartListening } from '@proton/redux-shared-store-types';

import { registerSessionListener } from './registerSessionListener';
import { type AccountSessionsState } from './slice';
import { writeAccountSessions } from './storage';

export const startHostAccountSessionsListener = (startListening: SharedStartListening<AccountSessionsState>) => {
    startListening({
        actionCreator: bootstrapEvent,
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();
            writeAccountSessions();
            // Needed for signing into non-private users
            registerSessionListener({ type: 'create' });
        },
    });
};
