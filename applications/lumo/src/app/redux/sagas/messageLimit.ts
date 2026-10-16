import type { PayloadAction } from '@reduxjs/toolkit';
import type { SagaIterator } from 'redux-saga';
import { call, getContext, put } from 'redux-saga/effects';

import type { DbApi } from '../../indexedDb/db';
import type { ConversationId } from '../../types';
import type { ResourceLimitError } from '../slices/meta/errors';
import { hydrateMessageLimitReached, isConversationMessageLimitError } from '../slices/meta/errors';

export function* loadMessageLimitReached(): SagaIterator {
    try {
        const dbApi: DbApi = yield getContext('dbApi');
        const conversationIds: ConversationId[] = yield call(dbApi.localFlags.getMessageLimitReachedConversationIds);
        if (conversationIds.length > 0) {
            yield put(hydrateMessageLimitReached(conversationIds));
        }
    } catch (e) {
        console.warn('loadMessageLimitReached: failed to read message limit flags', e);
    }
}

export function* persistMessageLimitReached({
    payload,
}: PayloadAction<Omit<ResourceLimitError, 'id' | 'timestamp'>>): SagaIterator {
    if (!isConversationMessageLimitError(payload)) {
        return;
    }
    try {
        const dbApi: DbApi = yield getContext('dbApi');
        yield call(dbApi.localFlags.markMessageLimitReached, payload.conversationId);
    } catch (e) {
        console.warn('persistMessageLimitReached: failed to save message limit flag', e);
    }
}

/** Handles both an explicit unlock and the conversation being deleted. */
export function* persistMessageLimitCleared({ payload: conversationId }: PayloadAction<ConversationId>): SagaIterator {
    try {
        const dbApi: DbApi = yield getContext('dbApi');
        yield call(dbApi.localFlags.clearMessageLimitReached, conversationId);
    } catch (e) {
        console.warn('persistMessageLimitCleared: failed to clear message limit flag', e);
    }
}

export function* persistAllMessageLimitsCleared(): SagaIterator {
    try {
        const dbApi: DbApi = yield getContext('dbApi');
        yield call(dbApi.localFlags.clearAllMessageLimitReached);
    } catch (e) {
        console.warn('persistAllMessageLimitsCleared: failed to clear message limit flags', e);
    }
}
