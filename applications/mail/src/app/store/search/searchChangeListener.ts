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

            if (wasSearching && isSearching && !isSame) {
                console.log('newSearch');
            }

            if (wasSearching && !isSearching) {
                console.log('navigation');
            }
        },
    });
};
