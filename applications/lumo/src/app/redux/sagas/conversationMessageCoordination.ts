import type { SagaIterator } from 'redux-saga';
import { call, fork, getContext, put, select, take } from 'redux-saga/effects';

import type { DbApi } from '../../indexedDb/db';
import type { LocalId, RemoteMessage } from '../../remote/types';
import type { Attachment, Conversation, Message, SerializedMessage } from '../../types';
import { selectAttachmentById, selectConversationById, selectMessageById } from '../selectors';
import { addConversation } from '../slices/core/conversations';
import { pullMessageRequest } from '../slices/core/messages';
import { considerRequestingFullAttachment } from './attachments';

export function* waitForConversation(localId: LocalId): SagaIterator<Conversation> {
    const type = 'conversation';
    console.log(`Saga triggered: waitForConversation: ${type} ${localId}`);
    const mapped: Conversation | undefined = yield select(selectConversationById(localId));
    if (mapped) {
        console.log(`waitForConversation: requested ${type} ${localId} -> found immediately, returning value`);
        return mapped;
    }
    console.log(`waitForConversation: requested ${type} ${localId} -> not ready, waiting`);
    const { payload: resource }: ReturnType<typeof addConversation> = yield take(
        (a: any) => a.type === addConversation.type && a.payload.id === localId
    );
    console.log(`waitForConversation: requested ${type} ${localId} -> now available, returning value ${resource}`);
    return resource;
}

export function* considerRequestingFullMessage({
    payload: remoteMessage,
}: {
    payload: RemoteMessage;
}): SagaIterator<any> {
    console.log('Saga triggered: considerRequestingFullMessage', remoteMessage);
    const dbApi: DbApi = yield getContext('dbApi');
    const { id: localId } = remoteMessage;

    const idbMessage: SerializedMessage | undefined = yield call([dbApi, dbApi.getMessageById], localId);
    if (idbMessage && idbMessage.encrypted) {
        console.log(`considerRequestingMessage: Message ${localId} is already filled locally, not requesting`);
        const message: Message | undefined = yield select(selectMessageById(localId));
        for (const { id, spaceId } of message?.attachments ?? []) {
            const attachment: Attachment | undefined = yield select(selectAttachmentById(id));
            if (spaceId && !attachment) {
                yield fork(considerRequestingFullAttachment, { payload: { id, spaceId } });
            }
        }
        return;
    }
    console.log(`considerRequestingMessage: Message ${localId} will be requested`);
    yield put(pullMessageRequest(remoteMessage));
}
