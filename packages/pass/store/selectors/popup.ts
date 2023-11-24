import type { Maybe, TabId } from '@proton/pass/types';

import type { PopupTabState } from '../reducers';
import type { State } from '../types';

export const selectPopupStateTabIds = (state: State): TabId[] =>
    Object.keys(state.popup.tabs).map((val) => parseInt(val, 10));

export const selectPopupTabState =
    (tabId: TabId) =>
    (state: State): Maybe<PopupTabState> =>
        state.popup.tabs?.[tabId];

export const selectPopupFilters = (state: State) => state.popup.filters;
