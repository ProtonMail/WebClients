import type { Reducer } from 'redux';

import { fileRestore, fileUpdateMetadata, filesResolve } from '@proton/pass/store/actions';
import type { FileDescriptor, ItemId, Maybe, ShareId } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';

export type FilesState = Record<ShareId, Maybe<Record<ItemId, FileDescriptor[]>>>;

const reducer: Reducer<FilesState> = (state = {}, action) => {
    if (filesResolve.success.match(action)) {
        const { shareId, itemId, files } = action.payload;
        const existing = state[shareId]?.[itemId];
        if (files.length === 0 && (existing?.length ?? 0) === 0) return state;
        return merge(state, { [shareId]: { [itemId]: files } });
    }

    /** FIXME: we should optimistically update files when editing/creating
     * an item as well for immediate feedback in UI */
    if (fileRestore.success.match(action)) {
        const { shareId, itemId, files } = action.payload;
        const existing = state[shareId]?.[itemId];
        if (!existing) return state;
        return merge(state, { [shareId]: { [itemId]: [...existing, ...files] } });
    }

    if (fileUpdateMetadata.success.match(action)) {
        const { shareId, itemId, ...newFile } = action.payload;

        if (shareId && itemId) {
            const existing = state[shareId]?.[itemId];
            const update = existing?.map((file) => (file.fileID === newFile.fileID ? newFile : file));
            return update ? merge(state, { [shareId]: { [itemId]: update } }) : state;
        }
    }

    return state;
};

export default reducer;
