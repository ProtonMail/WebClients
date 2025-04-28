import type { AppStartListening } from '../store';
import { loadIncomingDefaults } from './incomingDefaultsActions';

export const startIncomingDefaultListener = (startListening: AppStartListening) => {
    startListening({
        predicate: (_, currentState) => {
            return currentState.incomingDefaults.status === 'not-loaded';
        },
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();

            try {
                await listenerApi.dispatch(loadIncomingDefaults());
            } catch (e) {
                listenerApi.subscribe();
            }
        },
    });
};
