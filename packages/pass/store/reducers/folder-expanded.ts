import type { Reducer } from 'redux';

import { objectDelete } from '../../utils/object/delete';
import { setFolderExpanded } from '../actions/creators/folder-expanded';

/** Expanded vault and folder ids in the menu, cached so they survive a restart */
type FolderExpandedState = Record<string, true>;

const folderExpandedReducer: Reducer<FolderExpandedState> = (state = {}, action) => {
    if (setFolderExpanded.match(action)) {
        const { id, expanded } = action.payload;
        return expanded ? { ...state, [id]: true } : objectDelete(state, id);
    }

    return state;
};

export default folderExpandedReducer;
