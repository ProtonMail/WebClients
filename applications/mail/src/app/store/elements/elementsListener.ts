import { resetRetry } from 'proton-mail/store/elements/elementsActions';
import type { AppStartListening } from 'proton-mail/store/store';

export const startElementsListener = (startListening: AppStartListening) => {
    startListening({
        // When the user is getting back connectivity, we want to reset the retry count so that he can load message list
        predicate: (_, currentState, previousState) => {
            return !currentState.apiStatus.offline && previousState.apiStatus.offline;
        },
        effect: async (_, listenerApi) => {
            listenerApi.dispatch(resetRetry());
        },
    });
};
