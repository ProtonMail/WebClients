import { endSearchSession, startSearchSession } from '@proton/encrypted-search/searchSession';

import { isSameSearch } from '../../helpers/elements';
import { selectIsSearchActive, selectSearch } from '../elements/elementsSelectors';
import type { AppStartListening } from '../store';

export const startSearchChangeListener = (startListening: AppStartListening) => {
    startListening({
        predicate: (_action, currentState, previousState) => {
            return selectSearch(currentState) !== selectSearch(previousState);
        },
        effect: (_action, listenerApi) => {
            const previousState = listenerApi.getOriginalState();
            const currentState = listenerApi.getState();

            const wasSearching = selectIsSearchActive(previousState);
            const isSearching = selectIsSearchActive(currentState);

            const isSame = isSameSearch(selectSearch(previousState), selectSearch(currentState));

            if (!wasSearching && isSearching) {
                startSearchSession();
                return;
            }

            if (wasSearching && isSearching && !isSame) {
                endSearchSession(listenerApi.extra.api, 'newSearch');
                startSearchSession();
                return;
            }

            if (wasSearching && !isSearching) {
                endSearchSession(listenerApi.extra.api, 'navigation');
            }
        },
    });
};
