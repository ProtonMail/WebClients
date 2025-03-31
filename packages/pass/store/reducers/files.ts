import type { Reducer } from 'redux';

import { fileRestore, fileUpdateMetadata, filesResolve, itemDeleteRevisions } from '@proton/pass/store/actions';
import type { FileDescriptor, ItemId, Maybe, ShareId } from '@proton/pass/types';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { objectMap } from '@proton/pass/utils/object/map';
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

    if (itemDeleteRevisions.success.match(action)) {
        return objectMap(state, (shareId, itemFiles) => {
            if (action.payload.shareId !== shareId) return itemFiles;
            else if (itemFiles) return objectDelete(itemFiles, action.payload.itemId);
        });
    }

    return state;
};

export default reducer;
