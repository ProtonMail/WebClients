import groupBy from 'lodash/groupBy';
import { call, put, select } from 'redux-saga/effects';

import chunk from '@proton/utils/chunk';

import { MIN_MAX_BATCH_PER_REQUEST } from '../../../constants';
import { foldersDeletedEvent, foldersUpdated } from '../../../store/actions';
import { selectShareFolders } from '../../../store/selectors';
import type { FolderData, ShareId, SyncEventShareFolderOutput } from '../../../types';
import type { FolderDataResponse } from '../../../types/api';
import { prop } from '../../../utils/fp/lens';
import { PassCrypto } from '../../crypto';
import { getFolderAndDescendantIds } from '../../folders/folder.utils';
import { fetchFolder, parseFoldersInOrder } from '../../folders/folders.requests';
import type { EventProcessor } from '../types';

type FetchedFolder = { shareId: ShareId; folder: FolderDataResponse };

/** Same strategy as `processItemsUpdated`: processes folder updates
 * (including create/rename/move), dispatching `foldersUpdated` per share.
 * Every folder is fetched before any is decrypted: a folder key is encrypted with
 * its parent folder key, and a parent/child pair can land in the same event, so
 * `parseFoldersInOrder` resolves parents first. Folders that still fail to decrypt
 * are omitted from the dispatch without blocking the parent event cursor. Any
 * failed fetch flips the result to `false` so the batch is retried on the next poll. */
export function* processFoldersUpdated(updated: SyncEventShareFolderOutput[]): EventProcessor {
    if (updated.length === 0) return true;
    let processed = true;

    const fetched: FetchedFolder[] = [];

    for (const batch of chunk(updated, MIN_MAX_BATCH_PER_REQUEST)) {
        const results: PromiseSettledResult<FetchedFolder>[] = yield call(() =>
            Promise.allSettled(
                batch.map(async ({ ShareID, FolderID }) => ({
                    shareId: ShareID,
                    folder: await fetchFolder(ShareID, FolderID),
                }))
            )
        );

        const fulfilled = results
            .filter((res): res is PromiseFulfilledResult<FetchedFolder> => res.status === 'fulfilled')
            .map(prop('value'));

        if (fulfilled.length < batch.length) processed = false;
        fetched.push(...fulfilled);
    }

    const byShareId = groupBy(fetched, prop('shareId'));

    for (const shareId in byShareId) {
        const folders: FolderData[] = yield call(parseFoldersInOrder, shareId, byShareId[shareId].map(prop('folder')));
        if (folders.length > 0) yield put(foldersUpdated(folders));
    }

    return processed;
}

/** Processes folder deletions, grouped by `ShareID`. BE only returns the top deleted
 * folder without subfolders, so we search and delete the subfolders too. */
export function* processFoldersDeleted(deleted: SyncEventShareFolderOutput[]): EventProcessor {
    if (deleted.length === 0) return true;

    const byShareID = groupBy(deleted, prop('ShareID'));

    for (const shareId in byShareID) {
        const shareFolders: Record<string, FolderData> = yield select(selectShareFolders(shareId));
        const folderIds = new Set<string>();
        for (const { FolderID } of byShareID[shareId]) {
            getFolderAndDescendantIds(shareFolders, FolderID).forEach((id) => folderIds.add(id));
        }
        PassCrypto.removeFolderKeys(shareId, [...folderIds]);
        yield put(foldersDeletedEvent(shareId, [...folderIds]));
    }

    return true;
}
