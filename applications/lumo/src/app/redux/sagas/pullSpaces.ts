import type { SagaIterator } from 'redux-saga';
import { all, call, delay, getContext, put, select } from 'redux-saga/effects';

import type { LumoApi } from '../../remote/api';
import type { ListSpacesRemote } from '../../remote/types';
import { listify } from '../../util/collections';
import { isoToUnixTimestamp } from '../../util/date';
import { selectSpaceById } from '../selectors';
import {
    locallyDeleteAttachmentFromRemoteRequest,
    locallyRefreshShallowAttachmentFromRemoteRequest,
} from '../slices/core/attachments';
import { locallyRefreshConversationFromRemoteRequest } from '../slices/core/conversations';
import { pullSpacesFailure, pullSpacesSuccess } from '../slices/core/spaces';
import { refreshConversationFromRemote, softDeleteConversationFromRemote } from './conversations';
import { refreshSpaceFromRemote, softDeleteSpaceFromRemote } from './spaces';

/** Runs one item's saga so a failure is logged without stopping the rest of the page. */
function* isolated(run: () => SagaIterator<unknown>): SagaIterator<void> {
    try {
        yield call(run);
    } catch (error) {
        console.error('Error applying a pulled space page item:', error);
    }
}

/**
 * Applies one page of the space list and returns once its spaces and chats are in Redux.
 * Spaces go first because refreshing a chat waits for its space.
 */
function* applyPullSpacesPage(page: ListSpacesRemote): SagaIterator<void> {
    console.log('Saga triggered: applyPullSpacesPage', page);
    const { spaces, deletedSpaces, conversations, deletedConversations, assets, deletedAssets } = page;
    yield all([
        ...listify(deletedSpaces).map(({ id }) => call(isolated, () => softDeleteSpaceFromRemote({ payload: id }))),
        ...listify(spaces).map((space) => call(isolated, () => refreshSpaceFromRemote({ payload: space }))),
    ]);

    const chats = [];
    for (const conversation of listify(conversations)) {
        // A chat whose space could not be loaded would wait for it forever, so it must not block the pull.
        if (yield select(selectSpaceById(conversation.spaceId))) {
            chats.push(call(isolated, () => refreshConversationFromRemote({ payload: conversation })));
        } else {
            yield put(locallyRefreshConversationFromRemoteRequest(conversation));
        }
    }
    yield all([
        ...listify(deletedConversations).map(({ id }) =>
            call(isolated, () => softDeleteConversationFromRemote({ payload: id }))
        ),
        ...chats,
    ]);

    // Attachments are not needed to list chats, so they keep loading in the background.
    for (const asset of listify(deletedAssets)) {
        yield put(locallyDeleteAttachmentFromRemoteRequest(asset.id));
    }
    for (const asset of listify(assets)) {
        // The startup pull lists every space, so it does not fetch full attachments.
        yield put(locallyRefreshShallowAttachmentFromRemoteRequest({ ...asset, requestFull: false }));
    }
}

/**
 * Pulls every space page by page. `pullSpacesSuccess` is only sent after each page's spaces and chats
 * are in Redux, so readers of `lastSpacesPullAt`, such as the chat export, see the complete list.
 */
export function* pullSpaces(): SagaIterator<void> {
    console.log('Saga triggered: pullSpaces');
    try {
        const lumoApi: LumoApi = yield getContext('lumoApi');
        let lastTimestamp: number | undefined;

        while (true) {
            const listSpacesArgs = lastTimestamp ? { createTimeUntil: lastTimestamp } : undefined;
            const pageResult: ListSpacesRemote = yield call([lumoApi, lumoApi.listSpaces], listSpacesArgs);
            yield call(applyPullSpacesPage, pageResult);

            // Use the raw page's oldest CreateTime: spaces skipped during conversion still advance the cursor.
            if (!pageResult.oldestCreatedAt) break;
            const newLastTimestamp = isoToUnixTimestamp(pageResult.oldestCreatedAt);

            if (lastTimestamp && newLastTimestamp >= lastTimestamp) break;

            lastTimestamp = newLastTimestamp;
            yield delay(1000);
        }

        yield put(pullSpacesSuccess());
    } catch (e) {
        console.error('Error pulling spaces:', e);
        yield put(pullSpacesFailure());
    }
}
